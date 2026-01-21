/**
 * DAO Index - Export all DAOs
 */

const addressDao = require('./address.dao');
const userDao = require('./user.dao');
const cartDao = require('./cart.dao');
const categoryDao = require('./category.dao');
const productDao = require('./product.dao');
const notificationDao = require('./notification.dao');
const voucherDao = require('./voucher.dao');
const orderDao = require('./order.dao');

module.exports = {
  addressDao,
  userDao,
  cartDao,
  categoryDao,
  productDao,
  notificationDao,
  voucherDao,
  orderDao
};
