/**
 * Category Service
 * Business logic for category management
 */

const categoryDao = require('../dao/category.dao');
const Category = require('../models/Category.model');
const { generateUniqueSlug } = require('../utils/slug');

/**
 * Get all categories with filtering
 * @param {Object} query - includeProducts, search
 * @returns {Promise<Array>} Categories
 */
const getAllCategories = async ({ includeProducts, search }) => {
  // Build filter
  const filter = { isActive: true };

  // Search functionality
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  return await categoryDao.findAll(
    filter, 
    { name: 1 }, 
    includeProducts === 'true'
  );
};

/**
 * Get category by ID
 * @param {String} id
 * @returns {Promise<Object>} Category
 */
const getCategoryById = async (id) => {
  return await categoryDao.findById(id, true);
};

/**
 * Get category by Slug
 * @param {String} slug
 * @returns {Promise<Object>} Category
 */
const getCategoryBySlug = async (slug) => {
  return await categoryDao.findBySlug(slug, true);
};

/**
 * Create new category
 * @param {Object} data - name, slug, description, imageUrl
 * @returns {Promise<Object>} Created category
 */
const createCategory = async ({ name, slug: customSlug, description, imageUrl }) => {
  // Generate unique slug
  const slug = customSlug 
    ? await generateUniqueSlug(customSlug, null, Category)
    : await generateUniqueSlug(name, null, Category);

  return await categoryDao.create({
    name,
    slug,
    description,
    imageUrl
  });
};

/**
 * Update category
 * @param {String} id
 * @param {Object} data - name, slug, description, imageUrl, isActive
 * @returns {Promise<Object>} Updated category
 */
const updateCategory = async (id, { name, slug: customSlug, description, imageUrl, isActive }) => {
  const existingCategory = await categoryDao.findById(id, false);

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Generate new slug if name changed or custom slug provided
  let newSlug = existingCategory.slug;
  if (customSlug || (name && name !== existingCategory.name)) {
    newSlug = await generateUniqueSlug(
      customSlug || name, 
      id, 
      Category
    );
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (newSlug) updateData.slug = newSlug;
  if (description !== undefined) updateData.description = description;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (isActive !== undefined) updateData.isActive = isActive;

  return await categoryDao.updateById(id, updateData);
};

/**
 * Delete category
 * @param {String} id
 * @returns {Promise<void>}
 */
const deleteCategory = async (id) => {
  const category = await categoryDao.findByIdWithProducts(id);

  if (!category) {
    throw new Error('Category not found');
  }

  if (category.products && category.products.length > 0) {
    throw new Error('Cannot delete category with existing products');
  }

  await categoryDao.deleteById(id);
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
