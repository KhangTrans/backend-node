const settingsService = require('../services/settings.service');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    // Service handles business logic
    const settings = await settingsService.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update store information
// @route   PUT /api/settings/store
// @access  Admin
const updateStore = async (req, res) => {
  try {
    // Service handles validation and update logic
    const updatedSettings = await settingsService.updateStore(req.body);
    
    res.status(200).json({
      success: true,
      data: updatedSettings.store,
      message: 'Store information updated successfully'
    });
  } catch (error) {
    console.error('Error in updateStore:', error);
    const statusCode = error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update appearance (colors, footer)
// @route   PUT /api/settings/appearance
// @access  Admin
const updateAppearance = async (req, res) => {
  try {
    // Service handles validation and update logic
    const updatedSettings = await settingsService.updateAppearance(req.body);

    res.status(200).json({
      success: true,
      data: updatedSettings.appearance,
      message: 'Appearance updated successfully'
    });
  } catch (error) {
    console.error('Error in updateAppearance:', error);
    const statusCode = error.message.includes('không hợp lệ') ? 400 : 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Add a banner
// @route   POST /api/settings/banners
// @access  Admin
const addBanner = async (req, res) => {
  try {
    const { imageUrl, publicId, link, order, isActive } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Image URL is required' 
      });
    }

    const bannerData = {
      imageUrl,
      publicId,
      link: link || '',
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true
    };
    
    // Service handles validation and creation logic
    const banners = await settingsService.addBanner(bannerData);

    res.status(201).json({
      success: true,
      data: banners,
      message: 'Banner added successfully'
    });
  } catch (error) {
    console.error('Error in addBanner:', error);
    const statusCode = error.message.includes('required') ? 400 : 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update a banner
// @route   PUT /api/settings/banners/:id
// @access  Admin
const updateBanner = async (req, res) => {
  try {
    // Service handles validation and update logic
    const banners = await settingsService.updateBanner(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: banners,
      message: 'Banner updated successfully'
    });
  } catch (error) {
    console.error('Error in updateBanner:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/settings/banners/:id
// @access  Admin
const deleteBanner = async (req, res) => {
  try {
    // Service handles validation and deletion logic
    const banners = await settingsService.deleteBanner(req.params.id);

    res.status(200).json({
      success: true,
      data: banners,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteBanner:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getSettings,
  updateStore,
  updateAppearance,
  addBanner,
  updateBanner,
  deleteBanner
};
