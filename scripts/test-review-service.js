require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongoDB } = require('../config/mongodb');
const reviewService = require('../services/review.service');
const User = require('../models/User.model');
const Product = require('../models/Product.model');
const Review = require('../models/Review.model');

const testReviewFeature = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();

    // 1. Setup Data
    console.log('🛠️ Creating Test Data...');
    
    // Create Test User
    const testUser = await User.create({
      username: `tester_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'hashed_password_placeholder',
      fullName: 'Review Tester',
      isEmailVerified: true
    });
    console.log('✅ Created User:', testUser.username);

    // Create Test Product
    // Note: Adjust fields based on your actual Product model
    const testProduct = await Product.create({
      name: `Test Product ${Date.now()}`,
      description: 'A product for testing reviews',
      price: 100,
      slug: `test-product-${Date.now()}`,
      createdBy: testUser._id
      // Add other required fields if any, checking schema or making robust
    });
    console.log('✅ Created Product:', testProduct.name);

    // 1b. Create Admin User
    const adminUser = await User.create({
      username: `admin_${Date.now()}`,
      email: `admin${Date.now()}@example.com`,
      password: 'hashed_password_placeholder',
      fullName: 'Admin Tester',
      role: 'admin',
      isEmailVerified: true
    });
    console.log('✅ Created Admin:', adminUser.username);

    // 2. Test Add Review (Should notify admin)
    console.log('\n📝 Testing Add Review...');
    const review1 = await reviewService.addReview(
      testUser._id,
      testProduct._id,
      5,
      "Sản phẩm tuyệt vời! 10 điểm."
    );
    console.log('✅ Review added:', review1.comment);

    // Verify Admin Notification
    const Notification = require('../models/Notification.model');
    const adminNotif = await Notification.findOne({ userId: adminUser._id }).sort({ createdAt: -1 });
    if (adminNotif && adminNotif.type === 'REVIEW_CREATED') {
        console.log('✅ Admin Notification received:', adminNotif.message);
    } else {
        console.warn('⚠️ Admin Notification NOT found (Check if createNotification works)');
    }

    // 3. Test Reply Review (Admin replies)
    console.log('\n💬 Testing Admin Reply...');
    const repliedReview = await reviewService.replyToReview(
        review1._id,
        adminUser._id,
        "Cảm ơn bạn đã ủng hộ shop!"
    );
    console.log('✅ Reply added:', repliedReview.reply.comment);

    // Verify User Notification
    const userNotif = await Notification.findOne({ userId: testUser._id }).sort({ createdAt: -1 });
    if (userNotif && userNotif.type === 'REVIEW_REPLY') {
        console.log('✅ User Notification received:', userNotif.message);
    } else {
        console.error('❌ User Notification NOT found');
    }

    // 4. Test Get Reviews (Should include reply)
    console.log('\n🔍 Testing Get Product Reviews...');
    const reviews = await reviewService.getReviewsByProduct(testProduct._id);
    if(reviews[0].reply && reviews[0].reply.comment) {
        console.log('✅ Review contains reply:', reviews[0].reply.comment);
    } else {
        console.error('❌ Review missing reply in fetch');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await Review.deleteMany({ product: testProduct._id });
    await Product.findByIdAndDelete(testProduct._id);
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(adminUser._id);
    await Notification.deleteMany({ userId: { $in: [testUser._id, adminUser._id] } });
    console.log('✅ Cleanup done.');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

testReviewFeature();
