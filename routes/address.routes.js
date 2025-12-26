const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Get all addresses of user
router.get('/', addressController.getAddresses);

// Get default address
router.get('/default', addressController.getDefaultAddress);

// Get address by ID
router.get('/:addressId', addressController.getAddressById);

// Create new address
router.post('/', addressController.createAddress);

// Update address
router.put('/:addressId', addressController.updateAddress);

// Set default address
router.put('/:addressId/set-default', addressController.setDefaultAddress);

// Delete address
router.delete('/:addressId', addressController.deleteAddress);

module.exports = router;
