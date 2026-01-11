require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const Product = require('../models/Product.model');

async function updateProductImages() {
  try {
    console.log('🎨 Updating product images...\n');

    await connectMongoDB();

    // Product images mapping
    const productsWithImages = {
      'google-pixel-9-pro': [
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
      ],
      'oneplus-12-pro': [
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
      ],
      'hp-pavilion-15': [
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
      ],
      'asus-vivobook-14': [
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
      ],
      'motorola-edge-50-pro': [
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
    };

    let updated = 0;

    for (const [slug, images] of Object.entries(productsWithImages)) {
      const product = await Product.findOne({ slug });
      
      if (product) {
        product.images = images;
        await product.save();
        console.log(`✅ ${product.name}`);
        console.log(`   ${images.length} ảnh được thêm`);
        updated++;
      } else {
        console.log(`❌ ${slug} - Không tìm thấy`);
      }
    }

    console.log(`\n✅ Cập nhật xong! ${updated} sản phẩm`);
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateProductImages();
