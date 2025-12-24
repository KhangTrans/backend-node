const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

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
  body('category')
    .optional()
    .trim(),
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
router.post('/', protect, productValidation, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
