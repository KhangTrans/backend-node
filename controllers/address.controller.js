const addressService = require('../services/address.service');

// Get all addresses of user
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await addressService.getAddresses(userId);

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách địa chỉ',
      error: error.message
    });
  }
};

// Get address by ID
const getAddressById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const address = await addressService.getAddressById(userId, addressId);

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Get address error:', error);
    let status = 500;
    if (error.message === 'Address not found') status = 404;
    if (error.message === 'Unauthorized access to address') status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin địa chỉ',
      error: error.message
    });
  }
};

// Create new address
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const newAddress = await addressService.createAddress(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Đã thêm địa chỉ mới',
      data: newAddress
    });
  } catch (error) {
    console.error('Create address error:', error);
    const status = error.message === 'Missing required address fields' ? 400 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi tạo địa chỉ',
      error: error.message
    });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const updatedAddress = await addressService.updateAddress(userId, addressId, req.body);

    res.json({
      success: true,
      message: 'Đã cập nhật địa chỉ',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Update address error:', error);
    let status = 500;
    if (error.message === 'Address not found') status = 404;
    if (error.message === 'Unauthorized access to address') status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật địa chỉ',
      error: error.message
    });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const updatedAddress = await addressService.setDefaultAddress(userId, addressId);

    res.json({
      success: true,
      message: 'Đã đặt làm địa chỉ mặc định',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Set default address error:', error);
    let status = 500;
    if (error.message === 'Address not found') status = 404;
    if (error.message === 'Unauthorized access to address') status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi đặt địa chỉ mặc định',
      error: error.message
    });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    await addressService.deleteAddress(userId, addressId);

    res.json({
      success: true,
      message: 'Đã xóa địa chỉ'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    let status = 500;
    if (error.message === 'Address not found') status = 404;
    if (error.message === 'Unauthorized access to address') status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi xóa địa chỉ',
      error: error.message
    });
  }
};

// Get default address
const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultAddress = await addressService.getDefaultAddress(userId);

    res.json({
      success: true,
      data: defaultAddress
    });
  } catch (error) {
    console.error('Get default address error:', error);
    const status = error.message === 'No default address found' ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi lấy địa chỉ mặc định',
      error: error.message
    });
  }
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
