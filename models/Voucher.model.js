const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['DISCOUNT', 'FREE_SHIP'],
    required: true
  },
  description: String,
  
  // Discount settings
  discountPercent: {
    type: Number,
    min: 0,
    max: 100
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  
  // Usage limits
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimit: Number,
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // User restriction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Time validity
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes

voucherSchema.index({ type: 1 });
voucherSchema.index({ userId: 1 });
voucherSchema.index({ isActive: 1 });

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
