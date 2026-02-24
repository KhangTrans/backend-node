const mongoose = require('mongoose');

const productBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề banner là bắt buộc'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  imageUrl: {
    type: String,
    required: [true, 'URL hình ảnh là bắt buộc']
  },
  publicId: {
    type: String,
    default: ''
  },
  discountPercent: {
    type: Number,
    required: [true, 'Phần trăm giảm giá là bắt buộc'],
    min: [1, 'Giảm giá phải từ 1%'],
    max: [100, 'Giảm giá không vượt quá 100%']
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc']
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
productBannerSchema.index({ isActive: 1 });
productBannerSchema.index({ startDate: 1, endDate: 1 });
productBannerSchema.index({ order: 1 });

// Virtual: check if banner is currently running
productBannerSchema.virtual('isRunning').get(function() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Ensure virtuals are included in JSON output
productBannerSchema.set('toJSON', { virtuals: true });
productBannerSchema.set('toObject', { virtuals: true });

const ProductBanner = mongoose.model('ProductBanner', productBannerSchema);

module.exports = ProductBanner;
