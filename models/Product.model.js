const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    maxlength: 500
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const productVariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    maxlength: 50
  },
  price: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  color: {
    type: String,
    maxlength: 50
  },
  size: {
    type: String,
    maxlength: 50
  },
  material: {
    type: String,
    maxlength: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true, timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  canonicalUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [productImageSchema],
  variants: [productVariantSchema]
}, {
  timestamps: true
});

// Indexes

productSchema.index({ categoryId: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
