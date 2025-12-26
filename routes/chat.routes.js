const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getConversation,
  getConversations,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  getChatUsers
} = require('../controllers/chat.controller');

// All routes require authentication
router.use(protect);

// Get all conversations
router.get('/conversations', getConversations);

// Get conversation with specific user
router.get('/conversation/:userId', getConversation);

// Send message (HTTP fallback, prefer Socket.IO)
router.post('/', sendMessage);

// Mark messages as read
router.put('/read/:senderId', markMessagesAsRead);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get users available for chat
router.get('/users', getChatUsers);

module.exports = router;
