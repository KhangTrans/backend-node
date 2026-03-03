const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Test data - Use real email from database
const testEmail = 'khangtdce181439@fpt.edu.vn';
let receivedOTP = ''; // Will be manually entered after checking email

async function testForgotPassword() {
  console.log('=== Testing Forgot Password Feature ===\n');
  
  try {
    // Step 1: Request OTP
    console.log('Step 1: Requesting OTP for email:', testEmail);
    const forgotResponse = await axios.post(`${BASE_URL}/forgot-password`, {
      email: testEmail
    });
    
    console.log('✓ Success:', forgotResponse.data.message);
    console.log('Response:', JSON.stringify(forgotResponse.data, null, 2));
    console.log('\n⚠️  Please check your email for the OTP code.');
    console.log('Then run: node test-reset-password.js <email> <otp> <newPassword>');
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

async function testResetPassword(email, otp, newPassword) {
  console.log('\n=== Testing Reset Password ===\n');
  
  try {
    console.log('Step 2: Resetting password with OTP');
    console.log('Email:', email);
    console.log('OTP:', otp);
    
    const resetResponse = await axios.post(`${BASE_URL}/reset-password`, {
      email: email,
      otp: otp,
      newPassword: newPassword
    });
    
    console.log('✓ Success:', resetResponse.data.message);
    console.log('Response:', JSON.stringify(resetResponse.data, null, 2));
    
    // Step 3: Try to login with new password
    console.log('\nStep 3: Testing login with new password...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: email,
      password: newPassword
    });
    
    console.log('✓ Login successful with new password!');
    console.log('User:', loginResponse.data.data.user.email);
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Just test forgot password
  testForgotPassword();
} else if (args.length === 3) {
  // Test reset password with provided OTP
  const [email, otp, newPassword] = args;
  testResetPassword(email, otp, newPassword);
} else {
  console.log('Usage:');
  console.log('  Request OTP: node test-forgot-password.js');
  console.log('  Reset Password: node test-forgot-password.js <email> <otp> <newPassword>');
}
