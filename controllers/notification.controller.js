const notificationService = require('../services/notification.service');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getNotifications(req.user.id, req.query);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách thông báo',
      error: error.message,
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Public (returns 0 if not logged in)
exports.getUnreadCount = async (req, res) => {
  try {
    // If user is not logged in, return 0
    if (!req.user) {
      return res.json({
        success: true,
        data: { count: 0 },
      });
    }

    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số lượng thông báo chưa đọc',
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedNotification = await notificationService.markAsRead(req.user.id, id);

    res.json({
      success: true,
      data: updatedNotification,
      message: 'Đã đánh dấu thông báo đã đọc',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    let status = 500;
    if (error.message === 'Không tìm thấy thông báo') status = 404;
    if (error.message === 'Bạn không có quyền truy cập thông báo này') status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Không thể đánh dấu thông báo đã đọc',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu tất cả thông báo đã đọc',
      error: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await notificationService.deleteNotification(req.user.id, id);

    res.json({
      success: true,
      message: 'Đã xóa thông báo',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    let status = 500;
    if (error.message === 'Không tìm thấy thông báo') status = 404;
    if (error.message === 'Bạn không có quyền xóa thông báo này') status = 403;

    res.status(status).json({
      success: false,
      message: error.message || 'Không thể xóa thông báo',
      error: error.message,
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
exports.clearReadNotifications = async (req, res) => {
  try {
    await notificationService.clearReadNotifications(req.user.id);

    res.json({
      success: true,
      message: 'Đã xóa tất cả thông báo đã đọc',
    });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo đã đọc',
      error: error.message,
    });
  }
};
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    // Filter by read status if provided
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      notificationDao.findByUserId(req.user.id, filter, {
        skip,
        limit: parseInt(limit)
      }),
      notificationDao.countByUserId(req.user.id, filter)
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách thông báo',
      error: error.message,
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Public (returns 0 if not logged in)
exports.getUnreadCount = async (req, res) => {
  try {
    // If user is not logged in, return 0
    if (!req.user) {
      return res.json({
        success: true,
        data: { count: 0 },
      });
    }

    const count = await notificationDao.countUnread(req.user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số lượng thông báo chưa đọc',
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationDao.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập thông báo này',
      });
    }

    const updatedNotification = await notificationDao.markAsRead(id);

    res.json({
      success: true,
      data: updatedNotification,
      message: 'Đã đánh dấu thông báo đã đọc',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu thông báo đã đọc',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await notificationDao.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu tất cả thông báo đã đọc',
      error: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notificationDao.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa thông báo này',
      });
    }

    await notificationDao.deleteById(id);

    res.json({
      success: true,
      message: 'Đã xóa thông báo',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo',
      error: error.message,
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
exports.clearReadNotifications = async (req, res) => {
  try {
    await notificationDao.deleteReadByUserId(req.user.id);

    res.json({
      success: true,
      message: 'Đã xóa tất cả thông báo đã đọc',
    });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa thông báo đã đọc',
      error: error.message,
    });
  }
};
