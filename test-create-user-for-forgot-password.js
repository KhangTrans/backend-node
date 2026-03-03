const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User.model');

const testUser = {
  username: 'testforgot',
  email: 'khangtdce181439@fpt.edu.vn', // Your real email to receive OTP
  password: 'oldpassword123',
  fullName: 'Test Forgot Password User',
  isActive: true,
  isEmailVerified: true, // Skip email verification for testing
  authProvider: 'local'
};

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    
    if (existingUser) {
      console.log('⚠️  User already exists:', existingUser.email);
      console.log('User ID:', existingUser._id);
      console.log('Username:', existingUser.username);
      console.log('\nYou can now test forgot password with this email:', testUser.email);
    } else {
      // Create new user
      const user = await User.create(testUser);
      console.log('✓ Test user created successfully!');
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('Password:', testUser.password);
      console.log('\nYou can now test forgot password with this email:', testUser.email);
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
