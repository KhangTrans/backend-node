const settingsDao = require('../dao/settings.dao');

/**
 * Settings Service - Business Logic Layer
 * Handles business logic for store settings
 */

/**
 * Get current settings
 * @returns {Promise<Object>} Settings object
 */
const getSettings = async () => {
  return await settingsDao.getSettings();
};

/**
 * Update store information with validation
 * @param {Object} storeData - Store data to update
 * @returns {Promise<Object>} Updated settings
 */
const updateStore = async (storeData) => {
  // Business logic: Validate store data
  if (storeData.name && storeData.name.trim().length === 0) {
    throw new Error('Tên cửa hàng không được để trống');
  }

  if (storeData.email && !isValidEmail(storeData.email)) {
    throw new Error('Email không hợp lệ');
  }

  if (storeData.phone && !isValidPhone(storeData.phone)) {
    throw new Error('Số điện thoại không hợp lệ');
  }

  // Call DAO to update
  return await settingsDao.updateStore(storeData);
};

/**
 * Update appearance settings with validation
 * @param {Object} appearanceData - Appearance data to update
 * @returns {Promise<Object>} Updated settings
 */
const updateAppearance = async (appearanceData) => {
  // Business logic: Validate appearance data
  if (appearanceData.primaryColor && !isValidHexColor(appearanceData.primaryColor)) {
    throw new Error('Mã màu không hợp lệ');
  }

  return await settingsDao.updateAppearance(appearanceData);
};

/**
 * Add a new banner with validation
 * @param {Object} bannerData - Banner data
 * @returns {Promise<Array>} Updated banners array
 */
const addBanner = async (bannerData) => {
  // Business logic: Validate banner data
  if (!bannerData.imageUrl || bannerData.imageUrl.trim().length === 0) {
    throw new Error('URL hình ảnh không được để trống');
  }

  if (!bannerData.title || bannerData.title.trim().length === 0) {
    throw new Error('Tiêu đề banner không được để trống');
  }

  // Set default values
  const banner = {
    title: bannerData.title,
    imageUrl: bannerData.imageUrl,
    link: bannerData.link || '',
    isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
    order: bannerData.order || 0
  };

  return await settingsDao.addBanner(banner);
};

/**
 * Update an existing banner
 * @param {String} bannerId - Banner ID
 * @param {Object} bannerData - Banner data to update
 * @returns {Promise<Array|null>} Updated banners array or null if not found
 */
const updateBanner = async (bannerId, bannerData) => {
  // Business logic: Validate banner data
  if (bannerData.imageUrl && bannerData.imageUrl.trim().length === 0) {
    throw new Error('URL hình ảnh không được để trống');
  }

  if (bannerData.title && bannerData.title.trim().length === 0) {
    throw new Error('Tiêu đề banner không được để trống');
  }

  const result = await settingsDao.updateBanner(bannerId, bannerData);
  
  if (!result) {
    throw new Error('Không tìm thấy banner');
  }

  return result;
};

/**
 * Delete a banner
 * @param {String} bannerId - Banner ID
 * @returns {Promise<Array|null>} Updated banners array or null if not found
 */
const deleteBanner = async (bannerId) => {
  const result = await settingsDao.deleteBanner(bannerId);
  
  if (!result) {
    throw new Error('Không tìm thấy banner');
  }

  return result;
};

// Helper functions for validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

const isValidHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

module.exports = {
  getSettings,
  updateStore,
  updateAppearance,
  addBanner,
  updateBanner,
  deleteBanner
};
