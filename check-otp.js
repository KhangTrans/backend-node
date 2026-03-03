const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User.model');

async function checkOTP() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find user with email
    const email = 'khangtdce181439@fpt.edu.vn';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('✗ User not found');
      await mongoose.connection.close();
      return;
    }

    console.log('=== User Information ===');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    
    if (user.resetPasswordOTP) {
      console.log('\n=== OTP INFORMATION ===');
      console.log('🔑 OTP:', user.resetPasswordOTP);
      console.log('⏰ Expires at:', new Date(user.resetPasswordOTPExpires).toLocaleString());
      
      const now = Date.now();
      const expiresIn = Math.round((user.resetPasswordOTPExpires - now) / 1000);
      
      if (expiresIn > 0) {
        console.log('✓ Status: VALID (expires in', expiresIn, 'seconds)');
        console.log('\n📧 Now you can test reset password with this OTP:');
        console.log(`   node test-forgot-password.js ${email} ${user.resetPasswordOTP} newPassword123`);
      } else {
        console.log('✗ Status: EXPIRED');
      }
    } else {
      console.log('\n⚠️  No OTP found. Please request OTP first:');
      console.log('   node test-forgot-password.js');
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

checkOTP();
