const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const admin = authorize('admin');

router.get('/', settingsController.getSettings);
router.put('/store', protect, admin, settingsController.updateStore);
router.put('/appearance', protect, admin, settingsController.updateAppearance);
router.post('/banners', protect, admin, settingsController.addBanner);
router.put('/banners/:id', protect, admin, settingsController.updateBanner);
router.delete('/banners/:id', protect, admin, settingsController.deleteBanner);

module.exports = router;
