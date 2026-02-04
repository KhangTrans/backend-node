const chatService = require('../services/chat.service');

// @desc    Get conversation with another user
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await chatService.getConversation(req.user.id, userId, req.query);

    res.json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử tin nhắn',
      error: error.message,
    });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách hội thoại',
      error: error.message,
    });
  }
};

// @desc    Send message (HTTP endpoint, Socket.IO is preferred)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const newMessage = await chatService.sendMessage(req.user.id, receiverId, message);

    // Note: Real-time sending is handled by Socket.IO in config/socket.js
    // This endpoint is a fallback for non-socket clients

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Đã gửi tin nhắn',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    const status = (error.message === 'Thiếu thông tin người nhận hoặc nội dung tin nhắn' || error.message === 'Không tìm thấy người nhận') ? 400 : 500;
    
    res.status(status).json({
      success: false,
      message: error.message || 'Không thể gửi tin nhắn',
      error: error.message,
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:senderId
// @access  Private
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;

    await chatService.markMessagesAsRead(req.user.id, senderId);

    res.json({
      success: true,
      message: 'Đã đánh dấu tin nhắn đã đọc',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu tin nhắn đã đọc',
      error: error.message,
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await chatService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số tin nhắn chưa đọc',
      error: error.message,
    });
  }
};

// @desc    Get users for chat (admin gets all users, user gets only admins)
// @route   GET /api/messages/users
// @access  Private
exports.getChatUsers = async (req, res) => {
  try {
    const users = await chatService.getChatUsers(req.user.id, req.user.role);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching chat users:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách người dùng',
      error: error.message,
    });
  }
};
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy tin nhắn giữa 2 users
    const [messages, total] = await Promise.all([
      Message.find({
        $or: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      })
        .populate('sender', 'id username fullName role')
        .populate('receiver', 'id username fullName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({
        $or: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      }),
    ]);

    // Reverse để tin nhắn cũ nhất ở đầu
    messages.reverse();

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử tin nhắn',
      error: error.message,
    });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    // Lấy danh sách users đã chat với current user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user.id },
            { receiverId: req.user.id }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$senderId', req.user.id] },
              then: '$receiverId',
              else: '$senderId'
            }
          },
          lastMessageAt: { $max: '$createdAt' }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    // Lấy thông tin user và tin nhắn cuối cùng cho mỗi conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id).select('id username fullName role');

        const lastMessage = await Message.findOne({
          $or: [
            { senderId: req.user.id, receiverId: conv._id },
            { senderId: conv._id, receiverId: req.user.id },
          ],
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: conv._id,
          receiverId: req.user.id,
          isRead: false,
        });

        return {
          user,
          lastMessage,
          unreadCount,
          lastMessageAt: conv.lastMessageAt,
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách hội thoại',
      error: error.message,
    });
  }
};

// @desc    Send message (HTTP endpoint, Socket.IO is preferred)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người nhận hoặc nội dung tin nhắn',
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người nhận',
      });
    }

    const newMessage = await Message.create({
      senderId: req.user.id,
      receiverId: receiverId,
      message: message.trim(),
    });

    await newMessage.populate('sender', 'id username fullName role');
    await newMessage.populate('receiver', 'id username fullName role');

    // Note: Real-time sending is handled by Socket.IO in config/socket.js
    // This endpoint is a fallback for non-socket clients

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Đã gửi tin nhắn',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn',
      error: error.message,
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:senderId
// @access  Private
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;

    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tin nhắn đã đọc',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh dấu tin nhắn đã đọc',
      error: error.message,
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số tin nhắn chưa đọc',
      error: error.message,
    });
  }
};

// @desc    Get users for chat (admin gets all users, user gets only admins)
// @route   GET /api/messages/users
// @access  Private
exports.getChatUsers = async (req, res) => {
  try {
    let users;

    if (req.user.role === 'admin') {
      // Admin có thể chat với tất cả users
      users = await User.find({
        _id: { $ne: req.user.id },
        isActive: true,
      })
        .select('id username fullName role')
        .sort({ username: 1 });
    } else {
      // User chỉ chat với admin
      users = await User.find({
        role: 'admin',
        isActive: true,
      })
        .select('id username fullName role')
        .sort({ username: 1 });
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching chat users:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách người dùng',
      error: error.message,
    });
  }
};
