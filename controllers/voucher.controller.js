const Voucher = require('../models/Voucher.model');
const User = require('../models/User.model');

// Get all vouchers (admin)
const getAllVouchers = async (req, res) => {
  try {
    const { type, isActive, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [vouchers, total] = await Promise.all([
      Voucher.find(where)
        .populate('userId', 'id username email')
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Voucher.countDocuments(where)
    ]);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách voucher',
      error: error.message
    });
  }
};

// Get public vouchers (user can see)
const getPublicVouchers = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user?.id;
    const now = new Date();

    const orConditions = [{ userId: null }]; // Always include public vouchers
    if (userId) {
      orConditions.push({ userId: userId }); // user's private vouchers
    }

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: orConditions
    };

    if (type) {
      query.type = type;
    }

    const vouchers = await Voucher.find(query).sort({ createdAt: -1 });

    // Filter out vouchers that reached usage limit
    const availableVouchers = vouchers.filter(voucher => {
      if (voucher.usageLimit === null) return true;
      return voucher.usedCount < voucher.usageLimit;
    });

    res.json({
      success: true,
      data: availableVouchers
    });
  } catch (error) {
    console.error('Get public vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách voucher',
      error: error.message
    });
  }
};

// Get voucher by ID
const getVoucherById = async (req, res) => {
  try {
    const { voucherId } = req.params;

    const voucher = await Voucher.findById(voucherId).populate('userId', 'id username email');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin voucher',
      error: error.message
    });
  }
};

// Validate and check voucher(s)
const validateVoucher = async (req, res) => {
  try {
    const { code, codes, orderAmount } = req.body; // Support single 'code' or array 'codes'
    const userId = req.user.id;
    const amount = parseFloat(orderAmount) || 0;

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

    if (voucherCodes.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được phép sử dụng tối đa 2 voucher'
      });
    }

    const results = [];
    let discountVoucher = null;
    let shippingVoucher = null;
    let totalDiscount = 0;
    let isFreeShip = false;

    for (const voucherCode of voucherCodes) {
      // Find voucher
      const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Mã voucher '${voucherCode}' không tồn tại`
        });
      }

      // Basic validations
      if (!voucher.isActive) throw new Error(`Voucher '${voucher.code}' không còn hiệu lực`);
      
      const now = new Date();
      if (now < voucher.startDate) throw new Error(`Voucher '${voucher.code}' chưa đến thời gian sử dụng`);
      if (now > voucher.endDate) throw new Error(`Voucher '${voucher.code}' đã hết hạn`);
      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) throw new Error(`Voucher '${voucher.code}' đã hết lượt sử dụng`);
      
      // User restriction
      if (voucher.userId !== null && voucher.userId.toString() !== userId) throw new Error(`Voucher '${voucher.code}' không dành cho bạn`);

      // Min order amount
      if (amount < parseFloat(voucher.minOrderAmount)) throw new Error(`Voucher '${voucher.code}' yêu cầu đơn tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ`);

      // Check usage history
      const Order = require('../models/Order.model');
      const usedOrder = await Order.findOne({
        userId: userId,
        $or: [
            { discountVoucherId: voucher._id },
            { shippingVoucherId: voucher._id }
        ],
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'failed' }
      });

      if (usedOrder) throw new Error(`Bạn đã sử dụng voucher '${voucher.code}' rồi`);

      // Assign to slots
      if (voucher.type === 'DISCOUNT') {
        if (discountVoucher) throw new Error('Chỉ được sử dụng 1 voucher giảm giá đơn hàng');
        discountVoucher = voucher;
      } else if (voucher.type === 'FREE_SHIP') {
        if (shippingVoucher) throw new Error('Chỉ được sử dụng 1 voucher miễn phí vận chuyển');
        shippingVoucher = voucher;
      }
      
      results.push(voucher);
    }

    // Calculate benefits
    if (discountVoucher) {
      let discount = (amount * discountVoucher.discountPercent) / 100;
      if (discountVoucher.maxDiscount) {
        discount = Math.min(discount, parseFloat(discountVoucher.maxDiscount));
      }
      totalDiscount += discount;
    }

    if (shippingVoucher) {
      isFreeShip = true;
    }

    res.json({
      success: true,
      message: 'Voucher hợp lệ',
      data: {
        vouchers: results.map(v => ({
            id: v.id,
            code: v.code,
            type: v.type,
            description: v.description
        })),
        totalDiscount,
        freeShip: isFreeShip
      }
    });

  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(400).json({ // Changed to 400 for logic errors
      success: false,
      message: error.message || 'Lỗi kiểm tra voucher',
    });
  }
};

// Create voucher (admin)
const createVoucher = async (req, res) => {
  try {
    const {
      code,
      type,
      description,
      discountPercent,
      maxDiscount,
      minOrderAmount = 0,
      usageLimit,
      userId,
      startDate,
      endDate,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!code || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Validate voucher type
    if (!['DISCOUNT', 'FREE_SHIP'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại voucher không hợp lệ'
      });
    }

    // Validate DISCOUNT type
    if (type === 'DISCOUNT') {
      if (!discountPercent || discountPercent < 1 || discountPercent > 100) {
        return res.status(400).json({
          success: false,
          message: 'Phần trăm giảm giá phải từ 1-100'
        });
      }
    }

    // Check if code already exists
    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });

    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã tồn tại'
      });
    }

    // Create voucher
    const voucherData = {
      code: code.toUpperCase(),
      type,
      description,
      minOrderAmount: parseFloat(minOrderAmount),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      userId: userId ? parseInt(userId) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive
    };

    if (type === 'DISCOUNT') {
      voucherData.discountPercent = parseInt(discountPercent);
      if (maxDiscount) {
        voucherData.maxDiscount = parseFloat(maxDiscount);
      }
    }

    const voucher = await Voucher.create(voucherData);
    await voucher.populate('userId', 'id username email');

    res.status(201).json({
      success: true,
      message: 'Đã tạo voucher',
      data: voucher
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo voucher',
      error: error.message
    });
  }
};

// Update voucher (admin)
const updateVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const {
      code,
      type,
      description,
      discountPercent,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      userId,
      startDate,
      endDate,
      isActive
    } = req.body;

    // Find voucher
    const existingVoucher = await Voucher.findById(voucherId);

    if (!existingVoucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Check if new code conflicts with another voucher
    if (code && code.toUpperCase() !== existingVoucher.code) {
      const codeExists = await Voucher.findOne({ code: code.toUpperCase() });
      
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher đã tồn tại'
        });
      }
    }

    // Validate DISCOUNT type
    if (type === 'DISCOUNT' || existingVoucher.type === 'DISCOUNT') {
      if (discountPercent !== undefined && (discountPercent < 1 || discountPercent > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Phần trăm giảm giá phải từ 1-100'
        });
      }
    }

    // Prepare update data
    const updateData = {
      ...(code && { code: code.toUpperCase() }),
      ...(type && { type }),
      ...(description !== undefined && { description }),
      ...(minOrderAmount !== undefined && { minOrderAmount: parseFloat(minOrderAmount) }),
      ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit) : null }),
      ...(userId !== undefined && { userId: userId ? parseInt(userId) : null }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(isActive !== undefined && { isActive })
    };

    if (type === 'DISCOUNT' || existingVoucher.type === 'DISCOUNT') {
      if (discountPercent !== undefined) {
        updateData.discountPercent = parseInt(discountPercent);
      }
      if (maxDiscount !== undefined) {
        updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
      }
    }

    const voucher = await Voucher.findByIdAndUpdate(
      voucherId,
      updateData,
      { new: true }
    ).populate('userId', 'id username email');

    res.json({
      success: true,
      message: 'Đã cập nhật voucher',
      data: voucher
    });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật voucher',
      error: error.message
    });
  }
};

// Delete voucher (admin)
const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;

    // Check if voucher exists
    const voucher = await Voucher.findById(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Check if voucher is used in orders - need to import Order model
    const Order = require('../models/Order.model');
    const orderCount = await Order.countDocuments({
      $or: [
        { discountVoucherId: voucherId },
        { shippingVoucherId: voucherId }
      ]
    });

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa voucher đã được sử dụng trong ${orderCount} đơn hàng. Bạn có thể tắt trạng thái thay vì xóa.`
      });
    }

    await Voucher.findByIdAndDelete(voucherId);

    res.json({
      success: true,
      message: 'Đã xóa voucher'
    });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa voucher',
      error: error.message
    });
  }
};

