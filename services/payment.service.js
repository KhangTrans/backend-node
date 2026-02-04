/**
 * Payment Service
 * Handles payment gateway interactions and payment status updates
 */

const orderDao = require('../dao/order.dao');
const cartDao = require('../dao/cart.dao');
const productDao = require('../dao/product.dao');
const vnpay = require('../config/vnpay');
const zalopay = require('../config/zalopay');

/**
 * Create VNPay Payment URL
 * @param {String} userId
 * @param {String} ipAddr
 * @param {Object} paymentData - orderId, amount, orderInfo, locale
 * @returns {Promise<Object>} paymentUrl, orderId, orderNumber
 */
const createVNPayPayment = async (userId, userRole, ipAddr, paymentData) => {
  const { orderId, amount, orderInfo, locale } = paymentData;

  if (!orderId || !amount) {
    throw new Error('Thiếu thông tin orderId hoặc amount');
  }

  const order = await orderDao.findById(orderId);

  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }

  if (order.userId.toString() !== userId.toString() && userRole !== 'admin') {
    throw new Error('Bạn không có quyền thanh toán đơn hàng này');
  }

  if (order.paymentStatus === 'paid') {
    throw new Error('Đơn hàng đã được thanh toán');
  }

  const paymentUrl = vnpay.createPaymentUrl(
    order.orderNumber,
    parseFloat(order.total),
    orderInfo || `Thanh toan don hang ${order.orderNumber}`,
    ipAddr,
    locale || 'vn'
  );

  await orderDao.updateById(orderId, {
    paymentMethod: 'vnpay',
    paymentStatus: 'pending'
  });

  return {
    paymentUrl,
    orderId: order.id,
    orderNumber: order.orderNumber
  };
};

/**
 * Handle VNPay Return (after redirect)
 * @param {Object} vnp_Params
 * @returns {Promise<Object>} result object with redirect info or status
 */
const handleVNPayReturn = async (vnp_Params) => {
  const isValid = vnpay.verifyReturnUrl(vnp_Params);

  if (!isValid) {
      throw new Error('Invalid signature');
  }

  const orderId = vnp_Params['vnp_TxnRef']; // This is actually orderNumber usually, verify dao logic
  const responseCode = vnp_Params['vnp_ResponseCode'];
  const transactionNo = vnp_Params['vnp_TransactionNo'];

  // orderId passed to VNPay was orderNumber.
  const order = await orderDao.findByOrderNumber(orderId);

  if (!order) {
      throw new Error('Order not found');
  }

  if (responseCode === '00') {
      await orderDao.updateById(order._id, {
          paymentStatus: 'paid',
          orderStatus: 'processing', // Should confirm if logic was 'pending' or 'processing'
          paidAt: new Date(),
          transactionId: transactionNo
      });
      await cartDao.clearItems(order.userId);
      return { success: true, orderId: order._id, orderNumber: order.orderNumber };
  } else {
      if (order.paymentStatus !== 'failed') {
          await orderDao.updateById(order._id, {
              paymentStatus: 'failed',
              orderStatus: 'cancelled'
          });
          for (const item of order.items) {
              await productDao.updateStock(item.productId, item.quantity);
          }
      }
      return { success: false, orderId: order._id, code: responseCode };
  }
};

/**
 * Handle VNPay IPN
 * @param {Object} vnp_Params
 * @returns {Promise<Object>} RspCode, Message
 */
