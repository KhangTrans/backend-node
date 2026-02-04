const paymentService = require('../services/payment.service');

// @desc    Create VNPay payment URL
// @route   POST /api/payment/vnpay/create
// @access  Private
exports.createVNPayPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get client IP
    const forwardedIps = req.headers['x-forwarded-for']?.split(',').map(ip => ip.trim());
    const ipAddr = forwardedIps?.[0] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip ||
                   '127.0.0.1';

    const result = await paymentService.createVNPayPayment(userId, userRole, ipAddr, req.body);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create VNPay payment error:', error);
    let status = 500;
    if (error.message.includes('Thiếu thông tin') || error.message.includes('đã được thanh toán')) status = 400;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('quyền')) status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi tạo thanh toán VNPay'
    });
  }
};

// @desc    VNPay return callback (after payment)
// @route   GET /api/payment/vnpay/return
// @access  Public
exports.vnpayReturn = async (req, res) => {
  try {
    const result = await paymentService.handleVNPayReturn(req.query);

    if (result.success) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${result.orderId}&orderNumber=${result.orderNumber}`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${result.orderId}&code=${result.code}`);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    const message = error.message || 'System error';
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(message)}`);
  }
};

// @desc    VNPay IPN (Instant Payment Notification)
// @route   POST /api/payment/vnpay/ipn
// @access  Public
exports.vnpayIPN = async (req, res) => {
  try {
    const result = await paymentService.handleVNPayIPN(req.query);
    return res.status(200).json(result);
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await paymentService.createZaloPayPayment(userId, userRole, req.body);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create ZaloPay payment error:', error);
    let status = 500;
    if (error.message.includes('Thiếu thông tin') || error.message.includes('đã được thanh toán') || error.message.includes('Không thể tạo')) status = 400;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('quyền')) status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi tạo thanh toán ZaloPay'
    });
  }
};

// @desc    ZaloPay callback
// @route   POST /api/payment/zalopay/callback
// @access  Public
exports.zaloPayCallback = async (req, res) => {
  try {
    const result = await paymentService.handleZaloPayCallback(req.body);
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await paymentService.getPaymentStatus(orderId, userId, userRole);

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
    let status = 500;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('quyền')) status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi lấy trạng thái thanh toán'
    });
  }
};
