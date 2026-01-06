require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const User = require('../models/User.model');

const seedData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('🧹 Cleaning database...');
    await User.deleteMany({});
    
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin'
    });
    
    console.log('👤 Creating test user...');
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
      fullName: 'Test User',
      role: 'user'
    });
    
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Created users:');
    console.log('  Admin:', admin.email, '- Password: admin123');
    console.log('  Test User:', testUser.email, '- Password: test123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
