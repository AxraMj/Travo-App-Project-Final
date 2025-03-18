const User = require('../models/User');
const Profile = require('../models/Profile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');

exports.register = async (req, res, next) => {
  try {
    logger.info('Received registration request', { 
      email: req.body.email,
      accountType: req.body.accountType 
    });

    const { fullName, email, password, accountType, username, profileImage } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !accountType) {
      throw new AppError(400, 'Missing required fields');
    }

    // Additional validation for creator accounts
    if (accountType === 'creator' && !username) {
      throw new AppError(400, 'Username is required for creator accounts');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    // Check username uniqueness for all accounts
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new AppError(409, 'Username already taken');
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
      username,
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

    logger.info('User registered successfully', { 
      userId: user._id,
      accountType: user.accountType 
    });

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
    logger.error('Registration error:', { 
      error: error.message,
      stack: error.stack 
    });
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      throw new AppError(400, 'Please provide both email and password');
    }

    // Check if user exists first
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      // Log the attempt for security monitoring
      logger.warn('Login attempt with non-existent email', { 
        email: email?.toLowerCase(),
        ip: req.ip 
      });
      throw new AppError(401, 'No account found with this email');
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Log failed password attempt
      logger.warn('Failed password attempt', { 
        userId: user._id,
        ip: req.ip 
      });
      throw new AppError(401, 'Incorrect password');
    }

    // If login successful, generate token
    const token = jwt.sign(
      { userId: user._id, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User logged in successfully', { 
      userId: user._id,
      accountType: user.accountType 
    });

    res.json({
      status: 'success',
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
    logger.error('Login error:', { 
      error: error.message,
      stack: error.stack,
      email: req.body.email?.toLowerCase(),
      ip: req.ip
    });
    next(error);
  }
}; 