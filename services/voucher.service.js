/**
 * Voucher Service - Business Logic Layer
 * Handles business logic for voucher management
 * Schema: type: 'DISCOUNT' | 'FREE_SHIP', discountPercent, minOrderAmount, usageLimit
 */

const voucherDao = require('../dao/voucher.dao');
const orderDao = require('../dao/order.dao');
const userDao = require('../dao/user.dao');

/**
 * Get all vouchers with pagination and search
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Vouchers and pagination info
 */
const getAllVouchers = async (filter = {}, options = {}) => {
  // Handle search
  if (options.search) {
    filter.$or = [
      { code: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } }
    ];
  }

  const vouchers = await voucherDao.findAll(filter, options);
  const total = await voucherDao.count(filter);

  return {
    vouchers,
    pagination: {
      total,
      page: Math.floor((options.skip || 0) / (options.limit || 10)) + 1,
      limit: options.limit || 10,
      totalPages: Math.ceil(total / (options.limit || 10))
    }
  };
};

/**
 * Get voucher by ID
 * @param {String} voucherId - Voucher ID
 * @param {Boolean} populateUser - Whether to populate user info
 * @returns {Promise<Object>} Voucher object
 */
const getVoucherById = async (voucherId, populateUser = true) => {
  const voucher = await voucherDao.findById(voucherId, populateUser);
  
  if (!voucher) {
    throw new Error('Không tìm thấy voucher');
  }

  return voucher;
};

/**
 * Validate and apply voucher(s)
 * @param {Array<String>} codes - Array of voucher codes
 * @param {String} userId - User ID
 * @param {Number} orderAmount - Order total amount
 * @returns {Promise<Object>} Validation result with discount info
 */
const validateAndApplyVoucher = async (codes, userId, orderAmount = 0) => {
  // Validate input
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error('Vui lòng cung cấp mã voucher');
  }

  if (codes.length > 2) {
    throw new Error('Chỉ được phép sử dụng tối đa 2 voucher');
  }

  const results = [];
  let discountVoucher = null;
  let shippingVoucher = null;
  let totalDiscount = 0;
  let isFreeShip = false;

  for (const code of codes) {
    // Ensure code is string
    const voucherCode = String(code).toUpperCase();
    
    // Find voucher by code
    const voucher = await voucherDao.findByCode(voucherCode);

    if (!voucher) {
      throw new Error(`Mã voucher '${voucherCode}' không tồn tại`);
    }

    // Validate voucher status
    if (!voucher.isActive) {
      throw new Error(`Voucher '${voucher.code}' không còn hiệu lực`);
    }

    // Validate dates
    const now = new Date();
    if (now < voucher.startDate) {
      throw new Error(`Voucher '${voucher.code}' chưa đến thời gian sử dụng`);
    }
    if (now > voucher.endDate) {
      throw new Error(`Voucher '${voucher.code}' đã hết hạn`);
    }

    // Validate usage limit
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      throw new Error(`Voucher '${voucher.code}' đã hết lượt sử dụng`);
    }

    // Validate user restriction
    if (voucher.userId && voucher.userId.toString() !== userId.toString()) {
      throw new Error(`Voucher '${voucher.code}' không dành cho bạn`);
    }

    // Validate minimum order amount
    if (orderAmount < parseFloat(voucher.minOrderAmount || 0)) {
      throw new Error(
        `Voucher '${voucher.code}' yêu cầu đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ`
      );
    }

    // Check if user has already used this voucher
    const hasUsed = await orderDao.hasUserUsedVoucher(userId, voucher._id);
    if (hasUsed) {
      throw new Error(`Bạn đã sử dụng voucher '${voucher.code}' rồi`);
    }

    // Assign to slots based on type
    if (voucher.type === 'DISCOUNT') {
      if (discountVoucher) {
        throw new Error('Chỉ được sử dụng 1 voucher giảm giá đơn hàng');
      }
      discountVoucher = voucher;
    } else if (voucher.type === 'FREE_SHIP') {
      if (shippingVoucher) {
        throw new Error('Chỉ được sử dụng 1 voucher miễn phí vận chuyển');
      }
      shippingVoucher = voucher;
    }

    results.push(voucher);
  }

  // Calculate discount
  if (discountVoucher) {
    let discount = (orderAmount * discountVoucher.discountPercent) / 100;
    
    // Apply max discount if exists
    if (discountVoucher.maxDiscount) {
      discount = Math.min(discount, parseFloat(discountVoucher.maxDiscount));
    }
    
    totalDiscount += discount;
  }

  if (shippingVoucher) {
    isFreeShip = true;
  }

  return {
    vouchers: results.map(v => ({
      id: v._id,
      code: v.code,
      type: v.type,
      description: v.description
    })),
    totalDiscount,
    freeShip: isFreeShip
  };
};

