const prisma = require('../lib/prisma');

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
      voucherCode
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !shippingCity) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin giao hàng'
      });
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống'
      });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product.name}" chỉ còn ${item.product.stock} trong kho`
        });
      }
      if (!item.product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product.name}" không còn khả dụng`
        });
      }
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Initialize pricing
    let shippingFee = 30000; // Default shipping fee (30,000 VND)
    let discount = 0;
    let voucherId = null;

    // Apply voucher if provided
    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode.toUpperCase() }
      });

      if (!voucher) {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher không tồn tại'
        });
      }

      // Validate voucher
      if (!voucher.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Voucher không còn hiệu lực'
        });
      }

      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Voucher đã hết hạn hoặc chưa đến thời gian sử dụng'
        });
      }

      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Voucher đã hết lượt sử dụng'
        });
      }

      if (voucher.userId !== null && voucher.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Voucher này không dành cho bạn'
        });
      }

      if (subtotal < parseFloat(voucher.minOrderAmount)) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng voucher này`
        });
      }

      // Apply voucher discount
      voucherId = voucher.id;
      
      if (voucher.type === 'DISCOUNT') {
        discount = (subtotal * voucher.discountPercent) / 100;
        if (voucher.maxDiscount) {
          discount = Math.min(discount, parseFloat(voucher.maxDiscount));
        }
      } else if (voucher.type === 'FREE_SHIP') {
        shippingFee = 0;
      }
    }

    const total = subtotal + shippingFee - discount;

    // Generate order number
    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existing = await prisma.order.findUnique({
        where: { orderNumber }
      });
      if (!existing) isUnique = true;
    }

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
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
          voucherId,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              productName: item.product.name,
              productImage: item.product.images[0]?.imageUrl || null,
              price: item.price,
              quantity: item.quantity,
              subtotal: parseFloat(item.price) * item.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          voucher: true
        }
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Update voucher usage count
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: {
            usedCount: {
              increment: 1
            }
          }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

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

    const where = { userId };
    if (status) {
      where.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          voucher: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
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

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true
          }
        },
        voucher: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check permission (user can only view their own orders, admin can view all)
    if (order.userId !== userId && req.user.role !== 'admin') {
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

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check permission
    if (order.userId !== userId) {
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
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const cancelled = await tx.order.update({
        where: { id: parseInt(orderId) },
        data: {
          orderStatus: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Khách hàng hủy đơn'
        },
        include: {
          items: true
        }
      });

      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      return cancelled;
    });

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng',
      data: updatedOrder
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
    const { status, page = 1, limit = 20, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.orderStatus = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          voucher: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
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

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const updateData = {};
    
    if (orderStatus) {
      updateData.orderStatus = orderStatus;
      
      // Update tracking timestamps
      if (orderStatus === 'shipping' && !order.shippedAt) {
        updateData.shippedAt = new Date();
      } else if (orderStatus === 'delivered' && !order.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !order.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updateData,
      include: {
        items: true
      }
    });

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
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'pending' } }),
      prisma.order.count({ where: { orderStatus: 'processing' } }),
      prisma.order.count({ where: { orderStatus: 'shipping' } }),
      prisma.order.count({ where: { orderStatus: 'delivered' } }),
      prisma.order.count({ where: { orderStatus: 'cancelled' } }),
      prisma.order.aggregate({
        where: { orderStatus: { not: 'cancelled' } },
        _sum: { total: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipping: shippingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        totalRevenue: totalRevenue._sum.total || 0
      }
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics
};
