const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { optionalProtect } = require('../middleware/auth.middleware');

// All routes use optional authentication (works for both logged-in and guest users)
router.post('/message', optionalProtect, chatbotController.sendMessage);
router.get('/history', optionalProtect, chatbotController.getChatHistory);
router.delete('/history', optionalProtect, chatbotController.clearChatHistory);
router.get('/suggestions', chatbotController.getSuggestedQuestions);

module.exports = router;
