require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const User = require('../models/User.model');
const Category = require('../models/Category.model');
const Product = require('../models/Product.model');

async function addProducts() {
  try {
    console.log('🌱 Adding new products...\n');

    await connectMongoDB();

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found.');
      await mongoose.disconnect();
      return;
    }

    // Get categories
    const phoneCategory = await Category.findOne({ slug: 'dien-thoai' });
    const laptopCategory = await Category.findOne({ slug: 'laptop' });

    // New products to add with images
    const newProducts = [
      {
        name: 'Google Pixel 9 Pro',
        slug: 'google-pixel-9-pro',
        description: 'Google Pixel 9 Pro với camera AI tuyệt vời, Tensor chip mạnh mẽ, màn hình 6.3 inch OLED.',
        price: 26990000,
        stock: 30,
        categoryId: phoneCategory?._id,
        metaTitle: 'Google Pixel 9 Pro - Camera AI tốt nhất',
        metaDescription: 'Mua Google Pixel 9 Pro với camera AI, hiệu năng mạnh',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/pixel-9-pro-1.jpg',
            isPrimary: true,
            order: 0
          },
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/pixel-9-pro-2.jpg',
            isPrimary: false,
            order: 1
          }
        ]
      },
      {
        name: 'OnePlus 12 Pro',
        slug: 'oneplus-12-pro',
        description: 'OnePlus 12 Pro Snapdragon 8 Gen 3, RAM 12GB, camera 50MP, sạc nhanh 100W.',
        price: 20990000,
        stock: 25,
        categoryId: phoneCategory?._id,
        metaTitle: 'OnePlus 12 Pro - Hiệu năng cao',
        metaDescription: 'OnePlus 12 Pro với sạc nhanh 100W, hiệu năng mạnh',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/oneplus-12-pro-1.jpg',
            isPrimary: true,
            order: 0
          },
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/oneplus-12-pro-2.jpg',
            isPrimary: false,
            order: 1
          }
        ]
      },
      {
        name: 'HP Pavilion 15',
        slug: 'hp-pavilion-15',
        description: 'HP Pavilion 15 Intel Core i7, RAM 16GB, SSD 512GB, màn hình 15.6 inch FHD.',
        price: 18990000,
        stock: 15,
        categoryId: laptopCategory?._id,
        metaTitle: 'HP Pavilion 15 - Laptop gọn nhẹ',
        metaDescription: 'HP Pavilion 15 thích hợp cho học tập và làm việc',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/hp-pavilion-15-1.jpg',
            isPrimary: true,
            order: 0
          },
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/hp-pavilion-15-2.jpg',
            isPrimary: false,
            order: 1
          }
        ]
      },
      {
        name: 'ASUS VivoBook 14',
        slug: 'asus-vivobook-14',
        description: 'ASUS VivoBook 14 AMD Ryzen 5, RAM 8GB, SSD 256GB, pin 10 tiếng, nặng chỉ 1.2kg.',
        price: 12990000,
        stock: 20,
        categoryId: laptopCategory?._id,
        metaTitle: 'ASUS VivoBook 14 - Ultrabook nhẹ',
        metaDescription: 'ASUS VivoBook 14 siêu nhẹ, pin lâu, giá rẻ',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/asus-vivobook-14-1.jpg',
            isPrimary: true,
            order: 0
          },
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/asus-vivobook-14-2.jpg',
            isPrimary: false,
            order: 1
          }
        ]
      },
      {
        name: 'Motorola Edge 50 Pro',
        slug: 'motorola-edge-50-pro',
        description: 'Motorola Edge 50 Pro Snapdragon 8 Gen 2, camera 50MP, sạc nhanh 68W, giá tốt.',
        price: 17990000,
        stock: 18,
        categoryId: phoneCategory?._id,
        metaTitle: 'Motorola Edge 50 Pro - Giá cạnh tranh',
        metaDescription: 'Motorola Edge 50 Pro hiệu năng mạnh, sạc nhanh',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/motorola-edge-50-pro-1.jpg',
            isPrimary: true,
            order: 0
          },
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/motorola-edge-50-pro-2.jpg',
            isPrimary: false,
            order: 1
          }
        ]
      }
    ];

    console.log(`📦 Adding ${newProducts.length} products with images...\n`);

    for (const product of newProducts) {
      const existingProduct = await Product.findOne({ slug: product.slug });
      
      if (existingProduct) {
        console.log(`⏭️  ${product.name} - Already exists`);
      } else {
        const created = await Product.create(product);
        console.log(`✅ ${product.name}`);
        console.log(`   ID: ${created._id.toString().slice(-6)}`);
        console.log(`   Images: ${created.images?.length || 0} ảnh`);
      }
    }

    console.log('\n✅ Done!');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addProducts();
