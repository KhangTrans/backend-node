const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    maxlength: 200
  },
  productImage: {
    type: String,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  items: [orderItemSchema],
  
  // Customer Info
  customerName: {
    type: String,
    required: true,
    maxlength: 100
  },
  customerEmail: {
    type: String,
    required: true,
    maxlength: 100
  },
  customerPhone: {
    type: String,
    required: true,
    maxlength: 20
  },
  
  // Shipping Info
  shippingAddress: {
    type: String,
    required: true,
    maxlength: 500
  },
  shippingCity: {
    type: String,
    required: true,
    maxlength: 100
  },
  shippingDistrict: {
    type: String,
    maxlength: 100
  },
  shippingWard: {
    type: String,
    maxlength: 100
  },
  shippingNote: String,
  
  // Payment & Status
  paymentMethod: {
    type: String,
    enum: ['cod', 'bank_transfer', 'momo', 'vnpay', 'credit_card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tracking
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ voucherId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
