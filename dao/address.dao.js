const CustomerAddress = require('../models/CustomerAddress.model');

/**
 * Address DAO - Data Access Object layer
 * Handles all database operations related to addresses
 */

// Find all addresses by userId, sorted by default and creation date
const findByUserId = async (userId) => {
  return await CustomerAddress.find({ userId })
    .sort({ isDefault: -1, createdAt: -1 });
};

// Find address by ID
const findById = async (addressId) => {
  return await CustomerAddress.findById(addressId);
};

// Find one address matching criteria
const findOne = async (criteria) => {
  return await CustomerAddress.findOne(criteria);
};

// Count addresses by userId
const countByUserId = async (userId) => {
  return await CustomerAddress.countDocuments({ userId });
};

// Create new address
const create = async (addressData) => {
  return await CustomerAddress.create(addressData);
};

// Update address by ID
const updateById = async (addressId, updateData) => {
  return await CustomerAddress.findByIdAndUpdate(
    addressId,
    updateData,
    { new: true }
  );
};

// Update multiple addresses matching criteria
const updateMany = async (criteria, updateData) => {
  return await CustomerAddress.updateMany(criteria, updateData);
};

// Delete address by ID
const deleteById = async (addressId) => {
  return await CustomerAddress.findByIdAndDelete(addressId);
};

// Unset default for all addresses of user
const unsetDefaultAddresses = async (userId, excludeId = null) => {
  const criteria = {
    userId,
    isDefault: true
  };
  
  if (excludeId) {
    criteria._id = { $ne: excludeId };
  }
  
  return await CustomerAddress.updateMany(criteria, { isDefault: false });
};

// Find first address of user sorted by creation date
const findFirstByUserId = async (userId) => {
  return await CustomerAddress.findOne({ userId })
    .sort({ createdAt: 1 });
};

// Find default address of user
const findDefaultByUserId = async (userId) => {
  return await CustomerAddress.findOne({
    userId,
    isDefault: true
  });
};

module.exports = {
  findByUserId,
  findById,
  findOne,
  countByUserId,
  create,
  updateById,
  updateMany,
  deleteById,
  unsetDefaultAddresses,
  findFirstByUserId,
  findDefaultByUserId
};
