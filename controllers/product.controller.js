const productService = require('../services/product.service');
const { validationResult } = require('express-validator');

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    // Service handles all business logic
    const product = await productService.createProduct(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error creating product'
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, search } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Build options
    const options = {
      skip,
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      search
    };

    // Service handles business logic
    const result = await productService.getAllProducts(filter, options);

    res.status(200).json({
      success: true,
      count: result.products.length,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      currentPage: result.pagination.page,
      data: result.products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error getting products'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Service handles business logic
    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    const statusCode = error.message === 'Product not found' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message
    });
  }
};

// @desc    Get product by slug (SEO-friendly URL)
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Service handles business logic
    const product = await productService.getProductBySlug(slug);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    const statusCode = error.message === 'Product not found' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Service handles all business logic including authorization
    const product = await productService.updateProduct(
      id,
      req.body,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    let statusCode = 500;
    if (error.message === 'Product not found') statusCode = 404;
    if (error.message.includes('Not authorized')) statusCode = 403;
    if (error.message.includes('cannot be empty') || error.message.includes('must be greater')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Service handles all business logic including authorization
    await productService.deleteProduct(id, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
    let statusCode = 500;
    if (error.message === 'Product not found') statusCode = 404;
    if (error.message.includes('Not authorized')) statusCode = 403;
    
    res.status(statusCode).json({ 
      success: false,
      message: error.message
    });
  }
};
