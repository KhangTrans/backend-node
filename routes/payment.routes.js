const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createVNPayPayment,
  vnpayReturn,
  vnpayIPN,
  createZaloPayPayment,
  zaloPayCallback,
  getPaymentStatus
} = require('../controllers/payment.controller');

// VNPay routes
router.post('/vnpay/create', protect, createVNPayPayment);
router.get('/vnpay/return', vnpayReturn);
router.get('/vnpay/ipn', vnpayIPN);

// ZaloPay routes
router.post('/zalopay/create', protect, createZaloPayPayment);
router.post('/zalopay/callback', zaloPayCallback);

// Payment status
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
