const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');

/**
 * Recommendation Routes
 * All routes are public (no authentication required)
 */

// @route   GET /api/recommendations/similar/:productId
// @desc    Get similar products based on a product
// @access  Public
// @query   limit (optional, default: 10, max: 50)
router.get('/similar/:productId', recommendationController.getSimilarProducts);

// @route   GET /api/recommendations/trending
// @desc    Get trending products
// @access  Public
// @query   limit (optional, default: 10, max: 50)
// @query   days (optional, default: 30, max: 365)
router.get('/trending', recommendationController.getTrendingProducts);

// @route   GET /api/recommendations/new-arrivals
// @desc    Get new arrival products
// @access  Public
// @query   limit (optional, default: 10, max: 50)
// @query   days (optional, default: 30, max: 365)
router.get('/new-arrivals', recommendationController.getNewArrivals);

// @route   GET /api/recommendations/by-category/:categoryId
// @desc    Get products by category
// @access  Public
// @query   limit (optional, default: 10, max: 50)
// @query   exclude (optional, productId to exclude)
router.get('/by-category/:categoryId', recommendationController.getProductsByCategory);

// @route   GET /api/recommendations/best-rated
// @desc    Get best rated products
// @access  Public
// @query   limit (optional, default: 10, max: 50)
router.get('/best-rated', recommendationController.getBestRatedProducts);

module.exports = router;
