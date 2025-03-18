const Post = require('../models/Post');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');

exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.body.image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const postData = {
      userId: req.user.userId,
      image: req.body.image,
      description: req.body.description || '',
      location: req.body.location || {
        name: 'Unknown Location',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      },
      weather: req.body.weather || {
        temp: 0,
        description: 'Unknown',
        icon: 'unknown'
      },
      travelTips: req.body.travelTips || []
    };

    const post = new Post(postData);
    await post.save();

    // Update user's post count
    await Profile.findOneAndUpdate(
      { userId: req.user.userId },
      { $inc: { 'stats.totalPosts': 1 } }
    );

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username profileImage fullName');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

exports.getFollowedPosts = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get the list of users that the current user follows
    const userProfile = await Profile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Get posts from followed users
    const posts = await Post.find({ userId: { $in: userProfile.following } })
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName')
      .sort({ createdAt: -1 });

    // Add isLiked and isSaved fields for the current user
    const enhancedPosts = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.includes(req.user.userId);
      postObj.isSaved = post.savedBy.includes(req.user.userId);
      return postObj;
    });

    res.json(enhancedPosts);
  } catch (error) {
    console.error('Get followed posts error:', error);
    res.status(500).json({ message: 'Failed to fetch followed posts' });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get the list of users that the current user follows
    const userProfile = await Profile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Get posts from non-followed users
    const posts = await Post.find({ userId: { $nin: userProfile.following } })
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName')
      .sort({ createdAt: -1 });

    // Add isLiked and isSaved fields for the current user
    const enhancedPosts = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.includes(req.user.userId);
      postObj.isSaved = post.savedBy.includes(req.user.userId);
      return postObj;
    });

    res.json(enhancedPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId })
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName')
      .sort({ createdAt: -1 });

    // Add isLiked and isSaved fields for the current user
    const enhancedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (req.user) {
        postObj.isLiked = post.likes.includes(req.user.userId);
        postObj.isSaved = post.savedBy.includes(req.user.userId);
      }
      return postObj;
    });

    res.json(enhancedPosts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    console.log('Like post request:', { postId, userId });

    // Validate postId
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      console.error('Invalid post ID:', postId);
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Find post and populate necessary fields
    const post = await Post.findById(postId)
      .populate('userId', 'username profileImage fullName');

    if (!post) {
      console.error('Post not found:', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Found post:', post._id);

    const hasLiked = post.likes.includes(userId);
    if (hasLiked) {
      // Unlike
      console.log('Removing like');
      post.likes = post.likes.filter(id => id.toString() !== userId);
      
      // Update profile stats
      await Profile.findOneAndUpdate(
        { userId: post.userId._id },
        { $inc: { 'stats.totalLikes': -1 } }
      );
    } else {
      // Like
      console.log('Adding like');
      post.likes.push(userId);
      
      // Update profile stats
      await Profile.findOneAndUpdate(
        { userId: post.userId._id },
        { $inc: { 'stats.totalLikes': 1 } }
      );
      
      // Create notification for post owner
      if (post.userId._id.toString() !== userId) {
        try {
          await createNotification(
            post.userId._id,
            userId,
            'like',
            { postId: post._id }
          );
        } catch (notifError) {
          console.error('Notification creation error:', notifError);
          // Don't fail the like operation if notification fails
        }
      }
    }

    await post.save();

    // Re-fetch the post to get updated data
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName');

    const postObj = updatedPost.toObject();
    postObj.isLiked = updatedPost.likes.includes(userId);
    postObj.isSaved = updatedPost.savedBy.includes(userId);

    console.log('Successfully processed like/unlike');
    res.json(postObj);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ 
      message: 'Failed to like post',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

exports.savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const hasSaved = post.savedBy.includes(userId);
    if (hasSaved) {
      // Unsave
      post.savedBy.pull(userId);
    } else {
      // Save
      post.savedBy.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName');

    const postObj = updatedPost.toObject();
    postObj.isLiked = updatedPost.likes.includes(userId);
    postObj.isSaved = updatedPost.savedBy.includes(userId);

    res.json(postObj);
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Failed to save post' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    console.log('Adding comment - Request details:', {
      postId,
      userId,
      text,
      user: req.user,
      headers: req.headers
    });

    // Validate inputs
    if (!text || !text.trim()) {
      console.log('Comment validation failed: Empty text');
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      console.log('Comment validation failed: Invalid post ID', postId);
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      console.log('Comment failed: Post not found', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Found post:', {
      postId: post._id,
      currentComments: post.comments.length
    });

    // Create new comment
    const newComment = {
      userId,
      text: text.trim(),
      createdAt: new Date()
    };

    console.log('Created new comment object:', newComment);

    // Add comment to post
    post.comments.push(newComment);
    console.log('Added comment to post array, new length:', post.comments.length);

    // Save the post
    const savedPost = await post.save();
    console.log('Saved post with new comment:', {
      postId: savedPost._id,
      newCommentsLength: savedPost.comments.length,
      lastComment: savedPost.comments[savedPost.comments.length - 1]
    });

    // Create notification for post owner
    if (post.userId.toString() !== userId) {
      try {
        await createNotification(
          post.userId,
          userId,
          'comment',
          { postId: post._id }
        );
        console.log('Created notification for post owner');
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the comment operation if notification fails
      }
    }

    // Fetch updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName');

    if (!updatedPost) {
      console.log('Error: Could not fetch updated post after comment');
      return res.status(500).json({ message: 'Error fetching updated post' });
    }

    console.log('Successfully fetched updated post:', {
      postId: updatedPost._id,
      commentsCount: updatedPost.comments.length
    });

    const postObj = updatedPost.toObject();
    postObj.isLiked = updatedPost.likes.includes(userId);
    postObj.isSaved = updatedPost.savedBy.includes(userId);

    res.json(postObj);
  } catch (error) {
    console.error('Add comment error - Full details:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the comment index
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment owner or post owner
    const comment = post.comments[commentIndex];
    if (comment.userId.toString() !== userId && post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove the comment using pull
    post.comments.pull({ _id: commentId });
    await post.save();

    // Return updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName');

    const postObj = updatedPost.toObject();
    postObj.isLiked = updatedPost.likes.includes(userId);
    postObj.isSaved = updatedPost.savedBy.includes(userId);

    res.json(postObj);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    // Update user's post count
    await Profile.findOneAndUpdate(
      { userId: req.user.userId },
      { $inc: { 'stats.totalPosts': -1 } }
    );

    res.json({ message: 'Post deleted successfully', deletedPostId: postId });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const posts = await Post.find({ savedBy: req.user.userId })
      .populate('userId', 'username profileImage fullName')
      .populate('comments.userId', 'username profileImage fullName')
      .sort({ createdAt: -1 });

    // Add isLiked and isSaved fields
    const enhancedPosts = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.includes(req.user.userId);
      postObj.isSaved = true; // Since these are saved posts
      return postObj;
    });

    res.json(enhancedPosts);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ message: 'Failed to fetch saved posts' });
  }
}; 