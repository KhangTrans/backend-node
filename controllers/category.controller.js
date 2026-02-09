const categoryService = require('../services/category.service');
const { validationResult } = require('express-validator');

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

    const { name, slug, description, imageUrl, isFeatured } = req.body;

    const category = await categoryService.createCategory({
      name,
      slug,
      description,
      imageUrl,
      isFeatured
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

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
exports.getFeaturedCategories = async (req, res) => {
  try {
    const categories = await categoryService.getFeaturedCategories();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting featured categories',
      error: error.message 
    });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(req.query);

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

    const category = await categoryService.getCategoryById(id);

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

    const category = await categoryService.getCategoryBySlug(slug);

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
    
    // Pass raw body, service handles logic
    const category = await categoryService.updateCategory(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    let status = 500;
    if (error.message === 'Category not found') status = 404;
    
    res.status(status).json({ 
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

    await categoryService.deleteCategory(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    let status = 500;
    if (error.message === 'Category not found') status = 404;
    if (error.message.includes('Cannot delete')) status = 400;

    res.status(status).json({ 
      success: false,
      message: error.message || 'Error deleting category',
      error: error.message 
    });
  }
};
