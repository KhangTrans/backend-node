const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/cache.middleware');

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters'),
  body('slug')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('imageUrl')
    .optional()
    .trim()
];

// Routes
router.post('/', protect, authorize('admin'), invalidateCacheMiddleware('categories:*'), categoryValidation, categoryController.createCategory);
router.get('/', cacheMiddleware('categories', 600), categoryController.getAllCategories);
router.get('/slug/:slug', cacheMiddleware('category-slug', 600), categoryController.getCategoryBySlug);
router.get('/:id', cacheMiddleware('category', 600), categoryController.getCategory);
router.put('/:id', protect, authorize('admin'), invalidateCacheMiddleware(['categories:*', 'category:*', 'category-slug:*']), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), invalidateCacheMiddleware(['categories:*', 'category:*', 'category-slug:*']), categoryController.deleteCategory);

module.exports = router;
