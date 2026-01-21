const orderDao = require('../dao/order.dao');
const cartDao = require('../dao/cart.dao');
const productDao = require('../dao/product.dao');
const voucherDao = require('../dao/voucher.dao');
const { notifyAdmin, notifyUser } = require('../config/socket');

// Helper function to format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${random}`;
};

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingWard,
      shippingNote,
      paymentMethod = 'cod',
      voucherIds
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !shippingCity) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin giao hàng'
      });
    }

    // Get user's cart
    const cart = await cartDao.findByUserIdWithProducts(userId);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống'
      });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.productId.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.productId.name}" chỉ còn ${item.productId.stock} trong kho`
        });
      }
      if (!item.productId.isActive) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.productId.name}" không còn khả dụng`
        });
      }
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Initialize pricing
    let shippingFee = 30000;
    if (subtotal > 500000) {
      shippingFee = 0;
    }
    let discount = 0;

    // Apply voucher(s)
    let discountVoucherId = null;
    let shippingVoucherId = null;

    if (voucherIds && Array.isArray(voucherIds) && voucherIds.length > 0) {
      for (const vId of voucherIds) {
        try {
          const voucher = await voucherDao.findById(vId, false);

          if (!voucher) continue;
          if (!voucher.isActive) continue;
          
          const now = new Date();
          if (now < voucher.startDate || now > voucher.endDate) continue;
          if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) continue;
          if (voucher.userId !== null && voucher.userId.toString() !== userId.toString()) continue;
          if (subtotal < parseFloat(voucher.minOrderAmount)) continue;

          // Check if user has already used this voucher
          const existingUsage = await orderDao.hasUserUsedVoucher(userId, voucher._id);

          if (existingUsage) {
            return res.status(400).json({
              success: false,
              message: `Bạn đã sử dụng voucher "${voucher.code}" rồi`
            });
          }

          // Apply
          if (voucher.type === 'DISCOUNT' && !discountVoucherId) {
            discountVoucherId = voucher._id;
            let d = (subtotal * voucher.discountPercent) / 100;
            if (voucher.maxDiscount) {
              d = Math.min(d, parseFloat(voucher.maxDiscount));
            }
            discount += d;
          } else if (voucher.type === 'FREE_SHIP' && !shippingVoucherId) {
            shippingVoucherId = voucher._id;
            shippingFee = 0;
          }
        } catch (err) {
          console.log('Error applying voucher id:', vId, err.message);
        }
      }
    }

    const total = subtotal + shippingFee - discount;

    // Generate order number
    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existing = await orderDao.findByOrderNumber(orderNumber);
      if (!existing) isUnique = true;
    }

    // Create order
    const order = await orderDao.create({
      orderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingWard,
      shippingNote,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      voucherId: discountVoucherId || shippingVoucherId,
      items: cart.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productImage: item.productId.images[0]?.imageUrl || null,
        price: item.price,
        quantity: item.quantity,
        subtotal: parseFloat(item.price) * item.quantity
      }))
    });

    // Update product stock
    for (const item of cart.items) {
      await productDao.updateStock(item.productId._id, -item.quantity);
    }

    // Update voucher usage count
    if (discountVoucherId) {
      await voucherDao.incrementUsageCount(discountVoucherId);
    }
    if (shippingVoucherId) {
      await voucherDao.incrementUsageCount(shippingVoucherId);
    }

    // Clear cart ONLY if COD
    if (paymentMethod === 'cod') {
      await cartDao.clearItems(userId);
    }

    // Populate order
    await order.populate([
      { path: 'items.productId' },
      { path: 'voucherId' }
    ]);

    // Notify admin
    try {
      await notifyAdmin(
        'ORDER_CREATED',
        'Đơn hàng mới',
        `Đơn hàng ${order.orderNumber} từ ${customerName} (${formatPrice(order.total)})`,
        order._id.toString()
      );
    } catch (notifyError) {
      console.error('Error notifying admin:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      error: error.message
    });
  }
};

// Get user's orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      orderDao.findByUserId(userId, filter, {
        skip,
        limit: parseInt(limit)
      }),
      orderDao.countByUserId(userId, filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

// Get order detail
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await orderDao.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check permission
    if (order.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập đơn hàng này'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn hàng',
      error: error.message
    });
  }
};

