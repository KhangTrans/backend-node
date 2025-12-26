const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/cache.middleware');

// Public routes (with authentication)
router.get('/public', protect, cacheMiddleware('vouchers-public', 300), voucherController.getPublicVouchers);
router.post('/validate', protect, voucherController.validateVoucher);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), voucherController.getAllVouchers);
router.get('/admin/stats', protect, authorize('admin'), cacheMiddleware('vouchers-stats', 60), voucherController.getVoucherStats);
router.get('/admin/:voucherId', protect, authorize('admin'), voucherController.getVoucherById);
router.post('/admin', protect, authorize('admin'), invalidateCacheMiddleware(['vouchers-*']), voucherController.createVoucher);
router.put('/admin/:voucherId', protect, authorize('admin'), invalidateCacheMiddleware(['vouchers-*']), voucherController.updateVoucher);
router.delete('/admin/:voucherId', protect, authorize('admin'), invalidateCacheMiddleware(['vouchers-*']), voucherController.deleteVoucher);

module.exports = router;
