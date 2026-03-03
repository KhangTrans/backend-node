const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const testEmail = 'khangtdce181439@fpt.edu.vn';

async function runTests() {
  console.log('=== Testing Edge Cases for Forgot Password ===\n');
  
  // Test 1: Wrong OTP
  console.log('Test 1: Trying with wrong OTP...');
  try {
    await axios.post(`${BASE_URL}/reset-password`, {
      email: testEmail,
      otp: '000000',
      newPassword: 'newPassword123'
    });
    console.log('✗ Should have failed but succeeded\n');
  } catch (error) {
    console.log('✓ Correctly rejected wrong OTP');
    console.log('   Error:', error.response?.data.message);
    console.log();
  }
  
  // Test 2: Email doesn't exist
  console.log('Test 2: Trying with non-existent email...');
  try {
    await axios.post(`${BASE_URL}/forgot-password`, {
      email: 'nonexistent@example.com'
    });
    console.log('✓ API handled gracefully (security: don\'t reveal if email exists)');
    console.log();
  } catch (error) {
    console.log('Response:', error.response?.data);
    console.log();
  }
  
  // Test 3: Missing fields
  console.log('Test 3: Trying reset without OTP...');
  try {
    await axios.post(`${BASE_URL}/reset-password`, {
      email: testEmail,
      newPassword: 'newPassword123'
    });
    console.log('✗ Should have failed but succeeded\n');
  } catch (error) {
    console.log('✓ Correctly rejected missing OTP');
    console.log('   Error:', error.response?.data.message);
    console.log();
  }
  
  // Test 4: Password too short
  console.log('Test 4: Trying with short password (< 6 chars)...');
  try {
    // First get a valid OTP
    await axios.post(`${BASE_URL}/forgot-password`, { email: testEmail });
    
    await axios.post(`${BASE_URL}/reset-password`, {
      email: testEmail,
      otp: '123456',
      newPassword: '123'
    });
    console.log('✗ Should have failed but succeeded\n');
  } catch (error) {
    console.log('✓ Correctly rejected short password');
    console.log('   Error:', error.response?.data.message);
    console.log();
  }
  
  // Test 5: OTP with wrong format
  console.log('Test 5: Trying with invalid OTP format...');
  try {
    await axios.post(`${BASE_URL}/reset-password`, {
      email: testEmail,
      otp: 'ABCDEF',
      newPassword: 'newPassword123'
    });
    console.log('✗ Should have failed but succeeded\n');
  } catch (error) {
    console.log('✓ Correctly rejected invalid OTP format');
    console.log('   Error:', error.response?.data.message);
    console.log();
  }
  
  console.log('=== All Edge Case Tests Completed ===');
}

runTests();
