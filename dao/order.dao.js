const Order = require('../models/Order.model');

/**
 * Order DAO - Data Access Object layer
 * Handles all database operations related to orders
 */

// Find all orders with pagination
const findAll = async (filter = {}, options = {}) => {
  const {
    skip = 0,
    limit = 20,
    sort = { createdAt: -1 }
  } = options;

  return await Order.find(filter)
    .populate('items.productId')
    .populate({
      path: 'userId',
      select: '_id username email'
    })
    .populate('voucherId')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Count orders
const count = async (filter = {}) => {
  return await Order.countDocuments(filter);
};

// Find orders by userId with pagination
const findByUserId = async (userId, filter = {}, options = {}) => {
  const {
    skip = 0,
    limit = 10,
    sort = { createdAt: -1 }
  } = options;

  const where = {
    userId,
    ...filter
  };

  return await Order.find(where)
    .populate('items.productId')
    .populate('voucherId')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Count orders by userId
const countByUserId = async (userId, filter = {}) => {
  return await Order.countDocuments({
    userId,
    ...filter
  });
};

// Find order by ID
const findById = async (orderId) => {
  return await Order.findById(orderId)
    .populate('items.productId')
    .populate('voucherId');
};

// Find order by ID with user populated
const findByIdWithUser = async (orderId) => {
  return await Order.findById(orderId)
    .populate('items.productId')
    .populate({
      path: 'userId',
      select: '_id username email'
    })
    .populate('voucherId');
};

// Find order by order number
const findByOrderNumber = async (orderNumber) => {
  return await Order.findOne({ orderNumber });
};

// Create new order
const create = async (orderData) => {
  return await Order.create(orderData);
};

// Update order by ID
const updateById = async (orderId, updateData) => {
  return await Order.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true }
  );
};

// Save order
const save = async (order) => {
  return await order.save();
};

// Find order with products populated
const findByIdWithProducts = async (orderId) => {
  return await Order.findById(orderId).populate('items.productId');
};

// Check if user has used voucher
const hasUserUsedVoucher = async (userId, vId) => {
  const order = await Order.findOne({
    userId,
    orderStatus: { $ne: 'cancelled' },
    voucherId: vId
  });
  return !!order; // Return boolean
};

// Count orders with voucher
const countWithVoucher = async (voucherId) => {
  return await Order.countDocuments({
    voucherId: voucherId
  });
};

// Get order statistics
const getStatistics = async () => {
  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    shippingOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'processing' }),
    Order.countDocuments({ orderStatus: 'shipping' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
  ]);

  return {
    totalOrders,
    ordersByStatus: {
      pending: pendingOrders,
      processing: processingOrders,
      shipping: shippingOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders
    },
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

// Update order status
const updateStatus = async (orderId, orderStatus, paymentStatus = null) => {
  const updateData = { orderStatus };
  
  // Update tracking timestamps
  if (orderStatus === 'shipping') {
    updateData.shippedAt = new Date();
  } else if (orderStatus === 'delivered') {
    updateData.deliveredAt = new Date();
  } else if (orderStatus === 'cancelled') {
    updateData.cancelledAt = new Date();
  }
  
  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
    }
  }

  return await Order.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true }
  );
};

module.exports = {
  findAll,
  count,
  findByUserId,
  countByUserId,
  findById,
  findByIdWithUser,
  findByOrderNumber,
  create,
  updateById,
  save,
  findByIdWithProducts,
  hasUserUsedVoucher,
  countWithVoucher,
  getStatistics,
  updateStatus
};