// Cancel order (user)
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderDao.findByIdWithProducts(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check permission
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền hủy đơn hàng này'
      });
    }

    // Check if order can be cancelled
    if (['shipping', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái này'
      });
    }

    // Cancel order and restore stock
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Khách hàng hủy đơn';
    await orderDao.save(order);

    // Restore product stock
    for (const item of order.items) {
      await productDao.updateStock(item.productId, item.quantity);
    }

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn hàng',
      error: error.message
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, paymentMethod } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) {
      filter.orderStatus = status;
    }
    if (paymentMethod) {
      let methods;
      if (Array.isArray(paymentMethod)) {
        methods = paymentMethod;
      } else {
        methods = paymentMethod.split(',').map(m => m.trim());
      }
      filter.paymentMethod = { $in: methods };
    }
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      orderDao.findAll(filter, {
        skip,
        limit: parseInt(limit)
      }),
      orderDao.count(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await orderDao.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      
      if (orderStatus === 'shipping' && !order.shippedAt) {
        order.shippedAt = new Date();
      } else if (orderStatus === 'delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !order.paidAt) {
        order.paidAt = new Date();
      }
    }

    await orderDao.save(order);

    // Populate order
    const updatedOrder = await orderDao.findByIdWithUser(orderId);

    // Send notification to user
    try {
      let notificationTitle = 'Cập nhật đơn hàng';
      let notificationMessage = '';

      if (orderStatus) {
        switch (orderStatus) {
          case 'confirmed':
            notificationTitle = 'Đơn hàng đã xác nhận';
            notificationMessage = `Đơn hàng ${order.orderNumber} đã được xác nhận và đang được xử lý`;
            break;
          case 'processing':
            notificationTitle = 'Đơn hàng đang xử lý';
            notificationMessage = `Đơn hàng ${order.orderNumber} đang được chuẩn bị`;
            break;
          case 'shipping':
            notificationTitle = 'Đơn hàng đang giao';
            notificationMessage = `Đơn hàng ${order.orderNumber} đang trên đường giao đến bạn`;
            break;
          case 'delivered':
            notificationTitle = 'Đơn hàng đã giao';
            notificationMessage = `Đơn hàng ${order.orderNumber} đã được giao thành công`;
            break;
          case 'cancelled':
            notificationTitle = 'Đơn hàng đã hủy';
            notificationMessage = `Đơn hàng ${order.orderNumber} đã bị hủy`;
            break;
        }
      }

      if (paymentStatus === 'paid') {
        notificationTitle = 'Thanh toán thành công';
        notificationMessage = `Thanh toán cho đơn hàng ${order.orderNumber} đã được xác nhận`;
      }

      if (notificationMessage) {
        await notifyUser(
          updatedOrder.userId,
          orderStatus === 'cancelled' ? 'ORDER_CANCELLED' : 
          orderStatus === 'confirmed' ? 'ORDER_CONFIRMED' :
          orderStatus === 'shipping' ? 'ORDER_SHIPPING' :
          orderStatus === 'delivered' ? 'ORDER_DELIVERED' :
          paymentStatus === 'paid' ? 'PAYMENT_CONFIRMED' : 'SYSTEM',
          notificationTitle,
          notificationMessage,
          updatedOrder._id.toString()
        );
      }
    } catch (notifyError) {
      console.error('Error notifying user:', notifyError);
    }

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

// Get order statistics (Admin)
const getOrderStatistics = async (req, res) => {
  try {
    const stats = await orderDao.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đơn hàng',
      error: error.message
    });
  }
};

