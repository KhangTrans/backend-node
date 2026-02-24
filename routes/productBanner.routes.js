const express = require('express');
const router = express.Router();
const productBannerController = require('../controllers/productBanner.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const admin = authorize('admin');

// ========== PUBLIC ROUTES ==========

// GET /api/product-banners/active - Get active banners (for frontend display)
router.get('/active', productBannerController.getActiveBanners);

// ========== ADMIN ROUTES ==========

// GET /api/product-banners/admin/all - Get all banners with pagination (admin)
router.get('/admin/all', protect, admin, productBannerController.getAllBanners);

// POST /api/product-banners - Create a new product banner
router.post('/', protect, admin, productBannerController.createBanner);

// PUT /api/product-banners/:id - Update a product banner
router.put('/:id', protect, admin, productBannerController.updateBanner);

// DELETE /api/product-banners/:id - Delete a product banner
router.delete('/:id', protect, admin, productBannerController.deleteBanner);

// POST /api/product-banners/:id/products - Add products to banner
router.post('/:id/products', protect, admin, productBannerController.addProducts);

// DELETE /api/product-banners/:id/products - Remove products from banner
router.delete('/:id/products', protect, admin, productBannerController.removeProducts);

// PATCH /api/product-banners/:id/toggle - Toggle banner active status
router.patch('/:id/toggle', protect, admin, productBannerController.toggleBannerStatus);

// ========== PUBLIC ROUTES (with :id param - must be after /admin/* routes) ==========

// GET /api/product-banners/:id - Get banner details with discounted prices
router.get('/:id', productBannerController.getBannerById);

module.exports = router;
