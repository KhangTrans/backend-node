require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const Category = require('../models/Category.model');
const User = require('../models/User.model');

async function seedCategories() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Please run seed-mongodb.js first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Check if categories exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log('⏭️  Categories already exist. Skipping...');
      console.log(`   Found ${existingCategories} categories in database.\n`);
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📂 Creating categories...\n');

    const categories = [
      {
        name: 'Điện thoại',
        slug: 'dien-thoai',
        description: 'Điện thoại thông minh các hãng: iPhone, Samsung, Xiaomi, OPPO, Vivo...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/smartphone.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Laptop',
        slug: 'laptop',
        description: 'Laptop văn phòng, gaming, đồ họa: MacBook, Dell, HP, Asus, Lenovo...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/laptop.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Tablet',
        slug: 'tablet',
        description: 'Máy tính bảng iPad, Samsung Galaxy Tab, Xiaomi Pad...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/tablet.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Đồng hồ thông minh',
        slug: 'dong-ho-thong-minh',
        description: 'Apple Watch, Samsung Galaxy Watch, Xiaomi Watch...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/smartwatch.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Tai nghe',
        slug: 'tai-nghe',
        description: 'Tai nghe bluetooth, tai nghe có dây, tai nghe gaming...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/headphones.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Ốp lưng, sạc dự phòng, cáp sạc, bao da, miếng dán màn hình...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/accessories.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'PC - Màn hình',
        slug: 'pc-man-hinh',
        description: 'Máy tính để bàn, màn hình máy tính, linh kiện PC...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/pc-monitor.jpg',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Thiết bị mạng',
        slug: 'thiet-bi-mang',
        description: 'Router wifi, camera giám sát, thiết bị smarthome...',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/network.jpg',
        isActive: true,
        createdBy: admin._id
      }
    ];

    for (const category of categories) {
      const created = await Category.create(category);
      console.log(`✅ Created: ${created.name} (${created.slug})`);
    }

    console.log('\n🎉 Categories seeded successfully!');
    console.log(`   Created ${categories.length} categories.\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedCategories();
