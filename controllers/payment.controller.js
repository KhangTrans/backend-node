const Order = require('../models/Order.model');
const Voucher = require('../models/Voucher.model');
const vnpay = require('../config/vnpay');
const zalopay = require('../config/zalopay');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');

// @desc    Create VNPay payment URL
// @route   POST /api/payment/vnpay/create
// @access  Private
exports.createVNPayPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, locale } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin orderId hoặc amount'
      });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thanh toán đơn hàng này'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Get client IP
    // Get client IP
    const forwardedIps = req.headers['x-forwarded-for']?.split(',').map(ip => ip.trim());
    const ipAddr = forwardedIps?.[0] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip ||
                   '127.0.0.1';

    const paymentUrl = vnpay.createPaymentUrl(
      order.orderNumber,
      parseFloat(order.total),
      orderInfo || `Thanh toan don hang ${order.orderNumber}`,
      ipAddr,
      locale || 'vn'
    );

    // Save payment info
    await Order.findByIdAndUpdate(orderId, {
      paymentMethod: 'vnpay',
      paymentStatus: 'pending'
    });

    res.status(200).json({
      success: true,
      data: {
        paymentUrl,
        orderId: order.id,
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    console.error('Create VNPay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thanh toán VNPay',
      error: error.message
    });
  }
};

// @desc    VNPay return callback (after payment)
// @route   GET /api/payment/vnpay/return
// @access  Public
exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;

    const isValid = vnpay.verifyReturnUrl(vnp_Params);

    if (!isValid) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const amount = vnp_Params['vnp_Amount'] / 100;
    const transactionNo = vnp_Params['vnp_TransactionNo'];

    // Find order by orderNumber
    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Order not found`);
    }

    if (responseCode === '00') {
      console.log(`[VNPay Return] Payment successful for order ${orderId}. Updating status...`);
      
      // Update Order Status
      const updateResult = await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'paid',
        orderStatus: 'processing',
        paidAt: new Date(),
        transactionId: transactionNo
      }, { new: true });
      
      console.log(`[VNPay Return] Update result: ${updateResult.paymentStatus}`);

      // Clear cart on success
      await Cart.findOneAndUpdate(
        { userId: order.userId },
        { items: [] }
      );

      return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${order._id}&orderNumber=${orderId}`);
    } else {
      // Payment failed
      if (order.paymentStatus !== 'failed') {
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'failed',
          status: 'cancelled' // Cancel order
        });

        // Restore stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity }
          });
        }
      }

      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${order._id}&code=${responseCode}`);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
  }
};

// @desc    VNPay IPN (Instant Payment Notification)
// @route   POST /api/payment/vnpay/ipn
// @access  Public
exports.vnpayIPN = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = vnpay.sortObject(vnp_Params);

    const isValid = vnpay.verifyReturnUrl({ ...vnp_Params, vnp_SecureHash: secureHash });

    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const amount = vnp_Params['vnp_Amount'] / 100;

    const order = await Order.findOne({ orderNumber: orderId });

    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (responseCode === '00') {
      // Update order
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'paid',
        status: 'processing',
        paidAt: new Date()
      });

      // Clear cart on success (IPN backup)
      await Cart.findOneAndUpdate(
        { userId: order.userId },
        { items: [] }
      );

      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      // Payment failed / Cancelled
      if (order.paymentStatus !== 'failed') {
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'failed',
          status: 'cancelled'
        });

        // Restore stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity }
          });
        }
      }

      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'System error' });
  }
};

// @desc    Create ZaloPay payment
// @route   POST /api/payment/zalopay/create
// @access  Private
exports.createZaloPayPayment = async (req, res) => {
  try {
    const { orderId, amount, orderInfo } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin orderId hoặc amount'
      });
    }

    // Verify order
    const order = await Order.findById(orderId).populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thanh toán đơn hàng này'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Format items for ZaloPay
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
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo thanh toán ZaloPay: ' + (result.sub_return_message || result.return_message || 'Lỗi không xác định'),
        resultCode: result.return_code,
        error: result
      });
    }

    // Save payment info
    await Order.findByIdAndUpdate(orderId, {
      paymentMethod: 'zalopay',
      paymentStatus: 'pending',
      transactionId: result.app_trans_id
    });

    res.status(200).json({
      success: true,
      data: {
        order_url: result.order_url,
        zp_trans_token: result.zp_trans_token,
        app_trans_id: result.app_trans_id,
        orderId: order.id,
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    console.error('Create ZaloPay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thanh toán ZaloPay',
      error: error.message
    });
  }
};

// @desc    ZaloPay callback
// @route   POST /api/payment/zalopay/callback
// @access  Public
exports.zaloPayCallback = async (req, res) => {
  try {
    let result = {};
    console.log('ZaloPay callback received:', req.body);

    try {
      const dataStr = req.body.data;
      const reqMac = req.body.mac;

      const isValid = zalopay.verifyCallback(dataStr, reqMac);

      if (!isValid) {
        result.return_code = -1;
        result.return_message = 'mac not equal';
      } else {
        const dataJson = JSON.parse(dataStr);
        const embed_data = JSON.parse(dataJson.embed_data);
        const orderId = embed_data.orderId;

        console.log('ZaloPay callback - Order ID:', orderId);
        console.log('ZaloPay callback - Data:', dataJson);

        // Update order
        const order = await Order.findById(orderId);

        if (!order) {
          result.return_code = -1;
          result.return_message = 'Order not found';
        } else if (order.paymentStatus === 'paid') {
          result.return_code = 1;
          result.return_message = 'Order already confirmed';
        } else {
          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: 'paid',
            status: 'processing',
            paidAt: new Date(),
            transactionId: dataJson.app_trans_id
          });

          result.return_code = 1;
          result.return_message = 'success';
        }
      }
    } catch (ex) {
      console.error('ZaloPay callback error:', ex);
      result.return_code = 0;
      result.return_message = ex.message;
    }

    res.json(result);
  } catch (error) {
    console.error('ZaloPay callback error:', error);
    res.json({ return_code: 0, return_message: error.message });
  }
};

// @desc    Query payment status
// @route   GET /api/payment/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: order.total,
        paidAt: order.paidAt,
        transactionId: order.transactionId
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái thanh toán',
      error: error.message
    });
  }
};
