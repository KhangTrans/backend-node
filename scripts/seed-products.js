const mongoose = require('mongoose');
const { connectMongoDB } = require('../config/mongodb');
const User = require('../models/User.model');
const Category = require('../models/Category.model');
const Product = require('../models/Product.model');

async function seedProducts() {
  try {
    console.log('🌱 Seeding products...\n');

    await connectMongoDB();

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      console.log('❌ Admin user not found. Please create admin first.');
      await mongoose.disconnect();
      return;
    }

    // Get categories
    const phoneCategory = await Category.findOne({ slug: 'dien-thoai' });
    const laptopCategory = await Category.findOne({ slug: 'laptop' });

    // Check if products exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('⏭️  Products already exist. Skipping...');
      console.log(`   Found ${existingProducts} products in database.\n`);
      await mongoose.disconnect();
      return;
    }

    // Create products
    const products = [
      {
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        description: 'iPhone 15 Pro Max 256GB - Titan Tự Nhiên. Chip A17 Pro mạnh mẽ, camera 48MP, màn hình Super Retina XDR 6.7 inch.',
        price: 29990000,
        stock: 50,
        categoryId: phoneCategory?._id,
        metaTitle: 'iPhone 15 Pro Max 256GB - Chính hãng VN/A',
        metaDescription: 'Mua iPhone 15 Pro Max giá tốt, trả góp 0%, bảo hành chính hãng Apple',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        description: 'Samsung Galaxy S24 Ultra 12GB/256GB - Màu Đen. Snapdragon 8 Gen 3, camera 200MP, màn hình Dynamic AMOLED 6.8 inch.',
        price: 27990000,
        stock: 45,
        categoryId: phoneCategory?._id,
        metaTitle: 'Samsung Galaxy S24 Ultra 256GB - Chính hãng',
        metaDescription: 'Galaxy S24 Ultra với camera 200MP, hiệu năng mạnh mẽ',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'MacBook Pro M3 14 inch',
        slug: 'macbook-pro-m3-14',
        description: 'MacBook Pro 14 inch M3 8GB 512GB - Xám. Chip M3 8 nhân, RAM 8GB, SSD 512GB, màn hình Liquid Retina XDR.',
        price: 39990000,
        stock: 30,
        categoryId: laptopCategory?._id,
        metaTitle: 'MacBook Pro M3 14 inch - Chính hãng Apple VN',
        metaDescription: 'MacBook Pro M3 hiệu năng cao, màn hình tuyệt đẹp',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Dell XPS 13 Plus',
        slug: 'dell-xps-13-plus',
        description: 'Dell XPS 13 Plus i7-1360P 16GB 512GB - Bạc. Intel Core i7 Gen 13, RAM 16GB, SSD 512GB, màn hình 13.4 inch FHD+.',
        price: 35990000,
        stock: 25,
        categoryId: laptopCategory?._id,
        metaTitle: 'Dell XPS 13 Plus i7 - Laptop cao cấp',
        metaDescription: 'Dell XPS 13 Plus thiết kế đẹp, hiệu năng mạnh',
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'iPhone 14 Pro',
        slug: 'iphone-14-pro',
        description: 'iPhone 14 Pro 128GB - Tím. Chip A16 Bionic, camera 48MP, Dynamic Island, màn hình 6.1 inch.',
        price: 24990000,
        stock: 40,
        categoryId: phoneCategory?._id,
        metaTitle: 'iPhone 14 Pro 128GB - Giá tốt',
        metaDescription: 'iPhone 14 Pro với Dynamic Island độc đáo',
        isActive: true,
        createdBy: admin._id
      }
    ];

    for (const product of products) {
      await Product.create(product);
      console.log(`✅ Created product: ${product.name}`);
    }

    console.log('\n🎉 Products seeded successfully!');
    console.log(`   Created ${products.length} products.\n`);

  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
