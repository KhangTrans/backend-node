/**
 * Notification Service
 * Business logic for user notifications
 */

const notificationDao = require('../dao/notification.dao');

/**
 * Get notifications for user with pagination
 * @param {string} userId
 * @param {Object} query - page, limit, isRead
 * @returns {Object} { notifications, total, pagination }
 */
const getNotifications = async (userId, { page = 1, limit = 20, isRead }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};

  // Filter by read status if provided
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  const [notifications, total] = await Promise.all([
    notificationDao.findByUserId(userId, filter, {
      skip,
      limit: parseInt(limit)
    }),
    notificationDao.countByUserId(userId, filter)
  ]);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    }
  };
};

/**
 * Get unread notification count
 * @param {string} userId
 * @returns {number} count
 */
const getUnreadCount = async (userId) => {
  return await notificationDao.countUnread(userId);
};

/**
 * Mark notification as read
 * @param {string} userId
 * @param {string} notificationId
 * @returns {Object} updatedNotification
 */
const markAsRead = async (userId, notificationId) => {
  const notification = await notificationDao.findById(notificationId);

  if (!notification) {
    throw new Error('Không tìm thấy thông báo');
  }

  // Check if notification belongs to user
  if (notification.userId.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền truy cập thông báo này');
  }

  return await notificationDao.markAsRead(notificationId);
};

/**
 * Mark all notifications as read
 * @param {string} userId
 * @returns {boolean} success
 */
const markAllAsRead = async (userId) => {
  await notificationDao.markAllAsRead(userId);
  return true;
};

/**
 * Delete notification
 * @param {string} userId
 * @param {string} notificationId
 * @returns {boolean} success
 */
const deleteNotification = async (userId, notificationId) => {
  const notification = await notificationDao.findById(notificationId);

  if (!notification) {
    throw new Error('Không tìm thấy thông báo');
  }

  // Check if notification belongs to user
  if (notification.userId.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền xóa thông báo này');
  }

  await notificationDao.deleteById(notificationId);
  return true;
};

/**
 * Delete all read notifications
 * @param {string} userId
 * @returns {boolean} success
 */
const clearReadNotifications = async (userId) => {
  await notificationDao.deleteReadByUserId(userId);
  return true;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
};
