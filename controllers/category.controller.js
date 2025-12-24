const prisma = require('../lib/prisma');
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
      ? await generateUniqueSlug(customSlug, null, prisma)
      : await generateUniqueSlug(name, null, prisma);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl
      }
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
    const { includeProducts = false } = req.query;

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: includeProducts === 'true' ? {
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true
          }
        }
      } : undefined
    });

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

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
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

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
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

    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

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
        parseInt(id), 
        prisma
      );
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug: newSlug,
        description,
        imageUrl,
        isActive
      }
    });

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

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

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
