const productBannerDao = require('../dao/productBanner.dao');
const productDao = require('../dao/product.dao');

/**
 * ProductBanner Service - Business Logic Layer
 * Handles business logic for product banner operations
 */

/**
 * Create a new product banner
 * @param {Object} bannerData - Banner data
 * @param {String} userId - ID of the admin creating the banner
 * @returns {Promise<Object>} Created banner
 */
const createBanner = async (bannerData, userId) => {
  // Validate required fields
  if (!bannerData.title || bannerData.title.trim().length === 0) {
    throw new Error('Tiêu đề banner không được để trống');
  }

  if (!bannerData.imageUrl || bannerData.imageUrl.trim().length === 0) {
    throw new Error('URL hình ảnh không được để trống');
  }

  if (!bannerData.discountPercent || bannerData.discountPercent < 1 || bannerData.discountPercent > 100) {
    throw new Error('Phần trăm giảm giá phải từ 1% đến 100%');
  }

  if (!bannerData.startDate || !bannerData.endDate) {
    throw new Error('Ngày bắt đầu và kết thúc là bắt buộc');
  }

  // Validate date range
  const startDate = new Date(bannerData.startDate);
  const endDate = new Date(bannerData.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Ngày không hợp lệ');
  }

  if (endDate <= startDate) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // Validate products if provided
  if (bannerData.products && bannerData.products.length > 0) {
    await validateProductIds(bannerData.products);
  }

  const banner = {
    title: bannerData.title.trim(),
    description: bannerData.description || '',
    imageUrl: bannerData.imageUrl,
    publicId: bannerData.publicId || '',
    discountPercent: bannerData.discountPercent,
    products: bannerData.products || [],
    startDate,
    endDate,
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    order: bannerData.order || 0,
    createdBy: userId
  };

  return await productBannerDao.create(banner);
};

/**
 * Get all product banners with pagination and filtering (admin)
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Banners with pagination info
 */
const getAllBanners = async (query = {}) => {
  const { page = 1, limit = 10, isActive, status } = query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  // Filter by status: 'running', 'upcoming', 'expired'
  const now = new Date();
  if (status === 'running') {
    filter.isActive = true;
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  } else if (status === 'upcoming') {
    filter.startDate = { $gt: now };
  } else if (status === 'expired') {
    filter.endDate = { $lt: now };
  }

  const [banners, total] = await Promise.all([
    productBannerDao.findAll(filter, { skip, limit: parseInt(limit) }),
    productBannerDao.count(filter)
  ]);

  return {
    banners,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get active product banners (public - for frontend display)
 * @returns {Promise<Array>} Active banners with calculated discount prices
 */
const getActiveBanners = async () => {
  const banners = await productBannerDao.findActiveBanners();

  // Enrich with discounted prices
  return banners.map(banner => {
    const bannerObj = banner.toObject();
    bannerObj.products = bannerObj.products
      .filter(product => product.isActive) // Only include active products
      .map(product => ({
        ...product,
        originalPrice: product.price,
        discountedPrice: Math.round(product.price * (1 - bannerObj.discountPercent / 100)),
        discountPercent: bannerObj.discountPercent
      }));
    return bannerObj;
  });
};

/**
 * Get banner by ID with discounted prices
 * @param {String} bannerId - Banner ID
 * @returns {Promise<Object>} Banner with product details
 */
const getBannerById = async (bannerId) => {
  const banner = await productBannerDao.findById(bannerId);

  if (!banner) {
    throw new Error('Không tìm thấy banner');
  }

  // Enrich with discounted prices
  const bannerObj = banner.toObject();
  bannerObj.products = bannerObj.products.map(product => ({
    ...product,
    originalPrice: product.price,
    discountedPrice: Math.round(product.price * (1 - bannerObj.discountPercent / 100)),
    discountPercent: bannerObj.discountPercent
  }));

  return bannerObj;
};

/**
 * Update a product banner
 * @param {String} bannerId - Banner ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated banner
 */
const updateBanner = async (bannerId, updateData) => {
  // Validate banner exists
  const existingBanner = await productBannerDao.findById(bannerId);
  if (!existingBanner) {
    throw new Error('Không tìm thấy banner');
  }

  // Validate title if provided
  if (updateData.title !== undefined && updateData.title.trim().length === 0) {
    throw new Error('Tiêu đề banner không được để trống');
  }

  // Validate discount if provided
  if (updateData.discountPercent !== undefined) {
    if (updateData.discountPercent < 1 || updateData.discountPercent > 100) {
      throw new Error('Phần trăm giảm giá phải từ 1% đến 100%');
    }
  }

  // Validate date range if dates are provided
  if (updateData.startDate || updateData.endDate) {
    const startDate = new Date(updateData.startDate || existingBanner.startDate);
    const endDate = new Date(updateData.endDate || existingBanner.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Ngày không hợp lệ');
    }

    if (endDate <= startDate) {
      throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
    }
  }

  // Validate products if provided
  if (updateData.products && updateData.products.length > 0) {
    await validateProductIds(updateData.products);
  }

  // Clean up update data
  const cleanedData = {};
  const allowedFields = [
    'title', 'description', 'imageUrl', 'publicId',
    'discountPercent', 'products', 'startDate', 'endDate',
    'isActive', 'order'
  ];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      cleanedData[field] = updateData[field];
    }
  });

  const updatedBanner = await productBannerDao.updateById(bannerId, cleanedData);

  if (!updatedBanner) {
    throw new Error('Không thể cập nhật banner');
  }

  return updatedBanner;
};

