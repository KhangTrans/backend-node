const User = require('../models/User.model');

/**
 * User DAO - Data Access Object layer
 * Handles all database operations related to users
 */

// Find user by ID
const findById = async (userId, selectFields = null) => {
  let query = User.findById(userId);
  if (selectFields) {
    query = query.select(selectFields);
  }
  return await query;
};

// Find user by email
const findByEmail = async (email) => {
  return await User.findOne({ email });
};

// Find user by email or username
const findByEmailOrUsername = async (email, username) => {
  return await User.findOne({
    $or: [{ email }, { username }]
  });
};

// Find all users
const findAll = async (selectFields = '-password', sortBy = { createdAt: -1 }) => {
  return await User.find()
    .select(selectFields)
    .sort(sortBy);
};

// Find users by query
const find = async (query, selectFields = '-password', sortBy = { createdAt: -1 }) => {
  return await User.find(query)
    .select(selectFields)
    .sort(sortBy);
};

// Create new user
const create = async (userData) => {
  return await User.create(userData);
};

// Update user by ID
const updateById = async (userId, updateData) => {
  return await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  );
};

// Add voucher to user's saved list
const addSavedVoucher = async (userId, voucherId) => {
  return await User.findByIdAndUpdate(userId, {
    $push: { savedVouchers: voucherId }
  });
};

// Check if user has saved voucher
const hasSavedVoucher = async (userId, voucherId) => {
  const user = await User.findById(userId);
  return user?.savedVouchers?.includes(voucherId) || false;
};

// Get user with populated saved vouchers
const findByIdWithVouchers = async (userId, voucherMatch = {}, voucherSort = { createdAt: -1 }) => {
  return await User.findById(userId).populate({
    path: 'savedVouchers',
    match: voucherMatch,
    options: { sort: voucherSort }
  });
};

// Find user by Google ID
const findByGoogleId = async (googleId) => {
  return await User.findOne({ googleId });
};

module.exports = {
  findById,
  findByEmail,
  findByEmailOrUsername,
  findByGoogleId,
  findAll,
  create,
  updateById,
  addSavedVoucher,
  hasSavedVoucher,
  findByIdWithVouchers,
  find
};

