const prisma = require('../lib/prisma');

// @desc    Get conversation with another user
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const otherUserId = parseInt(userId);

    // Lấy tin nhắn giữa 2 users
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: req.user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: req.user.id },
          ],
        },
        include: {
          sender: {
            select: { id: true, username: true, fullName: true, role: true },
          },
          receiver: {
            select: { id: true, username: true, fullName: true, role: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: req.user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: req.user.id },
          ],
        },
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
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT
        CASE 
          WHEN senderId = ${req.user.id} THEN receiverId
          ELSE senderId
        END as userId,
        MAX(createdAt) as lastMessageAt
      FROM messages
      WHERE senderId = ${req.user.id} OR receiverId = ${req.user.id}
      GROUP BY userId
      ORDER BY lastMessageAt DESC
    `;

    // Lấy thông tin user và tin nhắn cuối cùng cho mỗi conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const user = await prisma.user.findUnique({
          where: { id: conv.userId },
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
          },
        });

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: req.user.id, receiverId: conv.userId },
              { senderId: conv.userId, receiverId: req.user.id },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: conv.userId,
            receiverId: req.user.id,
            isRead: false,
          },
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
    const receiver = await prisma.user.findUnique({
      where: { id: parseInt(receiverId) },
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người nhận',
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: parseInt(receiverId),
        message: message.trim(),
      },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, role: true },
        },
        receiver: {
          select: { id: true, username: true, fullName: true, role: true },
        },
      },
    });

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

    await prisma.message.updateMany({
      where: {
        senderId: parseInt(senderId),
        receiverId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

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
    const count = await prisma.message.count({
      where: {
        receiverId: req.user.id,
        isRead: false,
      },
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
      users = await prisma.user.findMany({
        where: {
          id: { not: req.user.id },
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
        },
        orderBy: {
          username: 'asc',
        },
      });
    } else {
      // User chỉ chat với admin
      users = await prisma.user.findMany({
        where: {
          role: 'admin',
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
        },
        orderBy: {
          username: 'asc',
        },
      });
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
