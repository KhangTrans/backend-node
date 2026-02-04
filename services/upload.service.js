/**
 * Upload Service
 * Handles file uploads and Cloudinary interactions
 */

const { cloudinary } = require('../config/cloudinary');

/**
 * Upload image from base64
 * @param {string} image - Base64 string
 * @param {string} folder
 * @returns {Object} upload result
 */
const uploadBase64 = async (image, folder = 'products') => {
  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured');
  }

  // Validate base64 format
  if (!image.startsWith('data:image/')) {
    throw new Error('Invalid image format. Must be base64 string starting with "data:image/"');
  }

  // Check image size (approximate)
  const sizeInMB = (image.length * 0.75) / (1024 * 1024);
  if (sizeInMB > 10) {
    throw new Error(`Image too large: ${sizeInMB.toFixed(2)}MB. Maximum allowed: 10MB`);
  }

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(image, {
    folder: folder,
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' }
    ]
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes
  };
};

/**
 * Delete image
 * @param {string} publicId
 * @returns {Object} result
 */
const deleteImage = async (publicId) => {
  // Decode public_id if it's URL encoded
  const decodedPublicId = decodeURIComponent(publicId);

  const result = await cloudinary.uploader.destroy(decodedPublicId);
  return result;
};

/**
 * Get upload signature
 * @param {string} folder
 * @returns {Object} signature data
 */
const getUploadSignature = (folder = 'products') => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: folder
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature: signature,
    timestamp: timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: folder
  };
};

/**
 * Test configuration
 * @returns {Object} status
 */
const testConfig = () => {
  const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
  const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

  const isConfigured = hasCloudName && hasApiKey && hasApiSecret;

  return {
    isConfigured,
    config: {
      cloudName: hasCloudName ? process.env.CLOUDINARY_CLOUD_NAME : 'NOT SET',
      apiKey: hasApiKey ? process.env.CLOUDINARY_API_KEY : 'NOT SET',
      apiSecret: hasApiSecret ? '***' + process.env.CLOUDINARY_API_SECRET?.slice(-4) : 'NOT SET'
    }
  };
};

module.exports = {
  uploadBase64,
  deleteImage,
  getUploadSignature,
  testConfig
};
