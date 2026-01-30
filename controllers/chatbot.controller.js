const { GoogleGenerativeAI } = require('@google/generative-ai');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Voucher = require('../models/Voucher.model');
const Category = require('../models/Category.model');
const { v4: uuidv4 } = require('uuid');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for the chatbot
const getSystemPrompt = (storeInfo, categories = [], vouchers = []) => {
  const categoryList = categories.length > 0 
    ? categories.map(c => `- ${c.name}`).join('\n')
    : '- (Không có dữ liệu)';

  const voucherList = vouchers.length > 0
    ? vouchers.map(v => 
        `- Mã: ${v.code} (${v.type === 'FREE_SHIP' ? 'Freeship' : `Giảm ${v.discountPercent}%`}) - Đơn tối thiểu: ${v.minOrderAmount.toLocaleString('vi-VN')}đ`
      ).join('\n')
    : '- Hiện không có mã giảm giá nào.';

  return `Bạn là trợ lý AI thông minh và thân thiện của cửa hàng "${storeInfo.name || 'Shop Online'}". Mục tiêu của bạn là tư vấn bán hàng, giải đáp thắc mắc và CHỐT ĐƠN.

=== THÔNG TIN CỬA HÀNG ===
- Tên: ${storeInfo.name}
- Hotline: ${storeInfo.phone}
- Email: ${storeInfo.email}
- Địa chỉ: ${storeInfo.address}

=== DANH MỤC SẢN PHẨM CHÍNH ===
${categoryList}

=== CHƯƠNG TRÌNH KHUYẾN MÃI ĐANG CÓ ===
${voucherList}

=== CHÍNH SÁCH ===
1. Đổi trả: 7 ngày đầu nếu lỗi nhà sản xuất (nguyên tem mác).
2. Vận chuyển: 
   - Freeship đơn > 500k. Phí ship cơ bản 30k.
   - Thời gian giao hàng: Nội thành (1-2 ngày), Ngoại thành & Tỉnh khác (3-5 ngày).
3. Thanh toán: COD, VNPay, ZaloPay.
4. Lưu ý Voucher: Mỗi đơn dùng tối đa 1 voucher giảm giá + 1 voucher freeship.

=== QUY TẮC ỨNG XỬ (BẮT BUỘC) ===
1. **Persona**: Bạn là người tư vấn có tâm, giọng điệu vui vẻ, hay dùng emoji (😊, 🎁, ✨, 🚀).
2. **Phạm vi**: 
   - CHỈ trả lời về sản phẩm, đơn hàng, chính sách shop.
   - NẾU khách hỏi ngoài lề (thời tiết, xổ số...): Từ chối khéo và lái về sản phẩm shop.
   - NẾU khách hỏi sản phẩm không có trong "KẾT QUẢ TÌM KIẾM" bên dưới: Trả lời thật thà là "Hiện shop chưa có mẫu này" nhưng hãy gợi ý sang các danh mục sản phẩm shop đang có.
3. **Up-sell / Cross-sell**: 
   - Nếu khách hỏi sản phẩm, hãy gợi ý thêm voucher nếu đơn hàng họ dự định mua đủ điều kiện.
   - Luôn khuyến khích khách vào trang chủ xem thêm nhiều mẫu.
4. **Định dạng**: Trả lời ngắn gọn (dưới 150 từ trừ khi cần liệt kê chi tiết), xuống dòng cho dễ đọc.

=== HƯỚNG DẪN XỬ LÝ ===
- Nếu khách chào: Chào lại nhiệt tình + giới thiệu ngắn gọn các chương trình khuyến mãi/sản phẩm hot.
- Nếu khách hỏi "Shop bán gì": Liệt kê các danh mục chính.
- Nếu khách hỏi giá: Báo giá chính xác từ dữ liệu, nhắc thêm là "Hàng đang sẵn kho" nếu stock > 0.
`;
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

// Helper: Get Global Context (Categories + Vouchers)
const getGlobalContext = async () => {
    try {
        const [categories, vouchers] = await Promise.all([
            Category.find({ isActive: true }).select('name').limit(10),
            Voucher.find({ 
                isActive: true, 
                endDate: { $gte: new Date() },
                startDate: { $lte: new Date() },
                usageLimit: { $gt: 0 } // Basic check, ideally compare with usedCount
            }).select('code type discountPercent minOrderAmount').limit(5)
        ]);
        return { categories, vouchers };
    } catch (error) {
        console.error('Context fetch error', error);
        return { categories: [], vouchers: [] };
    }
};

// Helper: Search products more broadly
const searchProducts = async (message) => {
  try {
    // 1. Clean the message
    let cleanMessage = message.replace(/[?!.,;:#@]/g, '').trim();
    
    // 2. Define Stop Words (Vietnamese)
    const stopWords = [
      'tôi', 'muốn', 'cần', 'tìm', 'mua', 'xem', 'lấy', 'đặt', 
      'shop', 'cửa', 'hàng', 'ad', 'admin', 'bạn', 'em', 'mình',
      'có', 'không', 'chưa', 'bán', 'còn', 'hết',
      'giá', 'bao', 'nhiêu', 'tiền', 'tầm', 'khoảng',
      'là', 'gì', 'cái', 'chiếc', 'bộ', 'con', 
      'ạ', 'ơi', 'nhé', 'nha', 'vâng', 'dạ', 'nhỉ', 'ha',
      'cho', 'hỏi', 'về', 'đi', 'đến', 'tại', 'ở', 'thì', 'mà', 'nào', 'đâu'
    ];
    
    // 3. Tokenize and Filter
    const tokens = cleanMessage.split(/\s+/);
    const validTokens = tokens.filter(token => !stopWords.includes(token.toLowerCase()));
    const keywords = validTokens.join(' ');

    if (!validTokens.length) return [];

    // 4. Perform Search
    // Strategy: Try exact phrase match first, if low results, try individual token match (OR)
    let searchCondition = [];
    
    // Exact phrase match (high priority)
    if (keywords.length >= 2) {
        searchCondition.push({ name: { $regex: keywords, $options: 'i' } });
    }

    // Individual significant words match (if we have multiple tokens)
    if (validTokens.length > 0) {
        // Filter out very short tokens to avoid noise like "1", "2" unless it's like "s23"
        const significantTokens = validTokens.filter(t => t.length > 2 || /^\d+$/.test(t));
        
        significantTokens.forEach(token => {
            searchCondition.push({ name: { $regex: token, $options: 'i' } });
            searchCondition.push({ description: { $regex: token, $options: 'i' } });
             // Also search category name if possible (assuming category is populated or we rely on product name)
             // We can search the 'category' field if it is a string ID? No usually it's ObjectId.
             // If we want to search category, we need to populate.
             // But let's stick to name/desc for now.
             searchCondition.push({ 'category.name': { $regex: token, $options: 'i' } });
        });
    }

    if (searchCondition.length === 0) return [];

    const products = await Product.find({
      isActive: true,
      $or: searchCondition
    })
    .select('name price stock description slug imageUrl') 
    .sort({ stock: -1 })
    .limit(8);
    
    return products.map(p => ({
      name: p.name,
      price: p.price.toLocaleString('vi-VN') + 'đ',
      inStock: p.stock > 0,
      slug: p.slug
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Main chat function
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, history: clientHistory } = req.body;
    const userId = req.user?.id || null;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tin nhắn' });
    }
    
    const chatSessionId = sessionId || uuidv4();
    let additionalContext = '';
    
    // 1. Fetch Global Context (Categories, Vouchers)
    const { categories, vouchers } = await getGlobalContext();

    // 2. Check for Order Context
    const orderNumber = extractOrderNumber(message);
    if (orderNumber) {
      const orderInfo = await getOrderContext(orderNumber, userId);
      if (orderInfo) {
        additionalContext += `\n\n=== 📦 THÔNG TIN ĐƠN HÀNG ${orderInfo.orderNumber} ===\n- Trạng thái: ${orderInfo.status}\n- Thanh toán: ${orderInfo.paymentStatus}\n- Tổng tiền: ${orderInfo.total}\n- Sản phẩm: ${orderInfo.items}\n- Ngày đặt: ${orderInfo.createdAt}`;
      } else {
        additionalContext += `\n\n=== 📦 TRA CỨU ĐƠN HÀNG ===\n⚠️ Không tìm thấy đơn hàng ${orderNumber} trong hệ thống.`;
      }
    }
    
    // 3. Product Search (RAG)
    if (!orderNumber) {
        const foundProducts = await searchProducts(message);
        
        additionalContext += `\n\n=== 🔍 KẾT QUẢ TÌM KIẾM SẢN PHẨM KHỚP YÊU CẦU ===\n`;
        if (foundProducts.length > 0) {
            additionalContext += foundProducts.map((p, i) => 
                `${i + 1}. ${p.name} - ${p.price} - ${p.inStock ? '🟢 Còn hàng' : '🔴 Hết hàng'}`
            ).join('\n');
            additionalContext += `\n(Hãy dựa vào danh sách này để tư vấn. Nếu khách hỏi sản phẩm khác, hãy gợi ý xem danh mục sản phẩm).`;
        } else {
            additionalContext += `(Không tìm thấy sản phẩm nào khớp với từ khóa "${message}". Hãy gợi ý khách xem các danh mục sản phẩm đang có).`;
        }
    }
    
    // 4. Build Conversation History
    let conversationHistory = [];
    if (clientHistory && Array.isArray(clientHistory)) {
        conversationHistory = clientHistory.map(msg => ({
            role: (msg.role === 'user') ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
    }
    while (conversationHistory.length > 0 && conversationHistory[0].role === 'model') {
      conversationHistory.shift();
    }
    
    // 5. Initialize & Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    const systemPrompt = getSystemPrompt(storeInfo, categories, vouchers);
    const contextPrompt = additionalContext ? `\n\n=== 📝 DỮ LIỆU CONTEXT HIỆN TẠI ===:${additionalContext}` : '';
    const finalPrompt = `${systemPrompt}${contextPrompt}\n\n👤 Khách hàng: ${message}`;
    
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 800, // Increased for better explanations
        temperature: 0.4, // Balanced creativity and factuality
      }
    });
    
    const result = await chat.sendMessage(finalPrompt);
    const aiMessage = result.response.text();
    
    res.json({
      success: true,
      data: {
        sessionId: chatSessionId,
        message: aiMessage
      }
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau! 📞',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getSuggestedQuestions = async (req, res) => {
  try {
    const suggestions = [
      'Shop đang có khuyến mãi gì?',
      'Chính sách đổi trả thế nào?',
      'Tra cứu đơn hàng của tôi',
      'Gợi ý sản phẩm bán chạy',
      'Phí ship tính như thế nào?'
    ];
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getSuggestedQuestions
};
