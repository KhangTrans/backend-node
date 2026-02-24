const productBannerService = require('../services/productBanner.service');

/**
 * ProductBanner Controller
 * Handles HTTP requests for product banner operations
 */

// @desc    Create a new product banner
// @route   POST /api/product-banners
// @access  Admin
const createBanner = async (req, res) => {
  try {
    const banner = await productBannerService.createBanner(req.body, req.user._id);

    res.status(201).json({
      success: true,
      data: banner,
      message: 'Tạo banner sản phẩm thành công'
    });
  } catch (error) {
    console.error('Error in createBanner:', error);
    const statusCode = error.message.includes('không được') || 
                       error.message.includes('phải') ||
                       error.message.includes('bắt buộc') ||
                       error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all product banners (admin - with pagination)
// @route   GET /api/product-banners/admin/all
// @access  Admin
const getAllBanners = async (req, res) => {
  try {
    const result = await productBannerService.getAllBanners(req.query);

    res.status(200).json({
      success: true,
      data: result.banners,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllBanners:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active product banners (public - for frontend)
// @route   GET /api/product-banners/active
// @access  Public
const getActiveBanners = async (req, res) => {
  try {
    const banners = await productBannerService.getActiveBanners();

    res.status(200).json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error in getActiveBanners:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get product banner by ID (with discounted prices)
// @route   GET /api/product-banners/:id
// @access  Public
const getBannerById = async (req, res) => {
  try {
    const banner = await productBannerService.getBannerById(req.params.id);

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Error in getBannerById:', error);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a product banner
// @route   PUT /api/product-banners/:id
// @access  Admin
const updateBanner = async (req, res) => {
  try {
    const banner = await productBannerService.updateBanner(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: banner,
      message: 'Cập nhật banner thành công'
    });
  } catch (error) {
    console.error('Error in updateBanner:', error);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 :
                       error.message.includes('không được') || 
                       error.message.includes('phải') ||
                       error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a product banner
// @route   DELETE /api/product-banners/:id
// @access  Admin
const deleteBanner = async (req, res) => {
  try {
    await productBannerService.deleteBanner(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa banner thành công'
    });
  } catch (error) {
    console.error('Error in deleteBanner:', error);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add products to a banner
// @route   POST /api/product-banners/:id/products
// @access  Admin
const addProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    const banner = await productBannerService.addProductsToBanner(req.params.id, productIds);

    res.status(200).json({
      success: true,
      data: banner,
      message: 'Thêm sản phẩm vào banner thành công'
    });
  } catch (error) {
    console.error('Error in addProducts:', error);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 :
                       error.message.includes('cung cấp') ||
                       error.message.includes('không tồn tại') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove products from a banner
// @route   DELETE /api/product-banners/:id/products
// @access  Admin
const removeProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    const banner = await productBannerService.removeProductsFromBanner(req.params.id, productIds);

    res.status(200).json({
      success: true,
      data: banner,
      message: 'Xóa sản phẩm khỏi banner thành công'
    });
  } catch (error) {
    console.error('Error in removeProducts:', error);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 :
                       error.message.includes('cung cấp') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle banner active status
// @route   PATCH /api/product-banners/:id/toggle
// @access  Admin
const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await productBannerService.toggleBannerStatus(req.params.id);

    res.status(200).json({
      success: true,
      data: banner,
      message: `Banner đã được ${banner.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`
    });
  } catch (error) {
    console.error('Error in toggleBannerStatus:', error);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createBanner,
  getAllBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  addProducts,
  removeProducts,
  toggleBannerStatus
};
