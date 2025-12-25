const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');

// Try-catch wrapper for multer to prevent crashes
let upload;
try {
  const cloudinaryConfig = require('../config/cloudinary');
  upload = cloudinaryConfig.upload;
} catch (error) {
  console.error('Multer initialization error:', error);
  upload = null;
}

// Routes - Base64 upload (serverless-friendly, no multer needed)
router.post('/base64', protect, uploadController.uploadBase64);

// Test configuration
router.get('/test-config', protect, uploadController.testConfig);

// Routes with multer (may not work on serverless)
if (upload) {
  router.post('/image', protect, upload.single('image'), uploadController.uploadImage);
  router.post('/images', protect, upload.array('images', 10), uploadController.uploadImages);
}

// Routes without multer
router.delete('/image/:publicId', protect, uploadController.deleteImage);
router.get('/signature', protect, uploadController.getUploadSignature);

module.exports = router;
