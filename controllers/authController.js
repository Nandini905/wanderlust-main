const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Generate JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register user
const register = async (req, res) => {
  try {
    // Allow basic demo flow when DB is disabled
    if (String(process.env.ALLOW_NO_DB).toLowerCase() === 'true') {
      const { username, email } = req.body;
      const token = generateToken('demo-user-id');
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: 'demo-user-id',
          username: username || 'demo',
          email: email || 'demo@example.com',
          firstName: null,
          lastName: null,
          isHost: false,
          avatar: null
        }
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isHost: user.isHost,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Allow basic demo flow when DB is disabled
    if (String(process.env.ALLOW_NO_DB).toLowerCase() === 'true') {
      const { email } = req.body;
      const token = generateToken('demo-user-id');
      return res.json({
        success: true,
        token,
        user: {
          id: 'demo-user-id',
          username: 'demo',
          email: email || 'demo@example.com',
          firstName: null,
          lastName: null,
          isHost: false,
          avatar: null
        }
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isHost: user.isHost,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, location, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        bio,
        location,
        phone
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Become a host
const becomeHost = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isHost: true },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      user,
      message: 'You are now a host! You can start creating listings.'
    });
  } catch (error) {
    console.error('Become host error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  becomeHost
};
