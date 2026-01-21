const Notification = require('../models/Notification.model');

/**
 * Notification DAO - Data Access Object layer
 * Handles all database operations related to notifications
 */

// Find notifications by userId with pagination
const findByUserId = async (userId, filter = {}, options = {}) => {
  const {
    skip = 0,
    limit = 20,
    sort = { createdAt: -1 }
  } = options;

  const where = {
    userId,
    ...filter
  };

  return await Notification.find(where)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Count notifications by userId
const countByUserId = async (userId, filter = {}) => {
  return await Notification.countDocuments({
    userId,
    ...filter
  });
};

// Count unread notifications
const countUnread = async (userId) => {
  return await Notification.countDocuments({
    userId,
    isRead: false
  });
};

// Find notification by ID
const findById = async (notificationId) => {
  return await Notification.findById(notificationId);
};

// Create new notification
const create = async (notificationData) => {
  return await Notification.create(notificationData);
};

// Update notification by ID
const updateById = async (notificationId, updateData) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    updateData,
    { new: true }
  );
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};

// Mark all notifications as read for user
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    {
      userId,
      isRead: false
    },
    {
      isRead: true
    }
  );
};

// Delete notification by ID
const deleteById = async (notificationId) => {
  return await Notification.findByIdAndDelete(notificationId);
};

// Delete all read notifications for user
const deleteReadByUserId = async (userId) => {
  return await Notification.deleteMany({
    userId,
    isRead: true
  });
};

module.exports = {
  findByUserId,
  countByUserId,
  countUnread,
  findById,
  create,
  updateById,
  markAsRead,
  markAllAsRead,
  deleteById,
  deleteReadByUserId
};
