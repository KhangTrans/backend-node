const { cloudinary } = require('../config/cloudinary');

// @desc    Upload single image
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

    // Decode public_id if it's URL encoded
    const decodedPublicId = decodeURIComponent(publicId);

    const result = await cloudinary.uploader.destroy(decodedPublicId);

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
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.query.folder || 'products';

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      success: true,
      data: {
        signature: signature,
        timestamp: timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: folder
      }
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