/**
 * Create new voucher with validation
 * @param {Object} voucherData - Voucher data
 * @returns {Promise<Object>} Created voucher
 */
const createVoucher = async (voucherData) => {
  // Validate required fields
  if (!voucherData.code || voucherData.code.trim().length === 0) {
    throw new Error('Mã voucher không được để trống');
  }

  if (!voucherData.type || !['DISCOUNT', 'FREE_SHIP'].includes(voucherData.type)) {
    throw new Error('Loại voucher không hợp lệ');
  }

  if (!voucherData.startDate || !voucherData.endDate) {
    throw new Error('Ngày bắt đầu và kết thúc không được để trống');
  }

  // Validate dates
  if (new Date(voucherData.startDate) >= new Date(voucherData.endDate)) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // Validate DISCOUNT type specific fields
  if (voucherData.type === 'DISCOUNT') {
    if (!voucherData.discountPercent || voucherData.discountPercent < 1 || voucherData.discountPercent > 100) {
      throw new Error('Phần trăm giảm giá phải từ 1-100');
    }
  }

  // Check if code already exists
  const existingVoucher = await voucherDao.findByCode(voucherData.code);
  if (existingVoucher) {
    throw new Error('Mã voucher đã tồn tại');
  }

  // Prepare voucher data
  const voucher = {
    code: voucherData.code.toUpperCase(),
    type: voucherData.type,
    description: voucherData.description,
    minOrderAmount: parseFloat(voucherData.minOrderAmount || 0),
    usageLimit: voucherData.usageLimit ? parseInt(voucherData.usageLimit) : null,
    userId: voucherData.userId || null,
    startDate: new Date(voucherData.startDate),
    endDate: new Date(voucherData.endDate),
    isActive: voucherData.isActive !== undefined ? voucherData.isActive : true,
    usedCount: 0
  };

  // Add DISCOUNT specific fields
  if (voucherData.type === 'DISCOUNT') {
    voucher.discountPercent = parseInt(voucherData.discountPercent);
    if (voucherData.maxDiscount) {
      voucher.maxDiscount = parseFloat(voucherData.maxDiscount);
    }
  }

  const created = await voucherDao.create(voucher);
  
  // Populate user if exists
  if (created.userId) {
    await created.populate('userId', '_id username email');
  }
  
  return created;
};

/**
 * Update voucher with validation
 * @param {String} voucherId - Voucher ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated voucher
 */
const updateVoucher = async (voucherId, updateData) => {
  // Check if voucher exists
  const existingVoucher = await voucherDao.findById(voucherId, false);
  
  if (!existingVoucher) {
    throw new Error('Không tìm thấy voucher');
  }

  // Validate code uniqueness if changed
  if (updateData.code && updateData.code.toUpperCase() !== existingVoucher.code) {
    const duplicateVoucher = await voucherDao.findByCode(updateData.code);
    if (duplicateVoucher) {
      throw new Error('Mã voucher đã tồn tại');
    }
  }

  // Validate type
  if (updateData.type && !['DISCOUNT', 'FREE_SHIP'].includes(updateData.type)) {
    throw new Error('Loại voucher không hợp lệ');
  }

  // Validate DISCOUNT type specific fields
  const finalType = updateData.type || existingVoucher.type;
  if (finalType === 'DISCOUNT') {
    if (updateData.discountPercent !== undefined) {
      if (updateData.discountPercent < 1 || updateData.discountPercent > 100) {
        throw new Error('Phần trăm giảm giá phải từ 1-100');
      }
    }
  }

  // Validate dates
  if (updateData.startDate && updateData.endDate) {
    if (new Date(updateData.startDate) >= new Date(updateData.endDate)) {
      throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
    }
  }

  // Prepare update data
  const update = {};
  if (updateData.code) update.code = updateData.code.toUpperCase();
  if (updateData.type) update.type = updateData.type;
  if (updateData.description !== undefined) update.description = updateData.description;
  if (updateData.minOrderAmount !== undefined) update.minOrderAmount = parseFloat(updateData.minOrderAmount);
  if (updateData.usageLimit !== undefined) update.usageLimit = updateData.usageLimit ? parseInt(updateData.usageLimit) : null;
  if (updateData.userId !== undefined) update.userId = updateData.userId || null;
  if (updateData.startDate) update.startDate = new Date(updateData.startDate);
  if (updateData.endDate) update.endDate = new Date(updateData.endDate);
  if (updateData.isActive !== undefined) update.isActive = updateData.isActive;

  // Add DISCOUNT specific fields
  if (finalType === 'DISCOUNT') {
    if (updateData.discountPercent !== undefined) {
      update.discountPercent = parseInt(updateData.discountPercent);
    }
    if (updateData.maxDiscount !== undefined) {
      update.maxDiscount = updateData.maxDiscount ? parseFloat(updateData.maxDiscount) : null;
    }
  }

  return await voucherDao.updateById(voucherId, update);
};

