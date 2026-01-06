const Product = require('../models/Product.model');
const { validationResult } = require('express-validator');
const { generateUniqueSlug } = require('../utils/slug');

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

    const { 
      name, 
      slug: customSlug,
      description, 
      price, 
      stock, 
      categoryId, 
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      images, 
      variants 
    } = req.body;

    // Generate unique slug
    const slug = customSlug 
      ? await generateUniqueSlug(customSlug, null, Product)
      : await generateUniqueSlug(name, null, Product);

    // Prepare product data
    const productData = {
      name,
      slug,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      categoryId: categoryId || null,
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || description?.substring(0, 160),
      metaKeywords,
      canonicalUrl,
      createdBy: req.user.id,
      images: images && images.length > 0 ? images.map((img, index) => ({
        imageUrl: img.imageUrl || img,
        isPrimary: img.isPrimary || index === 0,
        order: img.order || index
      })) : [],
      variants: variants && variants.length > 0 ? variants.map(v => ({
        name: v.name,
        sku: v.sku,
        price: v.price ? parseFloat(v.price) : null,
        stock: parseInt(v.stock) || 0,
        color: v.color,
        size: v.size,
        material: v.material
      })) : []
    };

    // Create product
    const product = await Product.create(productData);

    // Populate relations
    await product.populate([
      {
        path: 'createdBy',
        select: '_id username email'
      },
      { path: 'category' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating product',
      error: error.message 
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
    const filter = {
      isActive: true
    };
    
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate({
          path: 'createdBy',
          select: '_id username fullName'
        })
        .populate('category'),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting products',
      error: error.message 
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate({
        path: 'createdBy',
        select: '_id username fullName email'
      })
      .populate('category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting product',
      error: error.message 
    });
  }
};

// @desc    Get product by slug (SEO-friendly URL)
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate({
        path: 'createdBy',
        select: '_id username fullName email'
      })
      .populate('category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting product',
      error: error.message 
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      slug: customSlug,
      description, 
      price, 
      stock, 
      categoryId, 
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      isActive,
      images,
      variants 
    } = req.body;

    // Check if product exists
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (existingProduct.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Generate new slug if name changed or custom slug provided
    let newSlug = existingProduct.slug;
    if (customSlug || (name && name !== existingProduct.name)) {
      newSlug = await generateUniqueSlug(
        customSlug || name, 
        id, 
        Product
      );
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (newSlug) updateData.slug = newSlug;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (metaTitle || name) updateData.metaTitle = metaTitle || name;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle images update if provided
    if (images !== undefined) {
      if (images && images.length > 0) {
        updateData.images = images.map((img, index) => ({
          imageUrl: img.imageUrl || img,
          isPrimary: img.isPrimary || index === 0,
          order: img.order !== undefined ? img.order : index
        }));
      } else {
        updateData.images = [];
      }
    }

    // Handle variants update if provided
    if (variants !== undefined) {
      if (variants && variants.length > 0) {
        updateData.variants = variants.map(v => ({
          name: v.name,
          sku: v.sku,
          price: v.price ? parseFloat(v.price) : null,
          stock: parseInt(v.stock) || 0,
          color: v.color,
          size: v.size,
          material: v.material
        }));
      } else {
        updateData.variants = [];
      }
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate({
        path: 'createdBy',
        select: '_id username fullName'
      })
      .populate('category');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating product',
      error: error.message 
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.createdBy.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting product',
      error: error.message 
    });
  }
};
