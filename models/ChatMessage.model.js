const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    // Optional: Store additional context like order lookup results
    orderLookup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    productRecommendations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  }
}, {
  timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, createdAt: -1 });

// Auto-delete old messages after 30 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
