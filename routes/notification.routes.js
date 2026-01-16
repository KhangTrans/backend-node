const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
} = require('../controllers/notification.controller');

// Public route - Get unread count (returns 0 if not logged in)
router.get('/unread-count', optionalProtect, getUnreadCount);

// All routes below require authentication
router.use(protect);

// Get all notifications for current user
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Clear all read notifications
router.delete('/clear-read', clearReadNotifications);

module.exports = router;
