/**
 * Message DAO - Data Access Object layer
 * Handles all database operations related to messages
 */
const Message = require('../models/Message.model');

// Find messages between two users with pagination
const findConversation = async (userId1, userId2, skip, limit) => {
  return await Message.find({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  })
    .populate('sender', 'id username fullName role')
    .populate('receiver', 'id username fullName role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Count messages between two users
const countConversation = async (userId1, userId2) => {
  return await Message.countDocuments({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  });
};

// Find latest message for conversation
const findLastMessage = async (userId1, userId2) => {
  return await Message.findOne({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  }).sort({ createdAt: -1 });
};

// Count unread messages
const countUnread = async (senderId, receiverId) => {
  const query = {
    receiverId: receiverId,
    isRead: false
  };
  
  if (senderId) {
    query.senderId = senderId;
  }
  
  return await Message.countDocuments(query);
};

// Create new message
const create = async (messageData) => {
  const message = await Message.create(messageData);
  await message.populate('sender', 'id username fullName role');
  await message.populate('receiver', 'id username fullName role');
  return message;
};

// Mark messages as read
const markAsRead = async (senderId, receiverId) => {
  return await Message.updateMany(
    {
      senderId: senderId,
      receiverId: receiverId,
      isRead: false,
    },
    {
      isRead: true,
    }
  );
};

// Aggregate conversations (complex query)
const aggregateConversations = async (userId) => {
  return await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$senderId', userId] },
            then: '$receiverId',
            else: '$senderId'
          }
        },
        lastMessageAt: { $max: '$createdAt' }
      }
    },
    { $sort: { lastMessageAt: -1 } }
  ]);
};

module.exports = {
  findConversation,
  countConversation,
  findLastMessage,
  countUnread,
  create,
  markAsRead,
  aggregateConversations
};
