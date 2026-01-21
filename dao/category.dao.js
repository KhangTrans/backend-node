const Category = require('../models/Category.model');

/**
 * Category DAO - Data Access Object layer
 * Handles all database operations related to categories
 */

// Find all categories with optional filters
const findAll = async (filter = {}, sort = { name: 1 }, populateProducts = false) => {
  let query = Category.find(filter).sort(sort);
  
  if (populateProducts) {
    query = query.populate({
      path: 'products',
      match: { isActive: true },
      select: '_id name slug price'
    });
  }
  
  return await query;
};

// Find category by ID
const findById = async (categoryId, populateProducts = false) => {
  let query = Category.findById(categoryId);
  
  if (populateProducts) {
    query = query.populate({
      path: 'products',
      match: { isActive: true },
      populate: {
        path: 'images',
        match: { isPrimary: true }
      }
    });
  }
  
  return await query;
};

// Find category by slug
const findBySlug = async (slug, populateProducts = false) => {
  let query = Category.findOne({ slug });
  
  if (populateProducts) {
    query = query.populate({
      path: 'products',
      match: { isActive: true },
      populate: {
        path: 'images',
        match: { isPrimary: true }
      }
    });
  }
  
  return await query;
};

// Find category by ID with products populated
const findByIdWithProducts = async (categoryId) => {
  return await Category.findById(categoryId).populate('products');
};

// Create new category
const create = async (categoryData) => {
  return await Category.create(categoryData);
};

// Update category by ID
const updateById = async (categoryId, updateData) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    updateData,
    { new: true }
  );
};

// Delete category by ID
const deleteById = async (categoryId) => {
  return await Category.findByIdAndDelete(categoryId);
};

// Count categories
const count = async (filter = {}) => {
  return await Category.countDocuments(filter);
};

module.exports = {
  findAll,
  findById,
  findBySlug,
  findByIdWithProducts,
  create,
  updateById,
  deleteById,
  count
};
