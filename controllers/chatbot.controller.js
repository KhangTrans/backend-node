const chatbotService = require('../services/chatbot.service');

// Main chat function
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, history } = req.body;
    const userId = req.user?.id || null;
    
    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tin nhắn' });
    }

    const result = await chatbotService.processMessage(message, sessionId, history, userId);
    
    res.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        message: result.message
      }
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau! 📞',
      error: error.message // Always return error for debugging
    });
  }
};

const getSuggestedQuestions = async (req, res) => {
  try {
    const suggestions = chatbotService.getSuggestedQuestions();
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getSuggestedQuestions
};
