/**
 * Services Index
 * Central export point for all service modules
 */

const settingsService = require('./settings.service');
const voucherService = require('./voucher.service');
const cartService = require('./cart.service');
const productService = require('./product.service');
const orderService = require('./order.service');
const categoryService = require('./category.service');
const authService = require('./auth.service');
const userService = require('./user.service');
const addressService = require('./address.service');
const chatService = require('./chat.service');
const chatbotService = require('./chatbot.service');
const notificationService = require('./notification.service');
const sitemapService = require('./sitemap.service');
const uploadService = require('./upload.service');
const paymentService = require('./payment.service');
const reviewService = require('./review.service');
const productBannerService = require('./productBanner.service');

module.exports = {
  settingsService,
  voucherService,
  cartService,
  productService,
  orderService,
  categoryService,
  authService,
  userService,
  addressService,
  chatService,
  chatbotService,
  notificationService,
  sitemapService,
  uploadService,
  paymentService,
  reviewService,
  productBannerService
};
