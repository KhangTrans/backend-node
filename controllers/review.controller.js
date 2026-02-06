const reviewService = require('../services/review.service');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    const review = await reviewService.addReview(userId, productId, rating, comment);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(error.message === 'Bạn đã đánh giá sản phẩm này rồi' ? 400 : 500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewService.getReviewsByProduct(productId);

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;
    const stats = await reviewService.getReviewStats(productId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const adminId = req.user.id; // From middleware

    const updatedReview = await reviewService.replyToReview(reviewId, adminId, comment);

    res.json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const result = await reviewService.getAllReviews(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting all reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    await reviewService.deleteReview(reviewId);
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