// Get voucher statistics (admin)
const getVoucherStats = async (req, res) => {
  try {
    const [total, active, expired, totalUsageResult, byType] = await Promise.all([
      Voucher.countDocuments(),
      Voucher.countDocuments({ isActive: true }),
      Voucher.countDocuments({
        endDate: { $lt: new Date() }
      }),
      Voucher.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$usedCount' }
          }
        }
      ]),
      Voucher.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalUsage = totalUsageResult.length > 0 ? totalUsageResult[0].total : 0;

    res.json({
      success: true,
      data: {
        total,
        active,
        expired,
        totalUsage,
        byType: byType.map(item => ({
          type: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get voucher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê voucher',
      error: error.message
    });
  }
};

// Collect voucher (user)
const collectVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only allow 'user' role to collect vouchers
    if (userRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ khách hàng mới có thể thu thập voucher'
      });
    }

    // Check if voucher exists
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Check if voucher is active
    if (!voucher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Voucher không còn hiệu lực'
      });
    }

    // Check expiration date
    const now = new Date();
    if (now > voucher.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết hạn sử dụng'
      });
    }

    // Check usage limit
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết lượt sử dụng'
      });
    }

    // Check if user already collected this voucher
    const user = await User.findById(userId);
    if (user.savedVouchers.includes(voucherId)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã lưu voucher này rồi'
      });
    }

    // Check (Double-check) if user has already used this voucher in the past
    // Prevent collecting if already used code directly
    const Order = require('../models/Order.model');
    const usedOrder = await Order.findOne({
      userId: userId,
      $or: [
        { discountVoucherId: voucher._id },
        { shippingVoucherId: voucher._id }
      ],
      orderStatus: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' }
    });

    if (usedOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã sử dụng voucher này rồi, không thể lưu thêm'
      });
    }

    // Add voucher to user's saved list
    await User.findByIdAndUpdate(userId, {
      $push: { savedVouchers: voucherId }
    });

    res.json({
      success: true,
      message: 'Đã lưu voucher vào ví'
    });
  } catch (error) {
    console.error('Collect voucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu voucher',
      error: error.message
    });
  }
};

// Get my vouchers (user)
const getMyVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const user = await User.findById(userId).populate({
      path: 'savedVouchers',
      match: {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      },
      options: { sort: { createdAt: -1 } }
    });

    // Also get valid vouchers assigned directly to user via userId field in Voucher
    const assignedVouchers = await Voucher.find({
      userId: userId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 });
    
    const saved = user.savedVouchers || [];
    const assigned = assignedVouchers || [];
    
    // Merge: Create a map by ID to deduplicate
    const allVouchersMap = new Map();
    saved.forEach(v => allVouchersMap.set(v.id, v));
    assigned.forEach(v => allVouchersMap.set(v.id, v));

    const allVouchers = Array.from(allVouchersMap.values());

    res.json({
      success: true,
      data: allVouchers
    });
  } catch (error) {
    console.error('Get my vouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách voucher của bạn',
      error: error.message
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
