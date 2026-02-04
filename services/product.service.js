const productDao = require('../dao/product.dao');
const { generateUniqueSlug } = require('../utils/slug');
const Product = require('../models/Product.model');

/**
 * Product Service - Business Logic Layer
 * Handles business logic for product management
 */

/**
 * Get all products with pagination and filters
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Products and pagination info
 */
const getAllProducts = async (filter = {}, options = {}) => {
  // Business logic: Default to active products only
  if (filter.isActive === undefined) {
    filter.isActive = true;
  }

  // Build search filter
  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } }
    ];
  }

  // Get products and total count
  const [products, total] = await Promise.all([
    productDao.findAll(filter, options),
    productDao.count(filter)
  ]);

  return {
    products,
    pagination: {
      total,
      page: Math.floor(options.skip / options.limit) + 1,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit)
    }
  };
};

/**
 * Get product by ID
 * @param {String} productId - Product ID
 * @param {Boolean} populateOptions - Whether to populate relations
 * @returns {Promise<Object>} Product object
 */
const getProductById = async (productId, populateOptions = true) => {
  const product = await productDao.findById(productId, populateOptions);
  
  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

/**
 * Get product by slug (SEO-friendly)
 * @param {String} slug - Product slug
 * @param {Boolean} populateOptions - Whether to populate relations
 * @returns {Promise<Object>} Product object
 */
const getProductBySlug = async (slug, populateOptions = true) => {
  const product = await productDao.findBySlug(slug, populateOptions);
  
  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

/**
 * Create new product with validation
 * @param {Object} productData - Product data
 * @param {String} userId - User ID creating the product
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData, userId) => {
  // Business logic: Validate required fields
  if (!productData.name || productData.name.trim().length === 0) {
    throw new Error('Product name is required');
  }

  if (!productData.price || productData.price <= 0) {
    throw new Error('Product price must be greater than 0');
  }

  // Business logic: Generate unique slug
  const slug = productData.slug 
    ? await generateUniqueSlug(productData.slug, null, Product)
    : await generateUniqueSlug(productData.name, null, Product);

  // Business logic: Prepare product data with defaults
  const product = {
    name: productData.name,
    slug,
    description: productData.description || '',
    price: parseFloat(productData.price),
    stock: parseInt(productData.stock) || 0,
    categoryId: productData.categoryId || null,
    metaTitle: productData.metaTitle || productData.name,
    metaDescription: productData.metaDescription || productData.description?.substring(0, 160),
    metaKeywords: productData.metaKeywords,
    canonicalUrl: productData.canonicalUrl,
    createdBy: userId,
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    images: processImages(productData.images),
    variants: processVariants(productData.variants)
  };

  // Create product
  const createdProduct = await productDao.create(product);

  // Populate relations
  await createdProduct.populate([
    {
      path: 'createdBy',
      select: '_id username email'
    },
    { path: 'categoryId' }
  ]);

  return createdProduct;
};

/**
 * Update product with validation
 * @param {String} productId - Product ID
 * @param {Object} updateData - Data to update
 * @param {String} userId - User ID updating the product
 * @param {String} userRole - User role
 * @returns {Promise<Object>} Updated product
 */
const updateProduct = async (productId, updateData, userId, userRole) => {
  // Check if product exists
  const existingProduct = await productDao.findById(productId, false);
  
  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Business logic: Check authorization
  if (existingProduct.createdBy.toString() !== userId.toString() && userRole !== 'admin') {
    throw new Error('Not authorized to update this product');
  }

  // Business logic: Validate update data
  if (updateData.name && updateData.name.trim().length === 0) {
    throw new Error('Product name cannot be empty');
  }

  if (updateData.price !== undefined && updateData.price <= 0) {
    throw new Error('Product price must be greater than 0');
  }

  // Business logic: Generate new slug if needed
  let newSlug = existingProduct.slug;
  if (updateData.slug || (updateData.name && updateData.name !== existingProduct.name)) {
    newSlug = await generateUniqueSlug(
      updateData.slug || updateData.name, 
      productId, 
      Product
    );
  }

  // Prepare update data
  const dataToUpdate = {};
  if (updateData.name) dataToUpdate.name = updateData.name;
  if (newSlug) dataToUpdate.slug = newSlug;
  if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
  if (updateData.price) dataToUpdate.price = parseFloat(updateData.price);
  if (updateData.stock !== undefined) dataToUpdate.stock = parseInt(updateData.stock);
  if (updateData.categoryId !== undefined) dataToUpdate.categoryId = updateData.categoryId || null;
  if (updateData.metaTitle || updateData.name) dataToUpdate.metaTitle = updateData.metaTitle || updateData.name;
  if (updateData.metaDescription !== undefined) dataToUpdate.metaDescription = updateData.metaDescription;
  if (updateData.metaKeywords !== undefined) dataToUpdate.metaKeywords = updateData.metaKeywords;
  if (updateData.canonicalUrl !== undefined) dataToUpdate.canonicalUrl = updateData.canonicalUrl;
  if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive;

  // Handle images update
  if (updateData.images !== undefined) {
    dataToUpdate.images = processImages(updateData.images);
  }

  // Handle variants update
  if (updateData.variants !== undefined) {
    dataToUpdate.variants = processVariants(updateData.variants);
  }

  // Update product
  return await productDao.updateById(productId, dataToUpdate);
};

/**
 * Delete product
 * @param {String} productId - Product ID
 * @param {String} userId - User ID deleting the product
 * @param {String} userRole - User role
 * @returns {Promise<Object>} Deleted product
 */
const deleteProduct = async (productId, userId, userRole) => {
  // Check if product exists
  const product = await productDao.findById(productId, false);
  
  if (!product) {
    throw new Error('Product not found');
  }

  // Business logic: Check authorization
  if (product.createdBy.toString() !== userId.toString() && userRole !== 'admin') {
    throw new Error('Not authorized to delete this product');
  }

  // Business logic: Could add check if product is in active orders
  // const activeOrders = await orderDao.findByProductId(productId, { status: 'pending' });
  // if (activeOrders.length > 0) {
  //   throw new Error('Cannot delete product with active orders. Please deactivate instead.');
  // }

  return await productDao.deleteById(productId);
};

/**
 * Update product stock
 * @param {String} productId - Product ID
 * @param {Number} quantity - Quantity to add/subtract (negative to subtract)
 * @returns {Promise<Object>} Updated product
 */
const updateStock = async (productId, quantity) => {
  // Validate product exists
  const product = await productDao.findById(productId, false);
  
  if (!product) {
    throw new Error('Product not found');
  }

  // Business logic: Check if stock would go negative
  const newStock = product.stock + quantity;
  if (newStock < 0) {
    throw new Error(`Insufficient stock. Current stock: ${product.stock}`);
  }

  return await productDao.updateStock(productId, quantity);
};

/**
 * Toggle product active status
 * @param {String} productId - Product ID
 * @param {String} userId - User ID
 * @param {String} userRole - User role
 * @returns {Promise<Object>} Updated product
 */
const toggleProductStatus = async (productId, userId, userRole) => {
  const product = await productDao.findById(productId, false);
  
  if (!product) {
    throw new Error('Product not found');
  }

  // Check authorization
  if (product.createdBy.toString() !== userId.toString() && userRole !== 'admin') {
    throw new Error('Not authorized to update this product');
  }

  return await productDao.updateById(productId, {
    isActive: !product.isActive
  });
};

// Helper functions

/**
 * Process images array
 * @param {Array} images - Images array
 * @returns {Array} Processed images
 */
const processImages = (images) => {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map((img, index) => ({
    imageUrl: img.imageUrl || img,
    isPrimary: img.isPrimary || index === 0,
    order: img.order !== undefined ? img.order : index
  }));
};

/**
 * Process variants array
 * @param {Array} variants - Variants array
 * @returns {Array} Processed variants
 */
const processVariants = (variants) => {
  if (!variants || variants.length === 0) {
    return [];
  }

  return variants.map(v => ({
    name: v.name,
    sku: v.sku,
    price: v.price ? parseFloat(v.price) : null,
    stock: parseInt(v.stock) || 0,
    color: v.color,
    size: v.size,
    material: v.material
  }));
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  toggleProductStatus
};
