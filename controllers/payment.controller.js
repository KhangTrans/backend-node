const Order = require('../models/Order.model');
const Voucher = require('../models/Voucher.model');
const vnpay = require('../config/vnpay');
const zalopay = require('../config/zalopay');

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
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
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
    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip ||
                   '127.0.0.1';

    const paymentUrl = vnpay.createPaymentUrl(
      order.orderNumber,
      parseFloat(order.totalAmount),
      orderInfo || `Thanh toan don hang ${order.orderNumber}`,
      ipAddr,
      locale || 'vn'
    );

    // Save payment info
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        paymentMethod: 'vnpay',
        paymentStatus: 'pending'
      }
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
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderId }
    });

    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Order not found`);
    }

    if (responseCode === '00') {
      // Payment success
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date(),
          transactionId: transactionNo
        }
      });

      return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${order.id}&orderNumber=${orderId}`);
    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'failed'
        }
      });

      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${order.id}&code=${responseCode}`);
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

    const order = await prisma.order.findFirst({
      where: { orderNumber: orderId }
    });

    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (responseCode === '00') {
      // Update order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date()
        }
      });

      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'failed'
        }
      });

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
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
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
      itemid: item.productId.toString(),
      itemname: item.product.name,
      itemprice: parseFloat(item.price),
      itemquantity: item.quantity
    }));

    const result = await zalopay.createOrder(
      order.id,
      parseFloat(order.totalAmount),
      orderInfo || `Thanh toan don hang ${order.orderNumber}`,
      items
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo thanh toán ZaloPay',
        error: result
      });
    }

    // Save payment info
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        paymentMethod: 'zalopay',
        paymentStatus: 'pending',
        transactionId: result.app_trans_id
      }
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
        const order = await prisma.order.findUnique({
          where: { id: parseInt(orderId) }
        });

        if (!order) {
          result.return_code = -1;
          result.return_message = 'Order not found';
        } else if (order.paymentStatus === 'paid') {
          result.return_code = 1;
          result.return_message = 'Order already confirmed';
        } else {
          await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: {
              paymentStatus: 'paid',
              status: 'confirmed',
              paidAt: new Date(),
              transactionId: dataJson.app_trans_id
            }
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

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
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
        totalAmount: order.totalAmount,
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
