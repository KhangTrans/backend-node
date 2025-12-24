const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

// Routes
router.post('/image', protect, upload.single('image'), uploadController.uploadImage);
router.post('/images', protect, upload.array('images', 10), uploadController.uploadImages);
router.delete('/image/:publicId', protect, uploadController.deleteImage);
router.get('/signature', protect, uploadController.getUploadSignature);

module.exports = router;
