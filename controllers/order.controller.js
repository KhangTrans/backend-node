const orderService = require('../services/order.service');

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await orderService.createOrder(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo đơn hàng'
    });
  }
};

// Buy Now - Create order directly
const buyNow = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await orderService.buyNow(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Mua hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Buy now error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi mua hàng'
    });
  }
};

// Get user's orders
const getMyOrders = async (req, res) => {
  try {
    const result = await orderService.getMyOrders(req.user.id, req.query);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách đơn hàng'
    });
  }
};

// Get order detail
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId, req.user.id, req.user.role);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    let status = 500;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('Không có quyền')) status = 403;
    
    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin đơn hàng'
    });
  }
};

// Cancel order (user)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(orderId, req.user.id, reason);

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    let status = 500;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('Không thể hủy') || error.message.includes('quyền')) status = 403; // or 400

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi hủy đơn hàng'
    });
  }
};

// Update order info
const updateOrderInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updatedOrder = await orderService.updateOrderInfo(orderId, req.user.id, req.user.role, req.body);

    res.json({
      success: true,
      message: 'Cập nhật thông tin đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order info error:', error);
    let status = 500;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('Không có quyền')) status = 403;
    if (error.message.includes('Chỉ có thể chỉnh sửa')) status = 400;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật thông tin đơn hàng'
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách đơn hàng'
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updatedOrder = await orderService.updateOrderStatus(orderId, req.body);

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    let status = 500;
    if (error.message === 'Không tìm thấy đơn hàng') status = 404;
    if (error.message.includes('Không thể')) status = 400;

    res.status(status).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật trạng thái đơn hàng'
    });
  }
};

// Get order statistics (Admin)
const getOrderStatistics = async (req, res) => {
  try {
    const stats = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thống kê đơn hàng'
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics,
  buyNow,
  updateOrderInfo
};
