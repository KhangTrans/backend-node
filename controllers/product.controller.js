const prisma = require('../lib/prisma');
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
      category, 
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      images, 
      variants 
    } = req.body;

    // Generate unique slug
    const slug = customSlug 
      ? await generateUniqueSlug(customSlug, null, prisma)
      : await generateUniqueSlug(name, null, prisma);

    // Create product with images and variants
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        category,
        metaTitle: metaTitle || name,
        metaDescription: metaDescription || description?.substring(0, 160),
        metaKeywords,
        canonicalUrl,
        createdBy: req.user.id,
        images: images && images.length > 0 ? {
          create: images.map((img, index) => ({
            imageUrl: img.imageUrl || img,
            isPrimary: img.isPrimary || index === 0,
            order: img.order || index
          }))
        } : undefined,
        variants: variants && variants.length > 0 ? {
          create: variants.map(v => ({
            name: v.name,
            sku: v.sku,
            price: v.price ? parseFloat(v.price) : null,
            stock: parseInt(v.stock) || 0,
            color: v.color,
            size: v.size,
            material: v.material
          }))
        } : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        variants: true
      }
    });

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
    const { page = 1, limit = 10, category, search } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const where = {
      isActive: true
    };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          images: {
            orderBy: { order: 'asc' }
          },
          variants: {
            where: { isActive: true }
          }
        }
      }),
      prisma.product.count({ where })
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

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

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

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

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

// @desc    Update productcategory, isActive, images, variants } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

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

    // Update product
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        category,
        isActive
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        variants: trueser: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });

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
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

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
