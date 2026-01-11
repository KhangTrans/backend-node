require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const User = require('../models/User.model');
const Product = require('../models/Product.model');

async function addNewProducts() {
  try {
    console.log('🌱 Thêm sản phẩm mới cho các categories...\n');

    await connectMongoDB();

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found.');
      await mongoose.disconnect();
      return;
    }

    // Category IDs
    const categories = {
      smartwatch: '695d19a4930f0dfe2c704d13',
      headphones: '695d19a4930f0dfe2c704d15',
      accessories: '695d19a4930f0dfe2c704d17',
      pc: '695d19a4930f0dfe2c704d19',
      network: '695d19a4930f0dfe2c704d1b'
    };

    // New products
    const newProducts = [
      // Smartwatch
      {
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-series-9',
        description: 'Apple Watch Series 9 với chip S9, màn hình Always-On, pin 18 tiếng, chống nước IP6x.',
        price: 12990000,
        stock: 25,
        categoryId: categories.smartwatch,
        metaTitle: 'Apple Watch Series 9 - Đồng hồ thông minh hàng đầu',
        metaDescription: 'Apple Watch Series 9 với S9, Always-On display, pin lâu',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/apple-watch-s9-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      {
        name: 'Samsung Galaxy Watch 6',
        slug: 'samsung-galaxy-watch-6',
        description: 'Samsung Galaxy Watch 6 với AMOLED, Wear OS 3, pin 40 tiếng, giám sát sức khỏe.',
        price: 9990000,
        stock: 30,
        categoryId: categories.smartwatch,
        metaTitle: 'Samsung Galaxy Watch 6 - Giá rẻ, tính năng đủ',
        metaDescription: 'Galaxy Watch 6 với AMOLED, pin lâu, giám sát sức khỏe',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/galaxy-watch-6-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      // Headphones
      {
        name: 'Sony WH-1000XM5',
        slug: 'sony-wh-1000xm5',
        description: 'Sony WH-1000XM5 với noise-cancelling AI, pin 30 tiếng, âm thanh hi-res, thoải mái để đeo.',
        price: 8990000,
        stock: 20,
        categoryId: categories.headphones,
        metaTitle: 'Sony WH-1000XM5 - Tai nghe chống ồn tốt nhất',
        metaDescription: 'WH-1000XM5 với noise-cancel AI, pin 30h, âm thanh chất lượng cao',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/sony-xm5-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      {
        name: 'Apple AirPods Pro 2',
        slug: 'apple-airpods-pro-2',
        description: 'Apple AirPods Pro 2 với Active Noise Cancellation, Adaptive Audio, pin 6 tiếng, wireless charging.',
        price: 6990000,
        stock: 35,
        categoryId: categories.headphones,
        metaTitle: 'Apple AirPods Pro 2 - Tai nghe không dây premium',
        metaDescription: 'AirPods Pro 2 với ANC, Adaptive Audio, pin 6h',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/airpods-pro-2-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      // Accessories
      {
        name: 'Anker 65W GaN Charger',
        slug: 'anker-65w-gan-charger',
        description: 'Anker 65W GaN Charger với 2 cổng USB-C, tương thích laptop, điện thoại, máy tính bảng.',
        price: 1290000,
        stock: 50,
        categoryId: categories.accessories,
        metaTitle: 'Anker 65W GaN Charger - Sạc nhanh, gọn nhẹ',
        metaDescription: 'Anker 65W GaN, 2 USB-C, sạc đa thiết bị',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/anker-charger-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      {
        name: 'USB-C Cable 2m',
        slug: 'usb-c-cable-2m',
        description: 'USB-C Cable 2m hỗ trợ sạc nhanh 100W, truyền dữ liệu 10Gbps, bền bỉ.',
        price: 290000,
        stock: 100,
        categoryId: categories.accessories,
        metaTitle: 'USB-C Cable 2m - Sạc nhanh 100W',
        metaDescription: 'USB-C 2m, sạc 100W, truyền dữ liệu 10Gbps',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/usb-c-cable-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      // PC
      {
        name: 'LG 27UP550 Monitor',
        slug: 'lg-27up550-monitor',
        description: 'LG 27UP550 với 4K UHD, color accuracy 99% DCI-P3, USB-C, speaker stereo.',
        price: 16990000,
        stock: 15,
        categoryId: categories.pc,
        metaTitle: 'LG 27UP550 - Màn hình 4K chuyên nghiệp',
        metaDescription: 'LG 27UP550 4K, color accuracy 99%, USB-C',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/lg-27up550-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      {
        name: 'SSD NVMe Kingston 1TB',
        slug: 'ssd-nvme-kingston-1tb',
        description: 'SSD NVMe Kingston 1TB với tốc độ đọc 7100MB/s, ghi 6000MB/s, độ tin cậy cao.',
        price: 2290000,
        stock: 40,
        categoryId: categories.pc,
        metaTitle: 'Kingston 1TB NVMe SSD - Tốc độ cao',
        metaDescription: 'Kingston NVMe 1TB, đọc 7100MB/s, ghi 6000MB/s',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/kingston-ssd-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      // Network
      {
        name: 'ASUS RT-AX88U Router',
        slug: 'asus-rt-ax88u-router',
        description: 'ASUS RT-AX88U WiFi 6 router với tốc độ AX6000, 8 ăng-ten, hỗ trợ Mesh.',
        price: 7990000,
        stock: 20,
        categoryId: categories.network,
        metaTitle: 'ASUS RT-AX88U - Router WiFi 6 mạnh mẽ',
        metaDescription: 'ASUS RT-AX88U WiFi 6, AX6000, 8 ăng-ten',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/asus-router-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      },
      {
        name: 'TP-Link Tapo C100 Camera',
        slug: 'tp-link-tapo-c100-camera',
        description: 'TP-Link Tapo C100 Camera 1080p, night vision, motion detection, cloud storage.',
        price: 1490000,
        stock: 30,
        categoryId: categories.network,
        metaTitle: 'TP-Link Tapo C100 - Camera giám sát thông minh',
        metaDescription: 'Tapo C100 1080p, night vision, motion detection',
        isActive: true,
        createdBy: admin._id,
        images: [
          {
            imageUrl: 'https://res.cloudinary.com/dsom4uuux/image/upload/v1704526000/products/tapo-camera-1.jpg',
            isPrimary: true,
            order: 0
          }
        ]
      }
    ];

    console.log(`📦 Thêm ${newProducts.length} sản phẩm...\n`);

    let added = 0;
    for (const product of newProducts) {
      const existingProduct = await Product.findOne({ slug: product.slug });
      
      if (existingProduct) {
        console.log(`⏭️  ${product.name} - Đã tồn tại`);
      } else {
        const created = await Product.create(product);
        console.log(`✅ ${product.name}`);
        console.log(`   Giá: ${product.price.toLocaleString('vi-VN')} VND`);
        added++;
      }
    }

    console.log(`\n✅ Hoàn tất! Thêm ${added} sản phẩm mới.`);
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addNewProducts();
