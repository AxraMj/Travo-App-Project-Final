import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { postsAPI, profileAPI } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function PostCard({ post, onPostUpdate, onPostDelete }) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [showComments, setShowComments] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const likeScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Update localPost when post prop changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Check if current user is following the post creator
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const profileData = await profileAPI.getProfile(localPost.userId._id);
        setIsFollowing(profileData.followers?.includes(user.id));
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    checkFollowStatus();
  }, [localPost.userId._id]);

  const handleUserPress = (userId) => {
    if (userId === user.id) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId });
    }
  };

  const handleLocationPress = () => {
    if (localPost.location?.coordinates) {
      navigation.navigate('Map', { 
        selectedLocation: localPost.location,
        initialPost: localPost
      });
    }
  };

  // Handle like animation
  const animateScale = (scaleValue) => {
    Animated.sequence([
      Animated.spring(scaleValue, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = async () => {
    try {
      animateScale(likeScale);
      const updatedPost = await postsAPI.likePost(localPost._id);
      setLocalPost(updatedPost);
      if (onPostUpdate) {
        onPostUpdate(updatedPost);
      }
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert(
        'Error',
        'Failed to like post. Please try again.'
      );
    }
  };

  const handleSave = async () => {
    try {
      animateScale(saveScale);
      const updatedPost = await postsAPI.savePost(localPost._id);
      setLocalPost(updatedPost);
      if (onPostUpdate) onPostUpdate(updatedPost);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save post');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Adding comment to post:', {
        postId: localPost._id,
        text: newComment.trim(),
        userId: user?.id
      });
      
      const updatedPost = await postsAPI.addComment(localPost._id, { 
        text: newComment.trim() 
      });
      
      console.log('Comment added successfully, updated post:', updatedPost);
      setLocalPost(updatedPost);
      setNewComment('');
      if (onPostUpdate) onPostUpdate(updatedPost);
      
      // Show success message
      Alert.alert('Success', 'Comment added successfully');
      
      // Close comments modal after successful comment
      setShowComments(false);
    } catch (error) {
      console.error('Comment error details:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // Determine the error message
      let errorMessage = 'Failed to add comment. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Post not found or has been deleted.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to comment.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically update UI
              const updatedComments = localPost.comments.filter(
                comment => comment._id !== commentId
              );
              setLocalPost({
                ...localPost,
                comments: updatedComments
              });

              // Make API call
              const updatedPost = await postsAPI.deleteComment(localPost._id, commentId);
              
              // Update with server response
              setLocalPost(updatedPost);
              if (onPostUpdate) onPostUpdate(updatedPost);
            } catch (error) {
              console.error('Delete comment error:', error);
              // Revert optimistic update on error
              setLocalPost(post);
              Alert.alert(
                'Error',
                'Failed to delete comment. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Handle post deletion
  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postsAPI.deletePost(localPost._id);
              setShowSettings(false);
              if (onPostDelete) {
                onPostDelete(localPost._id);
              }
            } catch (error) {
              console.error('Delete post error:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleFollowPress = async () => {
    if (followLoading) return;
    
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await profileAPI.unfollowUser(localPost.userId._id);
        setIsFollowing(false);
      } else {
        await profileAPI.followUser(localPost.userId._id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update follow status'
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <TouchableOpacity 
        style={styles.commentUserInfo}
        onPress={() => handleUserPress(item.userId._id)}
      >
        <Image
          source={{ uri: item.userId.profileImage }}
          style={styles.commentUserImage}
        />
        <View style={styles.commentContent}>
          <Text style={styles.commentUsername}>{item.userId.username}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </TouchableOpacity>
      
      {(user.id === item.userId._id || user.id === localPost.userId._id) && (
        <TouchableOpacity
          style={styles.deleteCommentButton}
          onPress={() => handleDeleteComment(item._id)}
        >
          <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Settings Modal Component
  const SettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSettings}
      onRequestClose={() => setShowSettings(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSettings(false)}
      >
        <View style={styles.settingsModal}>
          {user?.id === localPost.userId._id && (
            <TouchableOpacity 
              style={styles.settingsOption}
              onPress={handleDeletePost}
            >
              <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.settingsText, { color: '#FF6B6B' }]}>Delete Post</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.settingsOption}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.settingsText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (!localPost) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => handleUserPress(localPost.userId._id)}
        >
          <Image
            source={{ uri: localPost.userId.profileImage }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.username}>@{localPost.userId.username}</Text>
            <Text style={styles.dot}>•</Text>
            <TouchableOpacity onPress={handleLocationPress}>
              <Text style={styles.location}>{localPost.location.name}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {user.id !== localPost.userId._id && route.name !== 'UserProfile' && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
                followLoading && styles.followButtonDisabled
              ]}
              onPress={handleFollowPress}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Image */}
      {localPost.image && (
        <Image 
          source={{ uri: localPost.image }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Post Content */}
      <View style={styles.content}>
        {/* Description */}
        {localPost.description && (
          <Text style={styles.description}>{localPost.description}</Text>
        )}

        {/* Location and Weather */}
        <View style={styles.locationWeather}>
          <TouchableOpacity 
            style={styles.locationContainer}
            onPress={handleLocationPress}
          >
            <Ionicons name="location-sharp" size={14} color="#FF6B6B" />
            <Text style={styles.locationText}>{localPost.location.name}</Text>
          </TouchableOpacity>
          <View style={styles.weatherContainer}>
            <Ionicons name="partly-sunny" size={14} color="#FFD93D" />
            <Text style={styles.temperature}>{localPost.weather.temp}°C</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
          >
            <Ionicons 
              name="chatbubble-outline" 
              size={24} 
              color="rgba(255,255,255,0.7)" 
            />
            <Text style={styles.actionText}>{localPost.comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons 
                name={localPost.isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={localPost.isLiked ? "#FF6B6B" : "rgba(255,255,255,0.7)"} 
              />
            </Animated.View>
            <Text style={styles.actionText}>{localPost.likes.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowTips(!showTips)}
          >
            <Ionicons 
              name="bulb-outline" 
              size={24} 
              color={showTips ? "#FFD93D" : "rgba(255,255,255,0.7)"} 
            />
            <Text style={styles.actionText}>{localPost.travelTips.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSave}
          >
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <Ionicons 
                name={localPost.isSaved ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={localPost.isSaved ? "#FFD93D" : "rgba(255,255,255,0.7)"} 
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Travel Tips Section */}
        {showTips && (
          <View style={styles.tipsSection}>
            <View style={styles.tipsSectionHeader}>
              <Ionicons name="bulb" size={18} color="#FFD93D" />
              <Text style={styles.tipsSectionTitle}>Travel Tips</Text>
            </View>
            {localPost.travelTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowComments(false)}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={localPost.comments}
              renderItem={renderComment}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <Text style={styles.noComments}>No comments yet</Text>
              }
            />

            <View style={styles.commentInput}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" style={styles.submitButton} />
              ) : (
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleComment}
                  disabled={!newComment.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={24} 
                    color={newComment.trim() ? "#FF6B6B" : "rgba(255,255,255,0.3)"} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  location: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  moreButton: {
    padding: 8,
  },
  postImage: {
    width: '100%',
    height: width * 0.6,
  },
  content: {
    padding: 12,
  },
  description: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#4a90e2',
    fontSize: 14,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  temperature: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  tipsSection: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 12,
  },
  tipsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    color: '#FFD93D',
    fontSize: 16,
    marginRight: 8,
    marginTop: -2,
  },
  tipText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#232526',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  deleteCommentButton: {
    padding: 8,
  },
  noComments: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 20,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#ffffff',
    maxHeight: 100,
  },
  submitButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#232526',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingsText: {
    color: '#ffffff',
    fontSize: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1DA1F2',
  },
  followButtonDisabled: {
    opacity: 0.7,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#1DA1F2',
  },
  dot: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
});