const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/cache.middleware');

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('categoryId')
    .optional()
    .isInt()
    .withMessage('Category ID must be an integer'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('variants')
    .optional()
    .isArray()
    .withMessage('Variants must be an array')
];

// Routes
router.post('/', protect, authorize('admin'), invalidateCacheMiddleware('products:*'), productValidation, productController.createProduct);
router.get('/', cacheMiddleware('products', 300), productController.getAllProducts);
router.get('/slug/:slug', cacheMiddleware('product-slug', 300), productController.getProductBySlug);
router.get('/:id', cacheMiddleware('product', 300), productController.getProduct);
router.put('/:id', protect, authorize('admin'), invalidateCacheMiddleware(['products:*', 'product:*', 'product-slug:*']), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), invalidateCacheMiddleware(['products:*', 'product:*', 'product-slug:*']), productController.deleteProduct);

module.exports = router;
