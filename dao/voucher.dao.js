const Voucher = require('../models/Voucher.model');

/**
 * Voucher DAO - Data Access Object layer
 * Handles all database operations related to vouchers
 */

// Find all vouchers with pagination
const findAll = async (filter = {}, options = {}) => {
  const {
    skip = 0,
    limit = 20,
    sort = { createdAt: -1 }
  } = options;

  return await Voucher.find(filter)
    .populate('userId', 'id username email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Count vouchers
const count = async (filter = {}) => {
  return await Voucher.countDocuments(filter);
};

// Find voucher by ID
const findById = async (voucherId, populateUser = true) => {
  let query = Voucher.findById(voucherId);
  if (populateUser) {
    query = query.populate('userId', 'id username email');
  }
  return await query;
};

// Find voucher by code
const findByCode = async (code) => {
  return await Voucher.findOne({ code: code.toUpperCase() });
};

// Create new voucher
const create = async (voucherData) => {
  return await Voucher.create(voucherData);
};

// Update voucher by ID
const updateById = async (voucherId, updateData) => {
  return await Voucher.findByIdAndUpdate(
    voucherId,
    updateData,
    { new: true }
  ).populate('userId', 'id username email');
};

// Delete voucher by ID
const deleteById = async (voucherId) => {
  return await Voucher.findByIdAndDelete(voucherId);
};

// Increment usage count
const incrementUsageCount = async (voucherId) => {
  return await Voucher.findByIdAndUpdate(
    voucherId,
    { $inc: { usedCount: 1 } }
  );
};

// Find public vouchers (available for all users)
const findPublicVouchers = async (additionalFilter = {}) => {
  const now = new Date();
  
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    userId: null,
    ...additionalFilter
  };

  return await Voucher.find(query).sort({ createdAt: -1 });
};

// Find vouchers for user (including public and user-specific)
const findForUser = async (userId, additionalFilter = {}) => {
  const now = new Date();
  
  const orConditions = [{ userId: null }];
  if (userId) {
    orConditions.push({ userId: userId });
  }

  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: orConditions,
    ...additionalFilter
  };

  return await Voucher.find(query).sort({ createdAt: -1 });
};

// Find vouchers assigned to specific user
const findByUserId = async (userId, filter = {}) => {
  const now = new Date();
  
  return await Voucher.find({
    userId: userId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    ...filter
  }).sort({ createdAt: -1 });
};

// Get voucher statistics
const getStats = async () => {
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

  return {
    total,
    active,
    expired,
    totalUsage: totalUsageResult.length > 0 ? totalUsageResult[0].total : 0,
    byType: byType.map(item => ({
      type: item._id,
      count: item.count
    }))
  };
};

module.exports = {
  findAll,
  count,
  findById,
  findByCode,
  create,
  updateById,
  deleteById,
  incrementUsageCount,
  findPublicVouchers,
  findForUser,
  findByUserId,
  getStats
};
