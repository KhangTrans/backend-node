const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatMessage = require('../models/ChatMessage.model');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const { v4: uuidv4 } = require('uuid');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for the chatbot
const getSystemPrompt = (storeInfo) => {
  return `Bạn là trợ lý AI chăm sóc khách hàng của cửa hàng "${storeInfo.name || 'Shop Online'}".

THÔNG TIN CỬA HÀNG:
- Tên: ${storeInfo.name || 'Shop Online'}
- Hotline: ${storeInfo.phone || '1900-xxxx'}
- Email: ${storeInfo.email || 'support@shop.com'}
- Địa chỉ: ${storeInfo.address || 'Việt Nam'}

CHÍNH SÁCH CỬA HÀNG:
1. Đổi trả: Trong vòng 7 ngày kể từ ngày nhận hàng, sản phẩm còn nguyên tem mác.
2. Vận chuyển: Miễn phí ship cho đơn hàng trên 500.000đ. Phí ship mặc định 30.000đ.
3. Thanh toán: Hỗ trợ COD, VNPay, ZaloPay.
4. Voucher: Mỗi khách hàng chỉ được sử dụng 1 voucher giảm giá + 1 voucher freeship cho mỗi đơn hàng.

QUY TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
- Nếu khách hỏi về đơn hàng cụ thể, yêu cầu họ cung cấp mã đơn hàng (ví dụ: ORD240116xxxx).
- Nếu khách hỏi về sản phẩm, hãy tư vấn dựa trên thông tin được cung cấp.
- Nếu không biết câu trả lời, hãy hướng dẫn khách liên hệ hotline.
- Trả lời ngắn gọn, súc tích, không quá 200 từ.
- Sử dụng emoji phù hợp để tạo cảm giác thân thiện.`;
};

// Store info (can be fetched from database or config)
const storeInfo = {
  name: process.env.STORE_NAME || 'Shop Online',
  phone: process.env.STORE_PHONE || '1900-xxxx',
  email: process.env.STORE_EMAIL || 'support@shop.com',
  address: process.env.STORE_ADDRESS || 'Việt Nam'
};

// Helper: Extract order number from message
const extractOrderNumber = (message) => {
  const regex = /ORD\d{8,}/i;
  const match = message.match(regex);
  return match ? match[0].toUpperCase() : null;
};

