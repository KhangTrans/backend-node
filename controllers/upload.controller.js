const uploadService = require('../services/upload.service');

// @desc    Upload single image (with multer)
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        width: req.file.width || null,
        height: req.file.height || null,
        format: req.file.format || null,
        size: req.file.size || null
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// @desc    Upload image from base64 (serverless-friendly)
// @route   POST /api/upload/base64
// @access  Private
exports.uploadBase64 = async (req, res) => {
  try {
    const { image, folder = 'products' } = req.body;

    // Validate image data
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    const result = await uploadService.uploadBase64(image, folder);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Upload base64 error:', error);
    let status = 500;
    if (error.message.includes('Invalid image format') || error.message.includes('Image too large')) {
      status = 400;
    }
    
    res.status(status).json({
      success: false,
      message: 'Error uploading image',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedImages = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      width: file.width || null,
      height: file.height || null,
      format: file.format || null,
      size: file.size || null,
      order: index
    }));

    res.status(200).json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      count: req.files.length,
      data: uploadedImages
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await uploadService.deleteImage(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted',
        data: result
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// @desc    Get Cloudinary upload signature for client-side upload
// @route   GET /api/upload/signature
// @access  Private
exports.getUploadSignature = async (req, res) => {
  try {
    const folder = req.query.folder || 'products';
    const result = uploadService.getUploadSignature(folder);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating signature',
      error: error.message
    });
  }
};

// @desc    Test Cloudinary configuration
// @route   GET /api/upload/test-config
// @access  Private
exports.testConfig = async (req, res) => {
  try {
    const result = uploadService.testConfig();

    res.status(200).json({
      success: result.isConfigured,
      message: result.isConfigured ? 'Cloudinary is configured' : 'Cloudinary is NOT configured',
      config: result.config,
      environment: process.env.NODE_ENV || 'development',
      vercel: process.env.VERCEL === '1'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking configuration',
      error: error.message
    });
  }
};
