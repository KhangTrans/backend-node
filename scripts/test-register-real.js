require('dotenv').config();
const mongoose = require('mongoose');
const authService = require('../services/auth.service');
const User = require('../models/User.model');

const TEST_EMAIL = 'trank7822@gmail.com';
const TEST_USERNAME = 'trank7822_test';
const TEST_PASSWORD = 'password123';

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB.');

    // 1. Cleanup old user
    console.log(`Cleaning up old user ${TEST_EMAIL}...`);
    await User.deleteMany({ email: TEST_EMAIL });
    await User.deleteMany({ username: TEST_USERNAME });

    // 2. Register
    console.log('\n--- TEST: Registering new user ---');
    console.log(`Attempting to register with email: ${TEST_EMAIL}`);
    console.log('Sending verification email...');
    
    // Auth service will call email service internally
    const registerResult = await authService.register({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      fullName: 'Test User'
    });
    
    console.log('\n✅ Register Function Completed.');
    console.log('Server Response Message:', registerResult.message);
    
    const user = await User.findOne({ email: TEST_EMAIL });
    if (user) {
        console.log('\nUser created in DB:');
        console.log(`- ID: ${user._id}`);
        console.log(`- Is Verified: ${user.isEmailVerified}`);
        console.log(`- Token exists: ${!!user.emailVerificationToken}`);
        
        if(user.emailVerificationToken) {
            console.log('✅ Token generated successfully.');
        } else {
             console.error('❌ Error: No token generated.');
        }
    }

    console.log('\n👉 Vui lòng kiểm tra hộp thư (cả mục Spam) để xem email xác thực đã đến chưa.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Test finished.');
  }
};

runTest();
