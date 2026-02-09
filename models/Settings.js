const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // === THÔNG TIN CỬA HÀNG ===
  store: {
    name: { type: String, default: 'My Store' },
    logo: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    description: { type: String, default: '' },
    socialLinks: {
      facebook: { type: String, default: '' },
      zalo: { type: String, default: '' },
      instagram: { type: String, default: '' }
    }
  },

  // === GIAO DIỆN ===
  appearance: {
    primaryColor: { type: String, default: '#1890ff' },
    banners: [{
      imageUrl: { type: String, required: true },
      publicId: { type: String },
      link: { type: String, default: '' },
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true }
    }],
    footerText: { type: String, default: '© 2026 My Store. All rights reserved.' }
  }

}, { timestamps: true });

// Đảm bảo chỉ có 1 document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
