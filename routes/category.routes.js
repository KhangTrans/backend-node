const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

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
router.post('/', protect, authorize('admin'), categoryValidation, categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategory);
router.put('/:id', protect, authorize('admin'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
