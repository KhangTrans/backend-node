const ProductBanner = require('../models/ProductBanner.model');

/**
 * ProductBanner DAO - Data Access Object layer
 * Handles all database operations related to product banners
 */

/**
 * Create a new product banner
 * @param {Object} bannerData - Banner data
 * @returns {Promise<Object>} Created banner
 */
const create = async (bannerData) => {
  const banner = new ProductBanner(bannerData);
  return await banner.save();
};

/**
 * Find all product banners with optional filters
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options (sort, limit, skip)
 * @returns {Promise<Array>} List of banners
 */
const findAll = async (filter = {}, options = {}) => {
  const { sort = { order: 1, createdAt: -1 }, limit, skip } = options;
  
  let query = ProductBanner.find(filter)
    .populate('products', 'name slug price images isActive stock')
    .populate('createdBy', 'username email')
    .sort(sort);

  if (skip) query = query.skip(skip);
  if (limit) query = query.limit(limit);

  return await query;
};

/**
 * Count banners matching filter
 * @param {Object} filter - Query filter
 * @returns {Promise<Number>} Count
 */
const count = async (filter = {}) => {
  return await ProductBanner.countDocuments(filter);
};

/**
 * Find banner by ID
 * @param {String} bannerId - Banner ID
 * @returns {Promise<Object|null>} Banner or null
 */
const findById = async (bannerId) => {
  return await ProductBanner.findById(bannerId)
    .populate('products', 'name slug price images isActive stock categoryId description')
    .populate('createdBy', 'username email');
};

/**
 * Find active banners (currently running)
 * @returns {Promise<Array>} Active banners
 */
const findActiveBanners = async () => {
  const now = new Date();
  return await ProductBanner.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  })
    .populate('products', 'name slug price images isActive stock')
    .sort({ order: 1, createdAt: -1 });
};

/**
 * Update banner by ID
 * @param {String} bannerId - Banner ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated banner or null
 */
const updateById = async (bannerId, updateData) => {
  return await ProductBanner.findByIdAndUpdate(
    bannerId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('products', 'name slug price images isActive stock')
    .populate('createdBy', 'username email');
};

/**
 * Delete banner by ID
 * @param {String} bannerId - Banner ID
 * @returns {Promise<Object|null>} Deleted banner or null
 */
const deleteById = async (bannerId) => {
  return await ProductBanner.findByIdAndDelete(bannerId);
};

/**
 * Add products to banner
 * @param {String} bannerId - Banner ID
 * @param {Array} productIds - Array of product IDs to add
 * @returns {Promise<Object|null>} Updated banner or null
 */
const addProducts = async (bannerId, productIds) => {
  return await ProductBanner.findByIdAndUpdate(
    bannerId,
    { $addToSet: { products: { $each: productIds } } },
    { new: true, runValidators: true }
  )
    .populate('products', 'name slug price images isActive stock')
    .populate('createdBy', 'username email');
};

/**
 * Remove products from banner
 * @param {String} bannerId - Banner ID
 * @param {Array} productIds - Array of product IDs to remove
 * @returns {Promise<Object|null>} Updated banner or null
 */
const removeProducts = async (bannerId, productIds) => {
  return await ProductBanner.findByIdAndUpdate(
    bannerId,
    { $pull: { products: { $in: productIds } } },
    { new: true, runValidators: true }
  )
    .populate('products', 'name slug price images isActive stock')
    .populate('createdBy', 'username email');
};

module.exports = {
  create,
  findAll,
  count,
  findById,
  findActiveBanners,
  updateById,
  deleteById,
  addProducts,
  removeProducts
};
