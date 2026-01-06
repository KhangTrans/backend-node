const Category = require('../models/Category.model');
const { validationResult } = require('express-validator');
const { generateUniqueSlug } = require('../utils/slug');

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, slug: customSlug, description, imageUrl } = req.body;

    // Generate unique slug
    const slug = customSlug 
      ? await generateUniqueSlug(customSlug, null, Category)
      : await generateUniqueSlug(name, null, Category);

    const category = await Category.create({
      name,
      slug,
      description,
      imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating category',
      error: error.message 
    });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const { includeProducts = false, search } = req.query;

    // Build filter
    const filter = { isActive: true };

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let query = Category.find(filter).sort({ name: 1 });

    if (includeProducts === 'true') {
      query = query.populate({
        path: 'products',
        match: { isActive: true },
        select: '_id name slug price'
      });
    }

    const categories = await query;

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting categories',
      error: error.message 
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate({
        path: 'products',
        match: { isActive: true },
        populate: {
          path: 'images',
          match: { isPrimary: true }
        }
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting category',
      error: error.message 
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate({
        path: 'products',
        match: { isActive: true },
        populate: {
          path: 'images',
          match: { isPrimary: true }
        }
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting category',
      error: error.message 
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug: customSlug, description, imageUrl, isActive } = req.body;

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
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

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating category',
      error: error.message 
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).populate('products');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.products && category.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting category',
      error: error.message 
    });
  }
};
