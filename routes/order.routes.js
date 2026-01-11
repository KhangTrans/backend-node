const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  createOrder,
  buyNow,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics
} = require('../controllers/order.controller');

// User routes (require authentication)
// @route   POST /api/orders/buy-now
// @desc    Buy product directly from product detail page
// @access  Private
router.post('/buy-now', protect, buyNow);

// @route   POST /api/orders
// @desc    Create order from cart
// @access  Private
router.post('/', protect, createOrder);

// @route   GET /api/orders/my
// @desc    Get user's orders
// @access  Private
router.get('/my', protect, getMyOrders);

// @route   GET /api/orders/:orderId
// @desc    Get order detail
// @access  Private
router.get('/:orderId', protect, getOrderById);

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put('/:orderId/cancel', protect, cancelOrder);

// Admin routes
// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin)
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), getAllOrders);

// @route   GET /api/orders/admin/statistics
// @desc    Get order statistics
// @access  Private/Admin
router.get('/admin/statistics', protect, authorize('admin'), getOrderStatistics);

// @route   PUT /api/orders/admin/:orderId/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put('/admin/:orderId/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
