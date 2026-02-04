const authService = require('../services/auth.service');
const userDao = require('../dao/user.dao');
const { validationResult } = require('express-validator');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user._id,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role
        },
        token: result.token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    // Handle simplified errors from service
    const status = error.message === 'Username or email already exists' ? 400 : 500;
    
    res.status(status).json({ 
      success: false,
      message: error.message || 'Error registering user',
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user._id,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role
        },
        token: result.token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const status = (error.message === 'Invalid credentials' || error.message === 'Account has been deactivated') ? 401 : 500;
    
    res.status(status).json({ 
      success: false,
      message: error.message || 'Error logging in',
      error: error.message 
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    const status = error.message === 'User not found' ? 404 : 500;

    res.status(status).json({ 
      success: false,
      message: error.message || 'Error getting user data',
      error: error.message 
    });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Public (for testing - should be protected in production)
exports.getAllUsers = async (req, res) => {
  try {
    // Keeping direct DAO usage here for now as it's a simple admin/test endpoint
    // It should ideally be in user.controller.js
    const users = await userDao.findAll('-password', { createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting users',
      error: error.message 
    });
  }
};

// @desc    Google OAuth callback handler
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res) => {
  try {
    // User is already authenticated by Passport
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Check if user is active
    if (!user.isActive) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_deactivated`);
    }

    // Generate JWT token from service
    const token = authService.generateUserToken(user);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// @desc    Google OAuth login (API response for mobile/SPA)
// @route   POST /api/auth/google/token
// @access  Public
exports.googleTokenLogin = async (req, res) => {
  try {
    const { googleId, email } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google ID and email are required'
      });
    }

    const result = await authService.googleLogin(req.body);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: result.user._id,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          avatar: result.user.avatar,
          role: result.user.role,
          authProvider: result.user.authProvider
        },
        token: result.token
      }
    });
  } catch (error) {
    console.error('Google token login error:', error);
    const status = error.message === 'Account has been deactivated' ? 401 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Error logging in with Google',
      error: error.message
    });
  }
};

