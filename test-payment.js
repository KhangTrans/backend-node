const axios = require('axios');

const API_URL = 'https://backend-node-5re9.onrender.com/api';

let token = '';
let userId = '';
let orderId = '';

// Step 1: Login
async function login() {
  try {
    console.log('\n📝 Step 1: Login test...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'user@example.com',
      password: '123456'
    });

    if (response.data.success) {
      token = response.data.data.token;
      userId = response.data.data.user._id;
      console.log('✅ Login thành công');
      console.log(`   Token: ${token.substring(0, 30)}...`);
      console.log(`   User ID: ${userId}`);
      return true;
    } else {
      console.log('❌ Login thất bại:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Lỗi login:', error.response?.data?.message || error.message);
    return false;
  }
}

// Step 2: Create Order
async function createOrder() {
  try {
    console.log('\n📝 Step 2: Tạo đơn hàng test...');
    const response = await axios.post(
      `${API_URL}/order`,
      {
        items: [
          {
            productId: '6733bb4dd8f8c82a33b32e47', // Sample product ID
            quantity: 1,
            price: 100000
          }
        ],
        shippingAddress: {
          fullName: 'Test User',
          phoneNumber: '0123456789',
          address: '123 Test Street',
          city: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ward 1'
        },
        shippingMethod: 'standard',
        total: 100000
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      orderId = response.data.data._id;
      console.log('✅ Tạo đơn hàng thành công');
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Order Number: ${response.data.data.orderNumber}`);
      console.log(`   Total: ${response.data.data.total}`);
      return true;
    } else {
      console.log('❌ Tạo đơn hàng thất bại:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Lỗi tạo đơn hàng:', error.response?.data?.message || error.message);
    return false;
  }
}

// Step 3: Test VNPay
async function testVNPay() {
  try {
    console.log('\n🎯 Step 3: Test VNPay payment...');
    const response = await axios.post(
      `${API_URL}/payment/vnpay/create`,
      {
        orderId: orderId,
        amount: 100000,
        orderInfo: 'Test VNPay Payment',
        locale: 'vn'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ VNPay payment URL created successfully');
      console.log(`   Payment URL: ${response.data.data.paymentUrl.substring(0, 80)}...`);
      console.log(`   Full URL: ${response.data.data.paymentUrl}`);
      return true;
    } else {
      console.log('❌ VNPay payment failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ VNPay error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Step 4: Test ZaloPay
async function testZaloPay() {
  try {
    console.log('\n🎯 Step 4: Test ZaloPay payment...');
    const response = await axios.post(
      `${API_URL}/payment/zalopay/create`,
      {
        orderId: orderId,
        amount: 100000,
        orderInfo: 'Test ZaloPay Payment'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ ZaloPay payment created successfully');
      console.log(`   Order URL: ${response.data.data.order_url}`);
      console.log(`   App Trans ID: ${response.data.data.app_trans_id}`);
      return true;
    } else {
      console.log('❌ ZaloPay payment failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ ZaloPay error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Step 5: Check payment status
async function checkPaymentStatus() {
  try {
    console.log('\n📊 Step 5: Check payment status...');
    const response = await axios.get(
      `${API_URL}/payment/status/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Payment status retrieved:');
      console.log(`   Payment Status: ${response.data.data.paymentStatus}`);
      console.log(`   Payment Method: ${response.data.data.paymentMethod}`);
      console.log(`   Total Amount: ${response.data.data.totalAmount}`);
      return true;
    } else {
      console.log('❌ Failed to get payment status:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking payment status:', error.response?.data?.message || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 ===== PAYMENT TEST SUITE =====');
  console.log('   Testing VNPay and ZaloPay payment flows');
  
  if (!(await login())) {
    console.log('\n❌ Cannot proceed without login');
    process.exit(1);
  }

  if (!(await createOrder())) {
    console.log('\n❌ Cannot proceed without order');
    process.exit(1);
  }

  await testVNPay();
  await testZaloPay();
  await checkPaymentStatus();

  console.log('\n✅ ===== TEST COMPLETED =====\n');
  process.exit(0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