// Buy Now - Create order directly from product detail page
const buyNow = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      productId,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingWard,
      shippingNote,
      paymentMethod = 'cod',
      voucherIds
    } = req.body;

    // Validate required fields
    if (!productId || !quantity || !customerName || !customerEmail || !customerPhone || !shippingAddress || !shippingCity) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Validate quantity
    if (quantity <= 0 || !Number.isInteger(parseInt(quantity))) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không hợp lệ'
      });
    }

    // Get product
    const product = await productDao.findByIdWithImages(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Validate stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm chỉ còn ${product.stock} trong kho`
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không còn khả dụng'
      });
    }

    // Calculate subtotal
    const subtotal = parseFloat(product.price) * quantity;

    // Initialize pricing
    let shippingFee = 30000;
    if (subtotal > 500000) {
      shippingFee = 0;
    }

    let discount = 0;
    let discountVoucherId = null;
    let shippingVoucherId = null;

    // Apply voucher(s)
    if (voucherIds && Array.isArray(voucherIds) && voucherIds.length > 0) {
      for (const vId of voucherIds) {
        try {
          const voucher = await voucherDao.findById(vId, false);

          if (!voucher) continue;
          if (!voucher.isActive) continue;
          
          const now = new Date();
          if (now < voucher.startDate || now > voucher.endDate) continue;
          if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) continue;
          if (voucher.userId !== null && voucher.userId.toString() !== userId.toString()) continue;
          if (subtotal < parseFloat(voucher.minOrderAmount)) continue;

          // Check if user has already used this voucher
          const existingUsage = await orderDao.hasUserUsedVoucher(userId, voucher._id);

          if (existingUsage) {
            return res.status(400).json({
              success: false,
              message: `Bạn đã sử dụng voucher "${voucher.code}" rồi`
            });
          }

          // Apply
          if (voucher.type === 'DISCOUNT' && !discountVoucherId) {
            discountVoucherId = voucher._id;
            let d = (subtotal * voucher.discountPercent) / 100;
            if (voucher.maxDiscount) {
              d = Math.min(d, parseFloat(voucher.maxDiscount));
            }
            discount += d;
          } else if (voucher.type === 'FREE_SHIP' && !shippingVoucherId) {
            if (shippingFee > 0) {
              shippingVoucherId = voucher._id;
              shippingFee = 0;
            }
          }
        } catch (err) {
          console.log('Error applying voucher id:', vId, err.message);
        }
      }
    }

    const total = subtotal + shippingFee - discount;

    // Generate order number
    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existing = await orderDao.findByOrderNumber(orderNumber);
      if (!existing) isUnique = true;
    }

    // Create order
    const order = await orderDao.create({
      orderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingWard,
      shippingNote,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      voucherId: discountVoucherId || shippingVoucherId,
      items: [{
        productId: product._id,
        productName: product.name,
        productImage: product.images[0]?.imageUrl || null,
        price: product.price,
        quantity,
        subtotal: parseFloat(product.price) * quantity
      }]
    });

    // Update product stock
    await productDao.updateStock(product._id, -quantity);

    // Update voucher usage count
    if (discountVoucherId) {
      await voucherDao.incrementUsageCount(discountVoucherId);
    }
    if (shippingVoucherId) {
      await voucherDao.incrementUsageCount(shippingVoucherId);
    }

    // Populate order
    await order.populate([
      { path: 'items.productId' },
      { path: 'voucherId' }
    ]);

    // Notify admin
    try {
      await notifyAdmin(
        'ORDER_CREATED',
        'Đơn hàng mới',
        `Đơn hàng ${order.orderNumber} từ ${customerName} (${formatPrice(order.total)})`,
        order._id.toString()
      );
    } catch (notifyError) {
      console.error('Error notifying admin:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Mua hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Buy now error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi mua hàng',
      error: error.message
    });
  }
};

// @desc    Update order info (address, note, contact)
// @route   PUT /api/orders/:orderId/info
// @access  Private
const updateOrderInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      shippingAddress,
      shippingCity,
      shippingDistrict,
      shippingWard,
      shippingNote,
      customerName,
      customerPhone
    } = req.body;

    const order = await orderDao.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check ownership
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa đơn hàng này'
      });
    }

    // Check status
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể chỉnh sửa đơn hàng khi đang chờ xử lý'
      });
    }

    // Update fields if provided
    const updateData = {};
    if (shippingAddress) updateData.shippingAddress = shippingAddress;
    if (shippingCity) updateData.shippingCity = shippingCity;
    if (shippingDistrict) updateData.shippingDistrict = shippingDistrict;
    if (shippingWard) updateData.shippingWard = shippingWard;
    if (shippingNote !== undefined) updateData.shippingNote = shippingNote;
    if (customerName) updateData.customerName = customerName;
    if (customerPhone) updateData.customerPhone = customerPhone;

    const updatedOrder = await orderDao.updateById(orderId, updateData);

    res.json({
      success: true,
      message: 'Cập nhật thông tin đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order info error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin đơn hàng',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  buyNow,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics,
  updateOrderInfo
};
