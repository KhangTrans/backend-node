/**
 * Chat Service
 * Business logic for messaging and conversations
 */

const messageDao = require('../dao/message.dao');
const userDao = require('../dao/user.dao');

/**
 * Get conversation with another user
 * @param {string} currentUserId
 * @param {string} otherUserId
 * @param {Object} pagination - page, limit
 * @returns {Object} { messages, total, pagination }
 */
const getConversation = async (currentUserId, otherUserId, { page = 1, limit = 50 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [messages, total] = await Promise.all([
    messageDao.findConversation(currentUserId, otherUserId, skip, parseInt(limit)),
    messageDao.countConversation(currentUserId, otherUserId)
  ]);

  // Reverse to show oldest first (or adjust frontend expectation)
  // Controller reversed it, so we reverse it here too.
  messages.reverse();

  return {
    messages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    }
  };
};

/**
 * Get all conversations for current user
 * @param {string} currentUserId
 * @returns {Array} conversationsWithDetails
 */
const getConversations = async (currentUserId) => {
  // Aggregate conversations
  const conversations = await messageDao.aggregateConversations(currentUserId);

  // Enrich with details
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId = conv._id; // The other user ID
      
      const user = await userDao.findById(otherUserId, 'id username fullName role');

      const lastMessage = await messageDao.findLastMessage(currentUserId, otherUserId);

      const unreadCount = await messageDao.countUnread(otherUserId, currentUserId); // Sender Is Other, Receiver Is Me

      return {
        user,
        lastMessage,
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
      };
    })
  );

  return conversationsWithDetails;
};

/**
 * Send message
 * @param {string} senderId
 * @param {string} receiverId
 * @param {string} messageContent
 * @returns {Object} newMessage
 */
const sendMessage = async (senderId, receiverId, messageContent) => {
  if (!receiverId || !messageContent) {
    throw new Error('Thiếu thông tin người nhận hoặc nội dung tin nhắn');
  }

  // Check if receiver exists
  const receiver = await userDao.findById(receiverId);
  if (!receiver) {
    throw new Error('Không tìm thấy người nhận');
  }

  const newMessage = await messageDao.create({
    senderId,
    receiverId,
    message: messageContent.trim(),
  });

  return newMessage;
};

/**
 * Mark messages as read
 * @param {string} currentUserId (Receiver)
 * @param {string} senderId
 * @returns {boolean} success
 */
const markMessagesAsRead = async (currentUserId, senderId) => {
  await messageDao.markAsRead(senderId, currentUserId);
  return true;
};

/**
 * Get unread message count
 * @param {string} currentUserId
 * @returns {number} count
 */
const getUnreadCount = async (currentUserId) => {
  return await messageDao.countUnread(null, currentUserId);
};

/**
 * Get users for chat
 * @param {string} currentUserId
 * @param {string} currentUserRole
 * @returns {Array} users
 */
const getChatUsers = async (currentUserId, currentUserRole) => {
  let query = {
    _id: { $ne: currentUserId },
    isActive: true
  };

  if (currentUserRole !== 'admin') {
    // User can only chat with admin
    query.role = 'admin';
  }

  return await userDao.find(query, 'id username fullName role', { username: 1 });
};

module.exports = {
  getConversation,
  getConversations,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  getChatUsers
};
