const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let userToken = '';
let adminToken = '';

// Helper function
const log = (title, data) => {
  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${title}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
};

const logError = (title, error) => {
  console.log('\n' + '='.repeat(60));
  console.log(`❌ ${title}`);
  console.log('='.repeat(60));
  console.log(error.response?.data || error.message || error);
  console.log('Full error:', error);
};

// Main test function
async function testCartAndOrders() {
  try {
    console.log('🚀 BẮT ĐẦU TEST API GIỎ HÀNG & ĐƠN HÀNG\n');

    // 1. Login User
    console.log('📝 Step 1: Login User...');
    try {
      const loginRes = await axios.post(`${BASE_URL}/api/auth/register`, {
        username: 'testuser' + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: '123456',
        fullName: 'Test User'
      });
      userToken = loginRes.data.token;
      log('Đăng ký User thành công', { token: userToken.substring(0, 20) + '...' });
    } catch (err) {
      // Try login if user exists
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: '123456'
      });
      userToken = loginRes.data.token;
      log('Login User thành công', { token: userToken.substring(0, 20) + '...' });
    }

    // 2. Add products to cart
    console.log('\n📝 Step 2: Thêm sản phẩm vào giỏ...');
    const addCart1 = await axios.post(
      `${BASE_URL}/api/cart`,
      { productId: 1, quantity: 2 },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    log('Thêm sản phẩm 1 vào giỏ', addCart1.data);

    const addCart2 = await axios.post(
      `${BASE_URL}/api/cart`,
      { productId: 2, quantity: 1 },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    log('Thêm sản phẩm 2 vào giỏ', addCart2.data);

    // 3. Get cart
    console.log('\n📝 Step 3: Xem giỏ hàng...');
    const cartRes = await axios.get(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log('Giỏ hàng hiện tại', {
      itemCount: cartRes.data.data.summary.itemCount,
      totalQuantity: cartRes.data.data.summary.totalQuantity,
      subtotal: cartRes.data.data.summary.subtotal,
      items: cartRes.data.data.cart.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price
      }))
    });

    // 4. Update cart item
    console.log('\n📝 Step 4: Cập nhật số lượng sản phẩm...');
    const updateRes = await axios.put(
      `${BASE_URL}/api/cart/${cartRes.data.data.cart.items[0].id}`,
      { quantity: 3 },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    log('Cập nhật số lượng', { newQuantity: updateRes.data.data.quantity });

    // 5. Create order
    console.log('\n📝 Step 5: Tạo đơn hàng...');
    const orderRes = await axios.post(
      `${BASE_URL}/api/orders`,
      {
        customerName: 'Nguyễn Văn A',
        customerEmail: 'nguyenvana@example.com',
        customerPhone: '0901234567',
        shippingAddress: '123 Đường Lê Lợi',
        shippingCity: 'TP. Hồ Chí Minh',
        shippingDistrict: 'Quận 1',
        shippingWard: 'Phường Bến Nghé',
        shippingNote: 'Gọi trước 15 phút',
        paymentMethod: 'cod'
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    log('Đơn hàng đã tạo', {
      orderNumber: orderRes.data.data.orderNumber,
      orderStatus: orderRes.data.data.orderStatus,
      paymentMethod: orderRes.data.data.paymentMethod,
      total: orderRes.data.data.total,
      itemCount: orderRes.data.data.items.length
    });

    const orderId = orderRes.data.data.id;

    // 6. Get order history
    console.log('\n📝 Step 6: Xem lịch sử đơn hàng...');
    const historyRes = await axios.get(`${BASE_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log('Lịch sử đơn hàng', {
      total: historyRes.data.data.length,
      orders: historyRes.data.data.map(order => ({
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        total: order.total,
        createdAt: order.createdAt
      }))
    });

    // 7. Get order detail
    console.log('\n📝 Step 7: Xem chi tiết đơn hàng...');
    const detailRes = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log('Chi tiết đơn hàng', {
      orderNumber: detailRes.data.data.orderNumber,
      customerName: detailRes.data.data.customerName,
      customerPhone: detailRes.data.data.customerPhone,
      shippingAddress: detailRes.data.data.shippingAddress,
      orderStatus: detailRes.data.data.orderStatus,
      paymentMethod: detailRes.data.data.paymentMethod,
      paymentStatus: detailRes.data.data.paymentStatus,
      subtotal: detailRes.data.data.subtotal,
      shippingFee: detailRes.data.data.shippingFee,
      total: detailRes.data.data.total,
      items: detailRes.data.data.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))
    });

    // 8. Login Admin
    console.log('\n📝 Step 8: Login Admin...');
    const adminLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@backend.com',
      password: 'Admin@123456'
    });
    adminToken = adminLoginRes.data.token;
    log('Login Admin thành công', { role: adminLoginRes.data.user.role });

    // 9. Admin get all orders
    console.log('\n📝 Step 9: Admin xem tất cả đơn hàng...');
    const allOrdersRes = await axios.get(`${BASE_URL}/api/orders/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log('Tất cả đơn hàng (Admin)', {
      total: allOrdersRes.data.data.length,
      orders: allOrdersRes.data.data.slice(0, 3).map(order => ({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        orderStatus: order.orderStatus,
        total: order.total
      }))
    });

    // 10. Admin update order status
    console.log('\n📝 Step 10: Admin cập nhật trạng thái đơn hàng...');
    const updateStatusRes = await axios.put(
      `${BASE_URL}/api/orders/admin/${orderId}/status`,
      { orderStatus: 'confirmed', paymentStatus: 'paid' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    log('Cập nhật trạng thái đơn hàng', {
      orderNumber: updateStatusRes.data.data.orderNumber,
      orderStatus: updateStatusRes.data.data.orderStatus,
      paymentStatus: updateStatusRes.data.data.paymentStatus
    });

    // 11. Admin get statistics
    console.log('\n📝 Step 11: Admin xem thống kê...');
    const statsRes = await axios.get(`${BASE_URL}/api/orders/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log('Thống kê đơn hàng', statsRes.data.data);

    // 12. Test cancel order (should fail - order is confirmed)
    console.log('\n📝 Step 12: Test hủy đơn (should fail - đơn đã xác nhận)...');
    try {
      await axios.put(
        `${BASE_URL}/api/orders/${orderId}/cancel`,
        { reason: 'Test hủy' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (err) {
      logError('Hủy đơn thất bại (Expected)', err);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST HOÀN THÀNH THÀNH CÔNG!');
    console.log('='.repeat(60));

  } catch (error) {
    logError('LỖI TRONG QUÁ TRÌNH TEST', error);
    process.exit(1);
  }
}

// Run tests
testCartAndOrders();
