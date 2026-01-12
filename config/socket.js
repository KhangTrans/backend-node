const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

let io;

// Lưu mapping userId -> socketId
const userSockets = new Map();

// Lưu danh sách admin sockets
const adminSockets = new Set();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware xác thực
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Lấy thông tin user từ database
      const user = await User.findById(decoded.id).select('_id username email role isActive');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.username = user.username;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.username} (ID: ${socket.userId}, Role: ${socket.userRole})`);

    // Lưu socket của user
    userSockets.set(socket.userId, socket.id);

    // Join user vào room riêng của họ
    socket.join(`user:${socket.userId}`);

    // Nếu là admin, join vào admin room
    if (socket.userRole === 'admin') {
      socket.join('admin');
      adminSockets.add(socket.id);
      console.log(`👑 Admin joined admin room`);
    }

    // Event: User gửi tin nhắn
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;

        // Validate
        if (!receiverId || !message) {
          return socket.emit('error', { message: 'Receiver ID and message are required' });
        }

        // TODO: Migrating from Prisma to Mongoose. Verify Message model exists.
        // const newMessage = await prisma.message.create({...});
        
        // TEMPORARY: Mock message object to keep socket working without DB crash
        const newMessage = {
            id: Date.now(),
            senderId: socket.userId,
            receiverId: parseInt(receiverId),
            message: message.trim(),
            sender: { username: socket.username },
            receiver: { id: receiverId }
        };

        // Gửi tin nhắn cho người nhận (nếu đang online)
        const receiverSocketId = userSockets.get(parseInt(receiverId));
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', newMessage);
        }

        // Gửi lại cho người gửi để confirm
        socket.emit('message_sent', newMessage);

        // Tạo notification cho người nhận
        await createNotification(
          parseInt(receiverId),
          'NEW_MESSAGE',
          'Tin nhắn mới',
          `${newMessage.sender.username} đã gửi tin nhắn cho bạn`,
          null
        );

        console.log(`📩 Message sent from ${socket.username} to user ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // Event: Đánh dấu tin nhắn đã đọc
    socket.on('mark_messages_read', async (data) => {
      try {
        const { senderId } = data;



        socket.emit('messages_marked_read', { senderId });
        console.log(`✓ User ${socket.userId} marked messages from ${senderId} as read`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Event: Đánh dấu notification đã đọc
    socket.on('mark_notification_read', async (data) => {
      try {
        const { notificationId } = data;

        await prisma.notification.update({
          where: {
            id: parseInt(notificationId),
            userId: socket.userId,
          },
          data: {
            isRead: true,
          },
        });

        socket.emit('notification_marked_read', { notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    // Event: Typing indicator (optional)
    socket.on('typing', (data) => {
      const { receiverId } = data;
      const receiverSocketId = userSockets.get(parseInt(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      const receiverSocketId = userSockets.get(parseInt(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing', {
          userId: socket.userId,
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.username} (ID: ${socket.userId})`);
      userSockets.delete(socket.userId);
      if (socket.userRole === 'admin') {
        adminSockets.delete(socket.id);
      }
    });
  });

  console.log('🔌 Socket.IO initialized successfully');
  return io;
};

// Helper function query admin
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

// ... (existing code for initializeSocket)

// Helper function để tạo notification
const createNotification = async (userId, type, title, message, orderId = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      orderId
    });

    // Gửi real-time notification cho user
    const socketId = userSockets.get(userId);
    if (socketId && io) {
      io.to(socketId).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to prevent crashing main flow
    return null; 
  }
};

// Helper function để gửi notification cho admin
const notifyAdmin = async (type, title, message, orderId = null) => {
  try {
    // Lấy tất cả admin users
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');

    if (!admins.length) return [];

    // Tạo notifications cho tất cả admin
    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification(admin._id.toString(), type, title, message, orderId)
      )
    );

    // Gửi real-time notification cho admin room
    // Note: createNotification already sends individual socket events
    // But we also broadcast to 'admin' room if needed
    if (io && notifications.length > 0 && notifications[0]) {
      io.to('admin').emit('new_notification', notifications[0]);
    }

    return notifications;
  } catch (error) {
    console.error('Error notifying admin:', error);
     // Don't throw error to prevent crashing main flow
    return [];
  }
};

// Hàm để gửi notification cho user cụ thể (được gọi từ controllers)
const notifyUser = (userId, type, title, message, orderId = null) => {
  return createNotification(userId, type, title, message, orderId);
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
  notifyAdmin,
  notifyUser,
};