/**
 * Delete voucher
 * @param {String} voucherId - Voucher ID
 * @returns {Promise<Object>} Deleted voucher
 */
const deleteVoucher = async (voucherId) => {
  const voucher = await voucherDao.findById(voucherId, false);
  
  if (!voucher) {
    throw new Error('Không tìm thấy voucher');
  }

  // Check if voucher has been used in orders
  const orderCount = await orderDao.countWithVoucher(voucherId);
  
  if (orderCount > 0) {
    throw new Error(
      `Không thể xóa voucher đã được sử dụng trong ${orderCount} đơn hàng. Bạn có thể tắt trạng thái thay vì xóa.`
    );
  }

  return await voucherDao.deleteById(voucherId);
};

/**
 * Get vouchers for user (public vouchers)
 * @param {String} userId - User ID (optional)
 * @param {Object} additionalFilter - Additional filter criteria
 * @returns {Promise<Array>} Available vouchers
 */
const getVouchersForUser = async (userId = null, additionalFilter = {}) => {
  const vouchers = await voucherDao.findForUser(userId, additionalFilter);
  
  // Filter out vouchers that reached usage limit
  const availableVouchers = vouchers.filter(voucher => {
    if (voucher.usageLimit === null) return true;
    return voucher.usedCount < voucher.usageLimit;
  });

  return availableVouchers;
};

/**
 * Increment voucher usage count
 * @param {String} voucherId - Voucher ID
 * @returns {Promise<Object>} Updated voucher
 */
const incrementUsage = async (voucherId) => {
  return await voucherDao.incrementUsageCount(voucherId);
};

/**
 * Get voucher statistics
 * @returns {Promise<Object>} Voucher statistics
 */
const getVoucherStats = async () => {
  return await voucherDao.getStats();
};

/**
 * Collect voucher (save to user's wallet)
 * @param {String} userId
 * @param {String} userRole
 * @param {String} voucherId
 */
const collectVoucher = async (userId, userRole, voucherId) => {
    if (userRole !== 'user') {
        throw new Error('Chỉ khách hàng mới có thể thu thập voucher');
    }

    const hasSaved = await userDao.hasSavedVoucher(userId, voucherId);
    if (hasSaved) {
        throw new Error('Bạn đã lưu voucher này rồi');
    }

    const voucher = await getVoucherById(voucherId);
    if (!voucher.isActive) throw new Error('Voucher không còn hiệu lực');

    const now = new Date();
    if (now > voucher.endDate) throw new Error('Voucher đã hết hạn sử dụng');
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) throw new Error('Voucher đã hết lượt sử dụng');

    await userDao.addSavedVoucher(userId, voucherId);
};

/**
 * Get My Vouchers
 */
const getMyVouchers = async (userId) => {
    const now = new Date();
    const user = await userDao.findByIdWithVouchers(userId, {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    });

    const filter = {
        userId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    };

    const result = await getAllVouchers(filter, { limit: 100 });
    const saved = user?.savedVouchers || [];
    const assigned = result.vouchers || [];

    const allVouchersMap = new Map();
    saved.forEach(v => allVouchersMap.set(v.id, v));
    assigned.forEach(v => allVouchersMap.set(v.id, v));

    return Array.from(allVouchersMap.values());
};

module.exports = {
  getAllVouchers,
  getVoucherById,
  validateAndApplyVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getVouchersForUser,
  incrementUsage,
  getVoucherStats,
  collectVoucher, // New
  getMyVouchers  // New
};
