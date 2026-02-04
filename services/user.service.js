/**
 * User Service
 * Business logic for user management (Admin)
 */

const userDao = require('../dao/user.dao');

/**
 * Get users with pagination and filtering
 * @param {Object} query - role, keyword, page, limit
 * @returns {Object} { users, count, total, totalPages, currentPage }
 */
const getUsers = async ({ role, keyword, page = 1, limit = 10 }) => {
  // Build query
  const query = {};
  
  // Filter by role
  if (role) {
    query.role = role;
  }
  
  // Search by keyword (username, email, fullName)
  if (keyword) {
    const searchRegex = new RegExp(keyword, 'i');
    query.$or = [
      { username: searchRegex },
      { email: searchRegex },
      { fullName: searchRegex }
    ];
  }

  // Calculate skip
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // We need to use Model directly for advanced query with pagination
  // Or extend DAO. let's use the Model in service or extend DAO?
  // Ideally service should use DAO. 
  // Let's implement findAll in DAO with more options or use Mongoose model here?
  // Current DAO `findAll` is simple.
  // I should probably update DAO or use Model here. 
  // Since User is simple, I'll use Model here to keep DAO clean or extend DAO.
  // I'll extend DAO usage or implement custom query here. 
  // Actually, let's keep it simple and use the User model directly if needed, or import it.
  // But wait, `userDao` is available.
  
  const User = require('../models/User.model');
  
  // Execute query
  const users = await User.find(query)
    .select('-password') // Exclude password
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  // Get total count
  const total = await User.countDocuments(query);
  
  return {
    users,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page)
  };
};

/**
 * Get user by ID
 * @param {string} userId
 * @returns {Object} user
 */
const getUserById = async (userId) => {
  const user = await userDao.findById(userId, '-password');
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

/**
 * Create new user
 * @param {Object} userData
 * @returns {Object} user
 */
const createUser = async (userData) => {
  const { username, email, password, fullName, role, isActive } = userData;
  
  // Check if user already exists
  const existingUser = await userDao.findByEmailOrUsername(email, username);
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  const user = await userDao.create({
    username,
    email,
    password, // Pre-save hook will hash this
    fullName,
    role: role || 'user',
    isActive: isActive !== undefined ? isActive : true
  });
  
  // Remove password from response
  user.password = undefined;
  
  return user;
};

/**
 * Update user
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Object} user
 */
const updateUser = async (userId, updateData) => {
  const { username, email, fullName, role, isActive, password } = updateData;
  
  let user = await userDao.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if email/username is being changed and if it conflicts
  if (email && email !== user.email) {
    const emailExists = await userDao.findByEmail(email);
    if (emailExists) {
      throw new Error('Email already in use');
    }
    user.email = email;
  }
  
  if (username && username !== user.username) {
    // We don't have findByUsername in DAO but findByEmailOrUsername works if we pass username as both? No.
    // Let's use Model directly or add method to DAO.
    // Using Model for simplicity here as it matches controller logic effectively.
    const User = require('../models/User.model');
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new Error('Username already in use');
    }
    user.username = username;
  }
  
  if (fullName) user.fullName = fullName;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  
  // Handle password update if provided
  if (password) {
    user.password = password; // Pre-save hook will hash this
  }
  
  await user.save();
  
  // Remove password from response
  user.password = undefined;
  
  return user;
};

/**
 * Delete user
 * @param {string} userId
 * @returns {boolean} success
 */
const deleteUser = async (userId) => {
  const User = require('../models/User.model');
  const user = await User.findByIdAndDelete(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return true;
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
