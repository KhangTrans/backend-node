const prisma = require('../lib/prisma');
const { generateSlug } = require('../utils/slug');

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');

    const categories = [
      {
        name: 'Điện thoại',
        slug: generateSlug('Điện thoại'),
        description: 'Điện thoại thông minh từ các thương hiệu hàng đầu như Apple, Samsung, Oppo, Xiaomi',
        imageUrl: 'https://cdn.example.com/categories/dien-thoai.jpg'
      },
      {
        name: 'Laptop',
        slug: generateSlug('Laptop'),
        description: 'Laptop văn phòng, gaming, và cao cấp từ Dell, HP, Asus, Lenovo, MacBook',
        imageUrl: 'https://cdn.example.com/categories/laptop.jpg'
      },
      {
        name: 'Máy tính bảng',
        slug: generateSlug('Máy tính bảng'),
        description: 'iPad, Samsung Galaxy Tab, và các máy tính bảng Android khác',
        imageUrl: 'https://cdn.example.com/categories/may-tinh-bang.jpg'
      }
    ];

    for (const category of categories) {
      const existing = await prisma.category.findUnique({
        where: { slug: category.slug }
      });

      if (!existing) {
        await prisma.category.create({
          data: category
        });
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name}`);
      }
    }

    console.log('✅ Categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('🎉 Seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCategories };
