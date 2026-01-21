const addressDao = require('../dao/address.dao');

// Get all addresses of user
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await addressDao.findByUserId(userId);

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

    const address = await addressDao.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Check ownership
    if (address.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập địa chỉ này'
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin địa chỉ',
      error: error.message
    });
  }
};

// Create new address
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      phoneNumber,
      address,
      city,
      district,
      ward,
      isDefault = false,
      label
    } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // If setting as default, unset other default addresses
    if (isDefault) {
      await addressDao.unsetDefaultAddresses(userId);
    }

    // If this is first address, make it default
    const addressCount = await addressDao.countByUserId(userId);

    const newAddress = await addressDao.create({
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

    res.status(201).json({
      success: true,
      message: 'Đã thêm địa chỉ mới',
      data: newAddress
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo địa chỉ',
      error: error.message
    });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const {
      fullName,
      phoneNumber,
      address,
      city,
      district,
      ward,
      isDefault,
      label
    } = req.body;

    // Find address
    const existingAddress = await addressDao.findById(addressId);

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Check ownership
    if (existingAddress.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền chỉnh sửa địa chỉ này'
      });
    }

    // If setting as default, unset other default addresses
    if (isDefault && !existingAddress.isDefault) {
      await addressDao.unsetDefaultAddresses(userId, addressId);
    }

    // Update address
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (ward !== undefined) updateData.ward = ward;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (label !== undefined) updateData.label = label;

    const updatedAddress = await addressDao.updateById(addressId, updateData);

    res.json({
      success: true,
      message: 'Đã cập nhật địa chỉ',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật địa chỉ',
      error: error.message
    });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Find address
    const address = await addressDao.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Check ownership
    if (address.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập địa chỉ này'
      });
    }

    // Unset all default addresses
    await addressDao.unsetDefaultAddresses(userId);

    // Set new default
    const updatedAddress = await addressDao.updateById(addressId, { isDefault: true });

    res.json({
      success: true,
      message: 'Đã đặt làm địa chỉ mặc định',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt địa chỉ mặc định',
      error: error.message
    });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Find address
    const address = await addressDao.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Check ownership
    if (address.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa địa chỉ này'
      });
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

    res.json({
      success: true,
      message: 'Đã xóa địa chỉ'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa địa chỉ',
      error: error.message
    });
  }
};

// Get default address
const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultAddress = await addressDao.findDefaultByUserId(userId);

    if (!defaultAddress) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có địa chỉ mặc định'
      });
    }

    res.json({
      success: true,
      data: defaultAddress
    });
  } catch (error) {
    console.error('Get default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy địa chỉ mặc định',
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
