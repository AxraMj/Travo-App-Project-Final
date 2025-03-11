const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    console.log('Received registration request');
    const { fullName, email, password, accountType, username, profileImage } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !accountType) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Additional validation for creator accounts
    if (accountType === 'creator' && !username) {
      return res.status(400).json({ 
        message: 'Username is required for creator accounts' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        message: 'Email already registered' 
      });
    }

    // Check username uniqueness for all accounts
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ 
          message: 'Username already taken' 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user object
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      accountType,
      username, // Store username for all account types
      profileImage: profileImage || 'https://via.placeholder.com/150'
    };

    // Create and save user
    const user = new User(userData);
    await user.save();

    // Create profile for the user
    const profileData = {
      userId: user._id,
      bio: '',
      location: '',
      socialLinks: {},
      interests: [],
      stats: {
        totalPosts: 0,
        totalGuides: 0,
        totalLikes: 0
      }
    };

    const profile = new Profile(profileData);
    await profile.save();

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        accountType: user.accountType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
        username: user.username,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
        username: user.username,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 