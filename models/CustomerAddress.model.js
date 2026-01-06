const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    required: true,
    maxlength: 20
  },
  address: {
    type: String,
    required: true,
    maxlength: 500
  },
  city: {
    type: String,
    required: true,
    maxlength: 100
  },
  district: {
    type: String,
    maxlength: 100
  },
  ward: {
    type: String,
    maxlength: 100
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    maxlength: 50
  }
}, {
  timestamps: true
});

// Index
addressSchema.index({ userId: 1 });
addressSchema.index({ isDefault: 1 });

const CustomerAddress = mongoose.model('CustomerAddress', addressSchema);

module.exports = CustomerAddress;
