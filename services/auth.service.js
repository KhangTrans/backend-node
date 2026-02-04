/**
 * Auth Service
 * Business logic for user authentication
 */

const userDao = require('../dao/user.dao');
const jwt = require('jsonwebtoken');

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

  // Create new user (password will be hashed by model pre-save hook)
  const user = await userDao.create({
    username,
    email,
    password,
    fullName
  });

  // Generate token
  const token = generateToken(user._id);

  return { user, token };
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

module.exports = {
  register,
  login,
  getCurrentUser,
  googleLogin,
  generateUserToken
};
