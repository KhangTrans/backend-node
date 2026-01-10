const axios = require('axios');

const API = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('🔐 Đăng nhập...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('Response:', JSON.stringify(loginRes.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.data || error.message);
  }
  process.exit(0);
}

test();
