/**
 * Order Service - Business Logic Layer
 * Handles complex order management business logic
 */

const orderDao = require('../dao/order.dao');
const cartDao = require('../dao/cart.dao');
const productDao = require('../dao/product.dao');
const voucherDao = require('../dao/voucher.dao');
const { notifyAdmin, notifyUser } = require('../config/socket');

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${random}`;
};

/**
 * Format price
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

/**
 * Calculate shipping fee
 */
const calculateShippingFee = (subtotal) => {
  return subtotal >= 500000 ? 0 : 30000;
};

/**
 * Apply vouchers
 */
const applyVouchers = async (voucherIds, userId, subtotal) => {
  let discount = 0;
  let shippingFee = calculateShippingFee(subtotal);
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
        if (voucher.userId && voucher.userId.toString() !== userId.toString()) continue;
        if (subtotal < parseFloat(voucher.minOrderAmount)) continue;

        // Check already used
        const existingUsage = await orderDao.hasUserUsedVoucher(userId, voucher._id);
        if (existingUsage) {
            throw new Error(`Bạn đã sử dụng voucher "${voucher.code}" rồi`);
        }

        // Apply
        if (voucher.type === 'DISCOUNT' && !discountVoucherId) {
          discountVoucherId = voucher._id;
          let d = (subtotal * voucher.discountPercent) / 100;
          if (voucher.maxDiscount) d = Math.min(d, parseFloat(voucher.maxDiscount));
          discount += d;
        } else if (voucher.type === 'FREE_SHIP' && !shippingVoucherId) {
          if (shippingFee > 0) {
              shippingVoucherId = voucher._id;
              shippingFee = 0;
          }
        }
      } catch (err) {
        if (err.message.includes('đã sử dụng')) throw err;
        console.log('Error applying voucher:', vId, err.message);
      }
    }
  }
  return { discount, shippingFee, discountVoucherId, shippingVoucherId };
};

/**
 * Create order from cart
 */
const createOrder = async (userId, orderData) => {
  const {
      customerName, customerEmail, customerPhone,
      shippingAddress, shippingCity, shippingDistrict, shippingWard, shippingNote,
      paymentMethod = 'cod', voucherIds
  } = orderData;

  // Validation
  if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !shippingCity) {
    throw new Error('Vui lòng điền đầy đủ thông tin giao hàng');
  }

  // Get cart
  const cart = await cartDao.findByUserIdWithProducts(userId);
  if (!cart || cart.items.length === 0) {
    throw new Error('Giỏ hàng trống');
  }

  // Validate items and stock
  for (const item of cart.items) {
    if (item.productId.stock < item.quantity) {
      throw new Error(`Sản phẩm "${item.productId.name}" chỉ còn ${item.productId.stock} trong kho`);
    }
    if (!item.productId.isActive) {
      throw new Error(`Sản phẩm "${item.productId.name}" không còn khả dụng`);
    }
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // Apply vouchers
  const { discount, shippingFee, discountVoucherId, shippingVoucherId } = await applyVouchers(voucherIds, userId, subtotal);

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
    orderNumber, userId,
    customerName, customerEmail, customerPhone,
    shippingAddress, shippingCity, shippingDistrict, shippingWard, shippingNote,
    paymentMethod, subtotal, shippingFee, discount, total,
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

  // Update stock
  for (const item of cart.items) {
    await productDao.updateStock(item.productId._id, -item.quantity);
  }

  // Update vouchers
  if (discountVoucherId) await voucherDao.incrementUsageCount(discountVoucherId);
  if (shippingVoucherId) await voucherDao.incrementUsageCount(shippingVoucherId);

  // Clear cart if COD
  if (paymentMethod === 'cod') {
    await cartDao.clearItems(userId);
  }

  // Populate & Notify
  await order.populate([{ path: 'items.productId' }, { path: 'voucherId' }]);
  await notifyAdmin('ORDER_CREATED', 'Đơn hàng mới', `Đơn hàng ${order.orderNumber} từ ${customerName} (${formatPrice(order.total)})`, order._id.toString());

  return order;
};

/**
 * Buy Now (Direct order)
 */
const buyNow = async (userId, orderData) => {
    const {
        productId, quantity,
        customerName, customerEmail, customerPhone,
        shippingAddress, shippingCity, shippingDistrict, shippingWard, shippingNote,
        paymentMethod = 'cod', voucherIds
    } = orderData;

    if (!productId || !quantity || !customerName || !customerEmail || !customerPhone || !shippingAddress || !shippingCity) {
        throw new Error('Vui lòng điền đầy đủ thông tin');
    }

    if (quantity <= 0) throw new Error('Số lượng không hợp lệ');

    const product = await productDao.findByIdWithImages(productId);
    if (!product) throw new Error('Sản phẩm không tồn tại');
    if (product.stock < quantity) throw new Error(`Sản phẩm chỉ còn ${product.stock} trong kho`);
    if (!product.isActive) throw new Error('Sản phẩm không còn khả dụng');

    const subtotal = parseFloat(product.price) * quantity;
    const { discount, shippingFee, discountVoucherId, shippingVoucherId } = await applyVouchers(voucherIds, userId, subtotal);
    const total = subtotal + shippingFee - discount;

    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
        orderNumber = generateOrderNumber();
        const existing = await orderDao.findByOrderNumber(orderNumber);
        if (!existing) isUnique = true;
    }

    const order = await orderDao.create({
        orderNumber, userId,
        customerName, customerEmail, customerPhone,
        shippingAddress, shippingCity, shippingDistrict, shippingWard, shippingNote,
        paymentMethod, subtotal, shippingFee, discount, total,
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

    await productDao.updateStock(product._id, -quantity);
    if (discountVoucherId) await voucherDao.incrementUsageCount(discountVoucherId);
    if (shippingVoucherId) await voucherDao.incrementUsageCount(shippingVoucherId);

    await order.populate([{ path: 'items.productId' }, { path: 'voucherId' }]);
    await notifyAdmin('ORDER_CREATED', 'Đơn hàng mới', `Đơn hàng ${order.orderNumber} từ ${customerName} (${formatPrice(order.total)})`, order._id.toString());

    return order;
};

/**
 * Update order info (address, etc before processing)
 */
const updateOrderInfo = async (orderId, userId, userRole, updateData) => {
    const order = await orderDao.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.userId.toString() !== userId.toString() && userRole !== 'admin') {
        throw new Error('Bạn không có quyền chỉnh sửa đơn hàng này');
    }

    if (order.orderStatus !== 'pending') {
        throw new Error('Chỉ có thể chỉnh sửa đơn hàng khi đang chờ xử lý');
    }

    const allowedFields = ['shippingAddress', 'shippingCity', 'shippingDistrict', 'shippingWard', 'shippingNote', 'customerName', 'customerPhone'];
    const dataToUpdate = {};
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
            dataToUpdate[key] = updateData[key];
        }
    });

    return await orderDao.updateById(orderId, dataToUpdate);
};

/**
 * Get User Orders
 */
const getMyOrders = async (userId, query) => {
    const { status, page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (status) filter.orderStatus = status;

    const [orders, total] = await Promise.all([
        orderDao.findByUserId(userId, filter, { skip, limit: parseInt(limit) }),
        orderDao.countByUserId(userId, filter)
    ]);

    return {
        orders,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    };
};

/**
 * Get Order By ID
 */
const getOrderById = async (orderId, userId, userRole) => {
    const order = await orderDao.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.userId.toString() !== userId.toString() && userRole !== 'admin') {
        throw new Error('Không có quyền truy cập đơn hàng này');
    }
    return order;
};

/**
 * Cancel Order
 */
const cancelOrder = async (orderId, userId, reason) => {
    const order = await orderDao.findByIdWithProducts(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    if (order.userId.toString() !== userId.toString()) throw new Error('Không có quyền hủy đơn hàng này');

    if (['shipping', 'delivered', 'cancelled'].includes(order.orderStatus)) {
        throw new Error('Không thể hủy đơn hàng ở trạng thái này');
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Khách hàng hủy đơn';
    await orderDao.save(order);

    for (const item of order.items) {
        await productDao.updateStock(item.productId, item.quantity);
    }
    return order;
};

/**
 * Admin: Get All Orders
 */
const getAllOrders = async (query) => {
    const { status, page = 1, limit = 20, search, paymentMethod } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    
    if (status) filter.orderStatus = status;
    if (paymentMethod) {
        const methods = Array.isArray(paymentMethod) ? paymentMethod : paymentMethod.split(',').map(m => m.trim());
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
        orderDao.findAll(filter, { skip, limit: parseInt(limit) }),
        orderDao.count(filter)
    ]);

    return {
        orders,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    };
};

/**
 * Admin: Update Status
 */
const updateOrderStatus = async (orderId, { orderStatus, paymentStatus }) => {
    const order = await orderDao.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (orderStatus) {
        if (orderStatus === 'shipping' && !order.shippedAt) order.shippedAt = new Date();
        else if (orderStatus === 'delivered' && !order.deliveredAt) order.deliveredAt = new Date();
        order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
        if (paymentStatus === 'paid' && !order.paidAt) order.paidAt = new Date();
        order.paymentStatus = paymentStatus;
    }

    await orderDao.save(order);
    const updatedOrder = await orderDao.findByIdWithUser(orderId);

    // Notifications
    let notificationTitle = 'Cập nhật đơn hàng';
    let notificationMessage = '';
    let notificationType = 'SYSTEM';

    if (orderStatus) {
        switch (orderStatus) {
            case 'confirmed':
                notificationTitle = 'Đơn hàng đã xác nhận';
                notificationMessage = `Đơn hàng ${order.orderNumber} đã được xác nhận và đang được xử lý`;
                notificationType = 'ORDER_CONFIRMED';
                break;
            case 'processing':
                notificationTitle = 'Đơn hàng đang xử lý';
                notificationMessage = `Đơn hàng ${order.orderNumber} đang được chuẩn bị`;
                break;
            case 'shipping':
                notificationTitle = 'Đơn hàng đang giao';
                notificationMessage = `Đơn hàng ${order.orderNumber} đang trên đường giao đến bạn`;
                notificationType = 'ORDER_SHIPPING';
                break;
            case 'delivered':
                notificationTitle = 'Đơn hàng đã giao';
                notificationMessage = `Đơn hàng ${order.orderNumber} đã được giao thành công`;
                notificationType = 'ORDER_DELIVERED';
                break;
            case 'cancelled':
                notificationTitle = 'Đơn hàng đã hủy';
                notificationMessage = `Đơn hàng ${order.orderNumber} đã bị hủy`;
                notificationType = 'ORDER_CANCELLED';
                break;
        }
    }

    if (paymentStatus === 'paid') {
        notificationTitle = 'Thanh toán thành công';
        notificationMessage = `Thanh toán cho đơn hàng ${order.orderNumber} đã được xác nhận`;
        notificationType = 'PAYMENT_CONFIRMED';
    }

    if (notificationMessage) {
        await notifyUser(
            updatedOrder.userId,
            notificationType,
            notificationTitle,
            notificationMessage,
            updatedOrder._id.toString()
        );
    }

    return updatedOrder;
};

/**
 * Get Stats
 */
const getOrderStatistics = async () => {
    return await orderDao.getStatistics();
};

module.exports = {
    createOrder,
    buyNow,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateOrderInfo,
    getAllOrders,
    updateOrderStatus,
    getOrderStatistics
};
