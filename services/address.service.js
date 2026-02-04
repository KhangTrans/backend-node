/**
 * Address Service
 * Business logic for user address management
 */

const addressDao = require('../dao/address.dao');

/**
 * Get all addresses of user
 * @param {string} userId
 * @returns {Array} addresses
 */
const getAddresses = async (userId) => {
  return await addressDao.findByUserId(userId);
};

/**
 * Get address by ID
 * @param {string} userId
 * @param {string} addressId
 * @returns {Object} address
 */
const getAddressById = async (userId, addressId) => {
  const address = await addressDao.findById(addressId);

  if (!address) {
    throw new Error('Address not found');
  }

  // Check ownership
  if (address.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to address');
  }

  return address;
};

/**
 * Create new address
 * @param {string} userId
 * @param {Object} addressData
 * @returns {Object} address
 */
const createAddress = async (userId, addressData) => {
  const {
    fullName,
    phoneNumber,
    address,
    city,
    district,
    ward,
    isDefault = false,
    label
  } = addressData;

  // Validate required fields
  if (!fullName || !phoneNumber || !address || !city) {
    throw new Error('Missing required address fields');
  }

  // If setting as default, unset other default addresses
  if (isDefault) {
    await addressDao.unsetDefaultAddresses(userId);
  }

  // If this is first address, make it default
  const addressCount = await addressDao.countByUserId(userId);

  return await addressDao.create({
    userId,
    fullName,
    phoneNumber,
    address,
    city,
    district,
    ward,
    isDefault: addressCount === 0 ? true : isDefault,
    label
  });
};

/**
 * Update address
 * @param {string} userId
 * @param {string} addressId
 * @param {Object} updateData
 * @returns {Object} address
 */
const updateAddress = async (userId, addressId, updateData) => {
  const {
    fullName,
    phoneNumber,
    address,
    city,
    district,
    ward,
    isDefault,
    label
  } = updateData;

  // Find address
  const existingAddress = await addressDao.findById(addressId);

  if (!existingAddress) {
    throw new Error('Address not found');
  }

  // Check ownership
  if (existingAddress.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to address');
  }

  // If setting as default, unset other default addresses
  if (isDefault && !existingAddress.isDefault) {
    await addressDao.unsetDefaultAddresses(userId, addressId);
  }

  // Prepare update object
  const dataToUpdate = {};
  if (fullName) dataToUpdate.fullName = fullName;
  if (phoneNumber) dataToUpdate.phoneNumber = phoneNumber;
  if (address) dataToUpdate.address = address;
  if (city) dataToUpdate.city = city;
  if (district !== undefined) dataToUpdate.district = district;
  if (ward !== undefined) dataToUpdate.ward = ward;
  if (isDefault !== undefined) dataToUpdate.isDefault = isDefault;
  if (label !== undefined) dataToUpdate.label = label;

  return await addressDao.updateById(addressId, dataToUpdate);
};

/**
 * Set default address
 * @param {string} userId
 * @param {string} addressId
 * @returns {Object} address
 */
const setDefaultAddress = async (userId, addressId) => {
  // Find address
  const address = await addressDao.findById(addressId);

  if (!address) {
    throw new Error('Address not found');
  }

  // Check ownership
  if (address.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to address');
  }

  // Unset all default addresses
  await addressDao.unsetDefaultAddresses(userId);

  // Set new default
  return await addressDao.updateById(addressId, { isDefault: true });
};

/**
 * Delete address
 * @param {string} userId
 * @param {string} addressId
 * @returns {boolean} success
 */
const deleteAddress = async (userId, addressId) => {
  // Find address
  const address = await addressDao.findById(addressId);

  if (!address) {
    throw new Error('Address not found');
  }

  // Check ownership
  if (address.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized access to address');
  }

  // Delete address
  await addressDao.deleteById(addressId);

  // If deleted address was default, set another as default
  if (address.isDefault) {
    const firstAddress = await addressDao.findFirstByUserId(userId);

    if (firstAddress) {
      await addressDao.updateById(firstAddress._id, { isDefault: true });
    }
  }

  return true;
};

/**
 * Get default address
 * @param {string} userId
 * @returns {Object} address
 */
const getDefaultAddress = async (userId) => {
  const defaultAddress = await addressDao.findDefaultByUserId(userId);

  if (!defaultAddress) {
    throw new Error('No default address found');
  }

  return defaultAddress;
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getDefaultAddress
};
