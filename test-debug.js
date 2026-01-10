const axios = require('axios');

const API = 'http://localhost:5000/api';
let token = '';

async function test() {
  try {
    // 1. Login
    console.log('\n📝 STEP 1: Đăng nhập...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    
    if (!loginRes.data.success) {
      console.log('❌ Login thất bại:', loginRes.data.message);
      process.exit(1);
    }
    
    token = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    console.log('✅ Đăng nhập thành công');
    console.log(`   User ID: ${userId}`);

    // 2. Lấy danh sách đơn hàng
    console.log('\n📝 STEP 2: Lấy danh sách đơn hàng...');
    const ordersRes = await axios.get(`${API}/orders/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!ordersRes.data.success || ordersRes.data.data.length === 0) {
      console.log('❌ Không có đơn hàng');
      process.exit(1);
    }
    
    const order = ordersRes.data.data[0];
    console.log('✅ Lấy được đơn hàng');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Order.userId: ${order.userId}`);

    // 3. Xem chi tiết - dùng axios với detailed error
    console.log('\n📝 STEP 3: Xem chi tiết đơn hàng...');
    try {
      const detailRes = await axios.get(`${API}/orders/${order._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (detailRes.data.success) {
        console.log('✅ Xem chi tiết thành công!');
        console.log(`   Order: ${detailRes.data.data.orderNumber}`);
        console.log(`   Total: ${detailRes.data.data.total}`);
        console.log(`   Items: ${detailRes.data.data.items.length}`);
      }
    } catch (axiosErr) {
      console.log('❌ Lỗi:', axiosErr.response?.status, axiosErr.response?.data?.message);
      console.log('Full error:', axiosErr.response?.data);
    }
    
    process.exit(0);

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    process.exit(1);
  }
}

test();
