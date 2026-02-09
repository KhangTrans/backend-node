const Product = require('../models/Product.model');
const Order = require('../models/Order.model');

/**
 * Recommendation DAO - Database Access Layer
 * Handles database queries for product recommendations
 */

/**
 * Get similar products based on category and price range
 * @param {String} productId - Product ID to find similar products
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Array>} Array of similar products
 */
const getSimilarProducts = async (productId, limit = 10) => {
  // Get the original product
  const product = await Product.findById(productId).select('categoryId price');
  
  if (!product) {
    return [];
  }

  // Calculate price range (±30%)
  const priceMin = product.price * 0.7;
  const priceMax = product.price * 1.3;

  // Find similar products
  const similarProducts = await Product.find({
    _id: { $ne: productId }, // Exclude the current product
    categoryId: product.categoryId, // Same category
    price: { $gte: priceMin, $lte: priceMax }, // Similar price range
    isActive: true,
    stock: { $gt: 0 } // In stock
  })
    .select('name slug price stock images categoryId createdAt')
    .sort({ createdAt: -1 }) // Prefer newer products
    .limit(limit);

  return similarProducts;
};

/**
 * Get trending products based on order count
 * @param {Number} limit - Number of products to return
 * @param {Number} days - Number of days to look back (default: 30)
 * @returns {Promise<Array>} Array of trending products
 */
const getTrendingProducts = async (limit = 10, days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  // Aggregate orders to find most purchased products
  const trendingProductIds = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: dateThreshold },
        orderStatus: { $in: ['confirmed', 'shipping', 'delivered'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ]);

  if (trendingProductIds.length === 0) {
    // Fallback: return newest products if no orders
    return await Product.find({ isActive: true, stock: { $gt: 0 } })
      .select('name slug price stock images categoryId createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Get full product details
  const productIds = trendingProductIds.map(item => item._id);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true
  })
    .select('name slug price stock images categoryId createdAt');

  // Sort products by trending order
  const sortedProducts = productIds.map(id => 
    products.find(p => p._id.toString() === id.toString())
  ).filter(Boolean);

  return sortedProducts;
};

/**
 * Get new arrival products
 * @param {Number} limit - Number of products to return
 * @param {Number} days - Number of days to consider as "new" (default: 30)
 * @returns {Promise<Array>} Array of new products
 */
const getNewArrivals = async (limit = 10, days = 30) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const newProducts = await Product.find({
    isActive: true,
    stock: { $gt: 0 },
    createdAt: { $gte: dateThreshold }
  })
    .select('name slug price stock images categoryId createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);

  return newProducts;
};

/**
 * Get products by category (for category-based recommendations)
 * @param {String} categoryId - Category ID
 * @param {String} excludeProductId - Product ID to exclude (optional)
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Array>} Array of products in the category
 */
const getProductsByCategory = async (categoryId, excludeProductId = null, limit = 10) => {
  const query = {
    categoryId,
    isActive: true,
    stock: { $gt: 0 }
  };

  if (excludeProductId) {
    query._id = { $ne: excludeProductId };
  }

  const products = await Product.find(query)
    .select('name slug price stock images categoryId createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);

  return products;
};

/**
 * Get best rated products (if you have review system)
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Array>} Array of best rated products
 */
const getBestRatedProducts = async (limit = 10) => {
  // This is a placeholder - implement when you have review aggregation
  // For now, return trending products
  return await getTrendingProducts(limit);
};

module.exports = {
  getSimilarProducts,
  getTrendingProducts,
  getNewArrivals,
  getProductsByCategory,
  getBestRatedProducts
};
