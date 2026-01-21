const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    // Password is optional for OAuth users
    required: function() {
      return !this.googleId;
    }
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  avatar: {
    type: String,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while still maintaining uniqueness
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  savedVouchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  }]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Index cho performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hash password trước khi save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method để compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual populate (nếu cần)
userSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'createdBy'
});

const User = mongoose.model('User', userSchema);

module.exports = User;

