const recommendationService = require('../services/recommendation.service');

/**
 * Recommendation Controller - API Handlers
 * Handles HTTP requests for product recommendations
 */

// @desc    Get similar products based on a product
// @route   GET /api/recommendations/similar/:productId
// @access  Public
const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const result = await recommendationService.getSimilarProducts(productId, limit);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getSimilarProducts:', error);
    const statusCode = error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
const getTrendingProducts = async (req, res) => {
  try {
    const { limit, days } = req.query;

    const result = await recommendationService.getTrendingProducts(limit, days);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getTrendingProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get new arrival products
// @route   GET /api/recommendations/new-arrivals
// @access  Public
const getNewArrivals = async (req, res) => {
  try {
    const { limit, days } = req.query;

    const result = await recommendationService.getNewArrivals(limit, days);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getNewArrivals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/recommendations/by-category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit, exclude } = req.query;

    const result = await recommendationService.getProductsByCategory(
      categoryId,
      exclude,
      limit
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    const statusCode = error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get best rated products
// @route   GET /api/recommendations/best-rated
// @access  Public
const getBestRatedProducts = async (req, res) => {
  try {
    const { limit } = req.query;

    const result = await recommendationService.getBestRatedProducts(limit);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getBestRatedProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getSimilarProducts,
  getTrendingProducts,
  getNewArrivals,
  getProductsByCategory,
  getBestRatedProducts
};
