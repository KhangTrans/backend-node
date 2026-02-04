/**
 * Chatbot Service
 * Handles AI interactions and context gathering
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');

const productDao = require('../dao/product.dao');
const orderDao = require('../dao/order.dao');
const categoryDao = require('../dao/category.dao');
const voucherDao = require('../dao/voucher.dao');
// We might need Models directly for specific queries if DAOs don't cover them
// But let's try to use DAOs where possible or extend them.
const Order = require('../models/Order.model'); 
const Voucher = require('../models/Voucher.model');
const Category = require('../models/Category.model');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store info
const storeInfo = {
  name: process.env.STORE_NAME || 'Shop Online',
  phone: process.env.STORE_PHONE || '1900-xxxx',
  email: process.env.STORE_EMAIL || 'support@shop.com',
  address: process.env.STORE_ADDRESS || 'Việt Nam'
};

// ... internal helper functions (System prompt, etc) ...

// System prompt generator
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

// Extract order number
const extractOrderNumber = (message) => {
  const regex = /ORD\d{8,}/i;
  const match = message.match(regex);
  return match ? match[0].toUpperCase() : null;
};

// Search products (RAG)
const searchProducts = async (message) => {
  try {
    let cleanMessage = message.replace(/[?!.,;:#@]/g, '').trim();
    
    const stopWords = [
      'tôi', 'muốn', 'cần', 'tìm', 'mua', 'xem', 'lấy', 'đặt', 
      'shop', 'cửa', 'hàng', 'ad', 'admin', 'bạn', 'em', 'mình',
      'có', 'không', 'chưa', 'bán', 'còn', 'hết',
      'giá', 'bao', 'nhiêu', 'tiền', 'tầm', 'khoảng',
      'là', 'gì', 'cái', 'chiếc', 'bộ', 'con', 
      'ạ', 'ơi', 'nhé', 'nha', 'vâng', 'dạ', 'nhỉ', 'ha',
      'cho', 'hỏi', 'về', 'đi', 'đến', 'tại', 'ở', 'thì', 'mà', 'nào', 'đâu'
    ];
    
    const tokens = cleanMessage.split(/\s+/);
    const validTokens = tokens.filter(token => !stopWords.includes(token.toLowerCase()));
    const keywords = validTokens.join(' ');

    if (!validTokens.length) return [];

    let searchCondition = [];
    
    if (keywords.length >= 2) {
        searchCondition.push({ name: { $regex: keywords, $options: 'i' } });
    }

    if (validTokens.length > 0) {
        const significantTokens = validTokens.filter(t => t.length > 2 || /^\d+$/.test(t));
        
        significantTokens.forEach(token => {
            searchCondition.push({ name: { $regex: token, $options: 'i' } });
            searchCondition.push({ description: { $regex: token, $options: 'i' } });
             // Mongoose query on nested path works if schema structure allows, 
             // but 'category' is Ref. So we can't regex match on populated field easily in simple find.
             // We'll skip category.name regex here unless we use aggregate.
        });
    }

    if (searchCondition.length === 0) return [];

    // Use DAO with filter
    const products = await productDao.findAll(
      { 
        isActive: true, 
        $or: searchCondition 
      },
      {
        limit: 8,
        sort: { stock: -1 },
        populateCategory: false, // Optimization
        populateCreatedBy: false
      }
    );
    
    return products.map(p => ({
      name: p.name,
      price: p.price.toLocaleString('vi-VN') + 'đ',
      inStock: p.stock > 0,
      slug: p.slug
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Get Global Context
const getGlobalContext = async () => {
    try {
        const [categories, vouchers] = await Promise.all([
            // Use DAO or Model. CategoryDao is simple.
            Category.find({ isActive: true }).select('name').limit(10),
            Voucher.find({ 
                isActive: true, 
                endDate: { $gte: new Date() },
                startDate: { $lte: new Date() },
                usageLimit: { $gt: 0 } 
            }).select('code type discountPercent minOrderAmount').limit(5)
        ]);
        return { categories, vouchers };
    } catch (error) {
        console.error('Context fetch error', error);
        return { categories: [], vouchers: [] };
    }
};

// getOrderContext
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

/**
 * Process chat message
 * @param {string} message
 * @param {string} sessionId
 * @param {Array} history
 * @param {string} userId
 * @returns {Object} { sessionId, message }
 */
const processMessage = async (message, sessionId, history, userId) => {
    if (!message || message.trim().length === 0) {
      throw new Error('Vui lòng nhập tin nhắn');
    }
    
    const chatSessionId = sessionId || uuidv4();
    let additionalContext = '';
    
    // 1. Fetch Global Context
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
    if (history && Array.isArray(history)) {
        conversationHistory = history.map(msg => ({
            role: (msg.role === 'user') ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
    }
    // Gemini optimization: Model response shouldn't be first if user is strictly first.
    // The previous implementation shifted history until it found user or clear.
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
        maxOutputTokens: 800,
        temperature: 0.4,
      }
    });
    
    const result = await chat.sendMessage(finalPrompt);
    const aiMessage = result.response.text();
    
    return {
        sessionId: chatSessionId,
        message: aiMessage
    };
};

const getSuggestedQuestions = () => {
    return [
      'Shop đang có khuyến mãi gì?',
      'Chính sách đổi trả thế nào?',
      'Tra cứu đơn hàng của tôi',
      'Gợi ý sản phẩm bán chạy',
      'Phí ship tính như thế nào?'
    ];
};

module.exports = {
  processMessage,
  getSuggestedQuestions
};
