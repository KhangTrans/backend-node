const voucherService = require('../services/voucher.service');

// Get all vouchers (admin)
const getAllVouchers = async (req, res) => {
  try {
    const { type, isActive, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const options = {
      skip: parseInt(skip),
      limit: parseInt(limit),
      search
    };

    // Service handles business logic
    const result = await voucherService.getAllVouchers(filter, options);

    res.json({
      success: true,
      data: result.vouchers,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all vouchers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách voucher'
    });
  }
};

// Get public vouchers (user can see)
const getPublicVouchers = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user?.id;

    const filter = type ? { type } : {};
    
    // Service handles business logic
    const vouchers = await voucherService.getVouchersForUser(userId, filter);

    res.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    console.error('Get public vouchers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách voucher'
    });
  }
};

// Get voucher by ID
const getVoucherById = async (req, res) => {
  try {
    const { voucherId } = req.params;

    // Service handles business logic
    const voucher = await voucherService.getVoucherById(voucherId);

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    const statusCode = error.message === 'Voucher not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Validate and check voucher(s)
const validateVoucher = async (req, res) => {
  try {
    const { code, codes, orderAmount } = req.body;
    const userId = req.user.id;

    let voucherCodes = [];
    if (codes && Array.isArray(codes)) {
      voucherCodes = codes;
    } else if (code) {
      voucherCodes = [code];
    }

    if (voucherCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã voucher'
      });
    }

    // Service handles all validation logic
    const result = await voucherService.validateAndApplyVoucher(
      voucherCodes,
      userId,
      parseFloat(orderAmount) || 0
    );

    res.json({
      success: true,
      message: 'Voucher hợp lệ',
      data: result
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi kiểm tra voucher'
    });
  }
};

// Create voucher (admin)
const createVoucher = async (req, res) => {
  try {
    // Service handles all validation and creation logic
    const voucher = await voucherService.createVoucher(req.body);

    res.status(201).json({
      success: true,
      message: 'Đã tạo voucher',
      data: voucher
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    const statusCode = error.message.includes('đã tồn tại') || 
                       error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Update voucher (admin)
const updateVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;

    // Service handles all validation and update logic
    const voucher = await voucherService.updateVoucher(voucherId, req.body);

    res.json({
      success: true,
      message: 'Đã cập nhật voucher',
      data: voucher
    });
  } catch (error) {
    console.error('Update voucher error:', error);
    
    let statusCode = 500;
    if (error.message.includes('không tìm thấy')) statusCode = 404;
    if (error.message.includes('đã tồn tại') || error.message.includes('không hợp lệ')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Delete voucher (admin)
const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;

    // Service handles validation and deletion logic
    await voucherService.deleteVoucher(voucherId);

    res.json({
      success: true,
      message: 'Đã xóa voucher'
    });
  } catch (error) {
    console.error('Delete voucher error:', error);
    
    let statusCode = 500;
    if (error.message.includes('không tìm thấy')) statusCode = 404;
    if (error.message.includes('đã được sử dụng')) statusCode = 400;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// Get voucher statistics (admin)
const getVoucherStats = async (req, res) => {
  try {
    // Service handles statistics logic
    const stats = await voucherService.getVoucherStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get voucher stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê voucher'
    });
  }
};

// Collect voucher (user)
const collectVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    await voucherService.collectVoucher(userId, userRole, voucherId);

    res.json({
      success: true,
      message: 'Đã lưu voucher vào ví'
    });
  } catch (error) {
    console.error('Collect voucher error:', error);
    let statusCode = 500;
    if (error.message === 'Voucher not found' || error.message === 'Không tìm thấy voucher') statusCode = 404;
    if (error.message.includes('đã lưu') || error.message.includes('hết')) statusCode = 400;
    if (error.message.includes('khách hàng')) statusCode = 403;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi khi lưu voucher'
    });
  }
};

// Get my vouchers (user)
const getMyVouchers = async (req, res) => {
  try {
    const allVouchers = await voucherService.getMyVouchers(req.user.id);

    res.json({
      success: true,
      data: allVouchers
    });
  } catch (error) {
    console.error('Get my vouchers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách voucher của bạn'
    });
  }
};

module.exports = {
  getAllVouchers,
  getPublicVouchers,
  getVoucherById,
  validateVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getVoucherStats,
  collectVoucher,
  getMyVouchers
};