// Helper: Get order info for context
const getOrderContext = async (orderNumber, userId) => {
  try {
    const query = { orderNumber };
    if (userId) {
      query.userId = userId;
    }
    
    const order = await Order.findOne(query)
      .populate('items.productId', 'name')
      .select('orderNumber orderStatus paymentStatus paymentMethod total shippingAddress customerName createdAt');
    
    if (!order) return null;
    
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'processing': 'Đang xử lý',
      'shipping': 'Đang giao hàng',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    
    const paymentStatusMap = {
      'pending': 'Chưa thanh toán',
      'paid': 'Đã thanh toán',
      'failed': 'Thanh toán thất bại'
    };
    
    return {
      orderNumber: order.orderNumber,
      status: statusMap[order.orderStatus] || order.orderStatus,
      paymentStatus: paymentStatusMap[order.paymentStatus] || order.paymentStatus,
      total: order.total.toLocaleString('vi-VN') + 'đ',
      items: order.items.map(i => i.productName || i.productId?.name).join(', '),
      createdAt: new Date(order.createdAt).toLocaleDateString('vi-VN')
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

// Helper: Get product recommendations
const getProductRecommendations = async (keywords) => {
  try {
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } }
      ]
    })
    .select('name price stock')
    .limit(5);
    
    return products.map(p => ({
      name: p.name,
      price: p.price.toLocaleString('vi-VN') + 'đ',
      inStock: p.stock > 0
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Main chat function
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn'
      });
    }
    
    // Generate or use existing session ID
    const chatSessionId = sessionId || uuidv4();
    
    // Save user message
    await ChatMessage.create({
      sessionId: chatSessionId,
      userId,
      role: 'user',
      content: message
    });
    
    // Get chat history for context (last 10 messages)
    const history = await ChatMessage.find({ sessionId: chatSessionId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Build context
    let additionalContext = '';
    
    // Check if user is asking about an order
    const orderNumber = extractOrderNumber(message);
    if (orderNumber) {
      const orderInfo = await getOrderContext(orderNumber, userId);
      if (orderInfo) {
        additionalContext += `\n\nTHÔNG TIN ĐƠN HÀNG ${orderInfo.orderNumber}:
- Trạng thái: ${orderInfo.status}
- Thanh toán: ${orderInfo.paymentStatus}
- Tổng tiền: ${orderInfo.total}
- Sản phẩm: ${orderInfo.items}
- Ngày đặt: ${orderInfo.createdAt}`;
      } else {
        additionalContext += `\n\nKhông tìm thấy đơn hàng ${orderNumber} trong hệ thống.`;
      }
    }
    
    // Check if user might be looking for products
    const productKeywords = message.match(/(?:tìm|mua|xem|giá|sản phẩm|hàng)\s+(.+)/i);
    if (productKeywords && productKeywords[1]) {
      const products = await getProductRecommendations(productKeywords[1]);
      if (products.length > 0) {
        additionalContext += `\n\nSẢN PHẨM LIÊN QUAN:
${products.map((p, i) => `${i + 1}. ${p.name} - ${p.price} ${p.inStock ? '(Còn hàng)' : '(Hết hàng)'}`).join('\n')}`;
      }
    }
    
    // Build conversation history for Gemini
    let conversationHistory = history
      .reverse()
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
    
    // Ensure history starts with 'user' role (Gemini requirement)
    // Remove leading 'model' messages if any
    while (conversationHistory.length > 0 && conversationHistory[0].role === 'model') {
      conversationHistory.shift();
    }
    
    // Exclude the current message (last one) from history
    if (conversationHistory.length > 0) {
      conversationHistory = conversationHistory.slice(0, -1);
    }
    
    // Initialize Gemini model (without systemInstruction for gemini-pro compatibility)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest'
    });
    
    // Build full prompt with system context
    const systemPrompt = getSystemPrompt(storeInfo) + additionalContext;
    const fullMessage = `${systemPrompt}\n\nKhách hàng: ${message}`;
    
    // Start chat with history (only if valid)
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });
    
    // Send message and get response
    const result = await chat.sendMessage(fullMessage);
    const response = result.response;
    const aiMessage = response.text();
    
    // Save AI response
    await ChatMessage.create({
      sessionId: chatSessionId,
      userId,
      role: 'assistant',
      content: aiMessage
    });
    
    res.json({
      success: true,
      data: {
        sessionId: chatSessionId,
        message: aiMessage
      }
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Fallback response if AI fails
    const fallbackMessage = 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hotline để được hỗ trợ! 📞';
    
    res.status(500).json({
      success: false,
      message: fallbackMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id;
    
    if (!sessionId && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp sessionId hoặc đăng nhập'
      });
    }
    
    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (userId) query.userId = userId;
    
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(50)
      .select('role content createdAt');
    
    res.json({
      success: true,
      data: messages
    });
    
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử chat',
      error: error.message
    });
  }
};

// Clear chat history
const clearChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;
    
    if (!sessionId && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp sessionId hoặc đăng nhập'
      });
    }
    
    const query = {};
    if (sessionId) query.sessionId = sessionId;
    if (userId) query.userId = userId;
    
    await ChatMessage.deleteMany(query);
    
    res.json({
      success: true,
      message: 'Đã xóa lịch sử chat'
    });
    
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử chat',
      error: error.message
    });
  }
};

// Get suggested questions
const getSuggestedQuestions = async (req, res) => {
  try {
    const suggestions = [
      'Chính sách đổi trả như thế nào?',
      'Phí vận chuyển bao nhiêu?',
      'Tôi muốn tra cứu đơn hàng',
      'Các phương thức thanh toán?',
      'Làm sao để sử dụng voucher?',
      'Có chương trình khuyến mãi gì không?'
    ];
    
    res.json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy gợi ý',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  getSuggestedQuestions
};
