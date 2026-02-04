const Product = require('../models/Product.model');

/**
 * Product DAO - Data Access Object layer
 * Handles all database operations related to products
 */

// Find all products with pagination
const findAll = async (filter = {}, options = {}) => {
  const {
    skip = 0,
    limit = 10,
    sort = { createdAt: -1 },
    populateCreatedBy = true,
    populateCategory = true
  } = options;

  let query = Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  if (populateCreatedBy) {
    query = query.populate({
      path: 'createdBy',
      select: '_id username fullName'
    });
  }

  if (populateCategory) {
    query = query.populate('categoryId');
  }

  return await query;
  return await query;
};

// Find products by query (flexible)
const find = async (query, selectFields = '', sort = { createdAt: -1 }) => {
  return await Product.find(query)
    .select(selectFields)
    .sort(sort);
};

// Count products
const count = async (filter = {}) => {
  return await Product.countDocuments(filter);
};

// Find product by ID
const findById = async (productId, populateOptions = true) => {
  let query = Product.findById(productId);

  if (populateOptions) {
    query = query
      .populate({
        path: 'createdBy',
        select: '_id username fullName email'
      })
      .populate('categoryId');
  }

  return await query;
};

// Find product by slug
const findBySlug = async (slug, populateOptions = true) => {
  let query = Product.findOne({ slug });

  if (populateOptions) {
    query = query
      .populate({
        path: 'createdBy',
        select: '_id username fullName email'
      })
      .populate('categoryId');
  }

  return await query;
};

// Find product by ID with images
const findByIdWithImages = async (productId) => {
  return await Product.findById(productId).populate({
    path: 'images',
    match: { isPrimary: true }
  });
};

// Create new product
const create = async (productData) => {
  return await Product.create(productData);
};

// Update product by ID
const updateById = async (productId, updateData, populateOptions = true) => {
  let query = Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true }
  );

  if (populateOptions) {
    query = query
      .populate({
        path: 'createdBy',
        select: '_id username fullName'
      })
      .populate('categoryId');
  }

  return await query;
};

// Delete product by ID
const deleteById = async (productId) => {
  return await Product.findByIdAndDelete(productId);
};

// Update product stock (increment/decrement)
const updateStock = async (productId, quantity) => {
  return await Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: quantity } }
  );
};

// Find products by IDs
const findByIds = async (productIds) => {
  return await Product.find({ _id: { $in: productIds } });
};

module.exports = {
  findAll,
  count,
  findById,
  findBySlug,
  findByIdWithImages,
  create,
  updateById,
  deleteById,
  updateStock,
  findByIds,
  find
};
