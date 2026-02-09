const recommendationDao = require('../dao/recommendation.dao');

/**
 * Recommendation Service - Business Logic Layer
 * Handles business logic for product recommendations
 */

/**
 * Get similar products
 * @param {String} productId - Product ID
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Object>} Recommendation result
 */
const getSimilarProducts = async (productId, limit = 10) => {
  // Validate productId
  if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('ID sản phẩm không hợp lệ');
  }

  // Validate limit
  const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const products = await recommendationDao.getSimilarProducts(productId, validLimit);

  return {
    type: 'similar',
    total: products.length,
    products
  };
};

/**
 * Get trending products
 * @param {Number} limit - Number of products to return
 * @param {Number} days - Number of days to look back
 * @returns {Promise<Object>} Recommendation result
 */
const getTrendingProducts = async (limit = 10, days = 30) => {
  // Validate limit
  const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
  
  // Validate days
  const validDays = Math.min(Math.max(parseInt(days) || 30, 1), 365);

  const products = await recommendationDao.getTrendingProducts(validLimit, validDays);

  return {
    type: 'trending',
    period: `${validDays} days`,
    total: products.length,
    products
  };
};

/**
 * Get new arrival products
 * @param {Number} limit - Number of products to return
 * @param {Number} days - Number of days to consider as "new"
 * @returns {Promise<Object>} Recommendation result
 */
const getNewArrivals = async (limit = 10, days = 30) => {
  // Validate limit
  const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
  
  // Validate days
  const validDays = Math.min(Math.max(parseInt(days) || 30, 1), 365);

  const products = await recommendationDao.getNewArrivals(validLimit, validDays);

  return {
    type: 'new_arrivals',
    period: `${validDays} days`,
    total: products.length,
    products
  };
};

/**
 * Get products by category
 * @param {String} categoryId - Category ID
 * @param {String} excludeProductId - Product ID to exclude
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Object>} Recommendation result
 */
const getProductsByCategory = async (categoryId, excludeProductId = null, limit = 10) => {
  // Validate categoryId
  if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('ID danh mục không hợp lệ');
  }

  // Validate limit
  const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const products = await recommendationDao.getProductsByCategory(
    categoryId, 
    excludeProductId, 
    validLimit
  );

  return {
    type: 'category_based',
    categoryId,
    total: products.length,
    products
  };
};

/**
 * Get best rated products
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Object>} Recommendation result
 */
const getBestRatedProducts = async (limit = 10) => {
  // Validate limit
  const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const products = await recommendationDao.getBestRatedProducts(validLimit);

  return {
    type: 'best_rated',
    total: products.length,
    products
  };
};

module.exports = {
  getSimilarProducts,
  getTrendingProducts,
  getNewArrivals,
  getProductsByCategory,
  getBestRatedProducts
};
