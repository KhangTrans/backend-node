const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

// Helper function to convert buffer to stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Helper function to parse form data in serverless
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    req.on('error', reject);
  });
}

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

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Must be base64 string starting with "data:image/"'
      });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary not configured. Missing environment variables.');
      return res.status(500).json({
        success: false,
        message: 'Image upload service not configured. Please contact administrator.',
        debug: process.env.NODE_ENV === 'development' ? {
          cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: !!process.env.CLOUDINARY_API_KEY,
          apiSecret: !!process.env.CLOUDINARY_API_SECRET
        } : undefined
      });
    }

    // Check image size (base64 string length)
    const sizeInMB = (image.length * 0.75) / (1024 * 1024); // Approximate size
    if (sizeInMB > 10) {
      return res.status(400).json({
        success: false,
        message: `Image too large: ${sizeInMB.toFixed(2)}MB. Maximum allowed: 10MB`
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: folder,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });
  } catch (error) {
    console.error('Upload base64 error:', error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name
    });
    
    res.status(500).json({
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

// @desc    Test Cloudinary configuration
// @route   GET /api/upload/test-config
// @access  Private
exports.testConfig = async (req, res) => {
  try {
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

    const isConfigured = hasCloudName && hasApiKey && hasApiSecret;

    res.status(200).json({
      success: isConfigured,
      message: isConfigured ? 'Cloudinary is configured' : 'Cloudinary is NOT configured',
      config: {
        cloudName: hasCloudName ? process.env.CLOUDINARY_CLOUD_NAME : 'NOT SET',
        apiKey: hasApiKey ? process.env.CLOUDINARY_API_KEY : 'NOT SET',
        apiSecret: hasApiSecret ? '***' + process.env.CLOUDINARY_API_SECRET?.slice(-4) : 'NOT SET'
      },
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
