/**
 * Auth Service
 * Business logic for user authentication
 */

const userDao = require('../dao/user.dao');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('./email.service');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * Register new user
 * @param {Object} userData - title, description, etc.
 * @returns {Object} { user, token }
 */
const register = async (userData) => {
  const { username, email, password, fullName } = userData;

  // Check if user already exists
  const existingUser = await userDao.findByEmailOrUsername(email, username);

  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Create new user (password will be hashed by model pre-save hook)
  const user = await userDao.create({
    username,
    email,
    password,
    fullName,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationTokenExpires,
    isEmailVerified: false
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, verificationToken);
  } catch (error) {
    // If email fails, we might want to delete the user or handle it.
    // For now, we'll just log it, but ideally we should rollback.
    // But since this is a simple implementation:
    console.error('Failed to send verification email:', error);
  }

  // Do not return token yet, user must verify email
  return { user, message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.' };
};

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Object} { user, token }
 */
const login = async (email, password) => {
  // Check if user exists
  const user = await userDao.findByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account has been deactivated');
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new Error('Vui lòng xác thực email trước khi đăng nhập');
  }

  // Verify password using model method
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Get current user
 * @param {string} userId
 * @returns {Object} user
 */
const getCurrentUser = async (userId) => {
  const user = await userDao.findById(userId, '-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Helper to generate unique username
 */
function generateUniqueUsername(displayName) {
  const baseUsername = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${baseUsername}${randomSuffix}`;
}

/**
 * Login/Register with Google
 * @param {Object} googleData
 * @returns {Object} { user, token }
 */
const googleLogin = async (googleData) => {
  const { googleId, email, fullName, avatar } = googleData;

  // Check if user exists with Google ID
  let user = await userDao.findByGoogleId(googleId);

  if (!user) {
    // Check if user exists with same email
    user = await userDao.findByEmail(email);

    if (user) {
      // Link Google account to existing user
      await userDao.updateById(user._id, {
        googleId,
        authProvider: 'google',
        avatar: user.avatar || avatar
      });
      user = await userDao.findById(user._id);
    } else {
      // Create new user
      const username = generateUniqueUsername(fullName || email.split('@')[0]);
      
      user = await userDao.create({
        googleId,
        email,
        username,
        fullName: fullName || email.split('@')[0],
        avatar,
        authProvider: 'google',
        isActive: true
      });
    }
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account has been deactivated');
  }

  const token = generateToken(user._id);
  return { user, token };
};

/**
 * Generate token for user (used for callback flow)
 * @param {Object} user
 * @returns {string} token
 */
const generateUserToken = (user) => {
  return generateToken(user._id);
};

/**
 * Verify email with token
 * @param {string} token
 * @returns {Object} { user, token }
 */
const verifyEmail = async (token) => {
  // Find user with matching token and unexpired date
  // Using generic find from DAO since we don't have findOneByToken
  const users = await userDao.find({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!users || users.length === 0) {
    throw new Error('Link xác thực không hợp lệ hoặc đã hết hạn');
  }

  const user = users[0];

  // Update user as verified and clear token
  const updatedUser = await userDao.updateById(user._id, {
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null
  });

  // Generate token for auto-login after verification
  const jwtToken = generateToken(updatedUser._id);

  return { user: updatedUser, token: jwtToken };
};

module.exports = {
  register,
  login,
  getCurrentUser,
  googleLogin,
  generateUserToken,
  verifyEmail
};