/**
 * Delete a product banner
 * @param {String} bannerId - Banner ID
 * @returns {Promise<Object>} Deleted banner
 */
const deleteBanner = async (bannerId) => {
  const banner = await productBannerDao.findById(bannerId);
  if (!banner) {
    throw new Error('Không tìm thấy banner');
  }

  return await productBannerDao.deleteById(bannerId);
};

/**
 * Add products to a banner
 * @param {String} bannerId - Banner ID
 * @param {Array} productIds - Product IDs to add
 * @returns {Promise<Object>} Updated banner
 */
const addProductsToBanner = async (bannerId, productIds) => {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new Error('Vui lòng cung cấp danh sách sản phẩm');
  }

  const banner = await productBannerDao.findById(bannerId);
  if (!banner) {
    throw new Error('Không tìm thấy banner');
  }

  // Validate product IDs
  await validateProductIds(productIds);

  return await productBannerDao.addProducts(bannerId, productIds);
};

/**
 * Remove products from a banner
 * @param {String} bannerId - Banner ID
 * @param {Array} productIds - Product IDs to remove
 * @returns {Promise<Object>} Updated banner
 */
const removeProductsFromBanner = async (bannerId, productIds) => {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new Error('Vui lòng cung cấp danh sách sản phẩm');
  }

  const banner = await productBannerDao.findById(bannerId);
  if (!banner) {
    throw new Error('Không tìm thấy banner');
  }

  return await productBannerDao.removeProducts(bannerId, productIds);
};

/**
 * Toggle banner active status
 * @param {String} bannerId - Banner ID
 * @returns {Promise<Object>} Updated banner
 */
const toggleBannerStatus = async (bannerId) => {
  const banner = await productBannerDao.findById(bannerId);
  if (!banner) {
    throw new Error('Không tìm thấy banner');
  }

  return await productBannerDao.updateById(bannerId, {
    isActive: !banner.isActive
  });
};

// ========== HELPER FUNCTIONS ==========

/**
 * Validate that all product IDs exist
 * @param {Array} productIds - Array of product IDs
 */
const validateProductIds = async (productIds) => {
  for (const productId of productIds) {
    const product = await productDao.findById(productId, false);
    if (!product) {
      throw new Error(`Sản phẩm với ID ${productId} không tồn tại`);
    }
  }
};

module.exports = {
  createBanner,
  getAllBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  addProductsToBanner,
  removeProductsFromBanner,
  toggleBannerStatus
};
