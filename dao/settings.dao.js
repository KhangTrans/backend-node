const Settings = require('../models/Settings');

/**
 * Settings DAO - Data Access Object layer
 * Handles all database operations related to store settings
 */

// Get settings - ensure only one document exists
const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

// Update store information
const updateStore = async (storeData) => {
  const settings = await getSettings();
  
  Object.keys(storeData).forEach(key => {
    if (storeData[key] !== undefined) {
      settings.store[key] = storeData[key];
    }
  });

  return await settings.save();
};

// Update appearance
const updateAppearance = async (appearanceData) => {
  const settings = await getSettings();
  
  if (appearanceData.primaryColor !== undefined) {
    settings.appearance.primaryColor = appearanceData.primaryColor;
  }
  if (appearanceData.footerText !== undefined) {
    settings.appearance.footerText = appearanceData.footerText;
  }
  if (appearanceData.banners && Array.isArray(appearanceData.banners)) {
    settings.appearance.banners = appearanceData.banners;
  }

  return await settings.save();
};

// Add banner
const addBanner = async (bannerData) => {
  const settings = await getSettings();
  settings.appearance.banners.push(bannerData);
  await settings.save();
  return settings.appearance.banners;
};

// Update banner
const updateBanner = async (bannerId, bannerData) => {
  const settings = await getSettings();
  const banner = settings.appearance.banners.id(bannerId);
  
  if (!banner) return null;

  Object.keys(bannerData).forEach(key => {
    if (bannerData[key] !== undefined) {
      banner[key] = bannerData[key];
    }
  });

  await settings.save();
  return settings.appearance.banners;
};

// Delete banner
const deleteBanner = async (bannerId) => {
  const settings = await getSettings();
  const banner = settings.appearance.banners.id(bannerId);
  
  if (!banner) return null;

  settings.appearance.banners.pull(bannerId);
  await settings.save();
  return settings.appearance.banners;
};

module.exports = {
  getSettings,
  updateStore,
  updateAppearance,
  addBanner,
  updateBanner,
  deleteBanner
};
