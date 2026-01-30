const settingsDao = require('../dao/settings.dao');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    const settings = await settingsDao.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update store information
// @route   PUT /api/settings/store
// @access  Admin
const updateStore = async (req, res) => {
  try {
    const updatedSettings = await settingsDao.updateStore(req.body);
    
    res.status(200).json({
      success: true,
      data: updatedSettings.store,
      message: 'Store information updated successfully'
    });
  } catch (error) {
    console.error('Error in updateStore:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appearance (colors, footer)
// @route   PUT /api/settings/appearance
// @access  Admin
const updateAppearance = async (req, res) => {
  try {
    const updatedSettings = await settingsDao.updateAppearance(req.body);

    res.status(200).json({
      success: true,
      data: updatedSettings.appearance,
      message: 'Appearance updated successfully'
    });
  } catch (error) {
    console.error('Error in updateAppearance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a banner
// @route   POST /api/settings/banners
// @access  Admin
const addBanner = async (req, res) => {
  try {
    const { imageUrl, publicId, title, link, order, isActive } = req.body;
    
    if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    const newBanner = {
      imageUrl,
      publicId,
      title: title || '',
      link: link || '',
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true
    };
    
    const banners = await settingsDao.addBanner(newBanner);

    res.status(201).json({
      success: true,
      data: banners,
      message: 'Banner added successfully'
    });
  } catch (error) {
    console.error('Error in addBanner:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/settings/banners/:id
// @access  Admin
const updateBanner = async (req, res) => {
  try {
    const banners = await settingsDao.updateBanner(req.params.id, req.body);
    
    if (!banners) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      data: banners,
      message: 'Banner updated successfully'
    });
  } catch (error) {
    console.error('Error in updateBanner:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/settings/banners/:id
// @access  Admin
const deleteBanner = async (req, res) => {
  try {
    const banners = await settingsDao.deleteBanner(req.params.id);
    
    if (!banners) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      data: banners,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteBanner:', error);
    res.status(500).json({ success: false, message: error.message });
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
