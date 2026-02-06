const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', protect, reviewController.createReview);

// @route   GET /api/reviews/admin/all
// @desc    Get all reviews (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), reviewController.getAllReviews);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review (Admin only)
// @access  Private/Admin
router.delete('/:reviewId', protect, authorize('admin'), reviewController.deleteReview);

// @route   GET /api/reviews/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get('/:productId', reviewController.getProductReviews);

// @route   POST /api/reviews/:reviewId/reply
// @desc    Reply to a review (Admin only)
// @access  Private/Admin
router.post('/:reviewId/reply', protect, authorize('admin'), reviewController.replyToReview);

// @route   GET /api/reviews/stats/:productId
// @desc    Get review statistics for a product
// @access  Public
router.get('/stats/:productId', reviewController.getReviewStats);

module.exports = router;
