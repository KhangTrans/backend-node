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
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // 2. Lấy danh sách đơn hàng
    console.log('\n📝 STEP 2: Lấy danh sách đơn hàng của user...');
    const ordersRes = await axios.get(`${API}/orders/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!ordersRes.data.success || ordersRes.data.data.length === 0) {
      console.log('❌ Không có đơn hàng nào');
      process.exit(1);
    }
    
    const orders = ordersRes.data.data;
    console.log(`✅ Lấy được ${orders.length} đơn hàng`);
    console.log(`   Đơn hàng đầu tiên:`);
    console.log(`   - ID: ${orders[0]._id}`);
    console.log(`   - Order Number: ${orders[0].orderNumber}`);
    console.log(`   - Total: ${orders[0].total.toLocaleString('vi-VN')} VND`);

    // 3. Xem chi tiết đơn hàng
    console.log('\n📝 STEP 3: Xem chi tiết đơn hàng...');
    const orderId = orders[0]._id;
    const detailRes = await axios.get(`${API}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!detailRes.data.success) {
      console.log('❌ Lấy chi tiết thất bại:', detailRes.data.message);
      process.exit(1);
    }
    
    const order = detailRes.data.data;
    console.log('✅ Lấy chi tiết đơn hàng thành công');
    console.log(`\n📦 CHI TIẾT ĐƠN HÀNG:`);
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Status: ${order.orderStatus}`);
    console.log(`   Payment Status: ${order.paymentStatus}`);
    console.log(`   Payment Method: ${order.paymentMethod}`);
    console.log(`   \n📍 Địa chỉ giao hàng:`);
    console.log(`   ${order.customerName}`);
    console.log(`   ${order.shippingAddress}`);
    console.log(`   ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingCity}`);
    console.log(`   ${order.customerPhone}`);
    console.log(`   \n📦 Sản phẩm (${order.items.length}):`);
    order.items.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.productName} x${item.quantity}`);
      console.log(`      Giá: ${item.price.toLocaleString('vi-VN')} VND`);
      console.log(`      Subtotal: ${item.subtotal.toLocaleString('vi-VN')} VND`);
    });
    console.log(`   \n💰 THANH TOÁN:`);
    console.log(`   Subtotal: ${order.subtotal.toLocaleString('vi-VN')} VND`);
    console.log(`   Shipping: ${order.shippingFee.toLocaleString('vi-VN')} VND`);
    console.log(`   Discount: ${order.discount.toLocaleString('vi-VN')} VND`);
    console.log(`   TOTAL: ${order.total.toLocaleString('vi-VN')} VND`);
    
    console.log('\n✅ ===== TEST THÀNH CÔNG =====\n');
    process.exit(0);

  } catch (error) {
    console.log('\n❌ ERROR:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

test();