const handleVNPayIPN = async (vnp_Params) => {
  const secureHash = vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];
  
  const sortedParams = vnpay.sortObject(vnp_Params);
  const isValid = vnpay.verifyReturnUrl({ ...sortedParams, vnp_SecureHash: secureHash });

  if (!isValid) return { RspCode: '97', Message: 'Invalid signature' };

  const orderId = vnp_Params['vnp_TxnRef'];
  const responseCode = vnp_Params['vnp_ResponseCode'];

  const order = await orderDao.findByOrderNumber(orderId);
  if (!order) return { RspCode: '01', Message: 'Order not found' };

  if (order.paymentStatus === 'paid') return { RspCode: '02', Message: 'Order already confirmed' };

  if (responseCode === '00') {
      await orderDao.updateById(order._id, {
          paymentStatus: 'paid',
          orderStatus: 'processing',
          paidAt: new Date()
      });
      await cartDao.clearItems(order.userId);
      return { RspCode: '00', Message: 'Success' };
  } else {
      if (order.paymentStatus !== 'failed') {
          await orderDao.updateById(order._id, {
              paymentStatus: 'failed',
              orderStatus: 'cancelled'
          });
          for (const item of order.items) {
              await productDao.updateStock(item.productId, item.quantity);
          }
      }
      return { RspCode: '00', Message: 'Success' }; // Acknowledge IPN even if failed payment
  }
};

/**
 * Create ZaloPay Payment
 * @param {String} userId
 * @param {String} userRole
 * @param {Object} paymentData
 */
const createZaloPayPayment = async (userId, userRole, paymentData) => {
    const { orderId, amount, orderInfo } = paymentData;

    if (!orderId || !amount) throw new Error('Thiếu thông tin orderId hoặc amount');

    const order = await orderDao.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.userId.toString() !== userId.toString() && userRole !== 'admin') throw new Error('Bạn không có quyền thanh toán đơn hàng này');
    if (order.paymentStatus === 'paid') throw new Error('Đơn hàng đã được thanh toán');

    const items = order.items.map(item => ({
        itemid: (item.productId?._id || item.productId).toString(),
        itemname: item.productId?.name || item.productName,
        itemprice: parseFloat(item.price),
        itemquantity: item.quantity
    }));

    const result = await zalopay.createOrder(
        order.id,
        parseFloat(order.total),
        orderInfo || `Thanh toan don hang ${order.orderNumber}`,
        items
    );

    if (!result.success) {
        throw new Error('Không thể tạo thanh toán ZaloPay: ' + (result.sub_return_message || result.return_message));
    }

    await orderDao.updateById(orderId, {
        paymentMethod: 'zalopay',
        paymentStatus: 'pending',
        transactionId: result.app_trans_id
    });

    return {
        order_url: result.order_url,
        zp_trans_token: result.zp_trans_token,
        app_trans_id: result.app_trans_id,
        orderId: order.id,
        orderNumber: order.orderNumber
    };
};

/**
 * Handle ZaloPay Callback
 * @param {Object} body
 */
const handleZaloPayCallback = async (body) => {
    const dataStr = body.data;
    const reqMac = body.mac;

    const isValid = zalopay.verifyCallback(dataStr, reqMac);
    if (!isValid) return { return_code: -1, return_message: 'mac not equal' };

    const dataJson = JSON.parse(dataStr);
    const embed_data = JSON.parse(dataJson.embed_data);
    const orderId = embed_data.orderId;

    const order = await orderDao.findById(orderId);
    if (!order) return { return_code: -1, return_message: 'Order not found' };
    if (order.paymentStatus === 'paid') return { return_code: 1, return_message: 'Order already confirmed' };

    await orderDao.updateById(orderId, {
        paymentStatus: 'paid',
        orderStatus: 'processing',
        paidAt: new Date(),
        transactionId: dataJson.app_trans_id
    });

    return { return_code: 1, return_message: 'success' };
};

/**
 * Get Payment Status
 */
const getPaymentStatus = async (orderId, userId, userRole) => {
    const order = await orderDao.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    if (order.userId.toString() !== userId.toString() && userRole !== 'admin') throw new Error('Bạn không có quyền xem đơn hàng này');
    return order;
};

module.exports = {
  createVNPayPayment,
  handleVNPayReturn,
  handleVNPayIPN,
  createZaloPayPayment,
  handleZaloPayCallback,
  getPaymentStatus
};
