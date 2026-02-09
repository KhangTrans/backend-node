require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const Category = require('../models/Category.model');
const categoryService = require('../services/category.service');

const runTest = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();

    // 1. Get all categories
    const categories = await Category.find();
    if (categories.length === 0) {
      console.log('⚠️  No categories found');
      return;
    }

    console.log(`\nFound ${categories.length} categories.`);

    // 2. Mark first 3 as featured
    const featuredIds = [];
    for (let i = 0; i < Math.min(3, categories.length); i++) {
        const cat = categories[i];
        if (!cat.isFeatured) {
            console.log(`Marking "${cat.name}" as featured...`);
            await categoryService.updateCategory(cat._id, { isFeatured: true });
        } else {
            console.log(`Category "${cat.name}" is already featured.`);
        }
        featuredIds.push(cat._id);
    }

    // 3. Test getFeaturedCategories
    console.log('\n--- Testing getFeaturedCategories ---');
    const featuredCats = await categoryService.getFeaturedCategories();
    
    console.log(`✅ Found ${featuredCats.length} featured categories:`);
    featuredCats.forEach(c => {
        console.log(`   - ${c.name} (isFeatured: ${c.isFeatured})`);
    });

    if (featuredCats.length >= featuredIds.length) {
        console.log('✅ Feature flag working correctly');
    } else {
        console.log('❌ Something wrong with feature flag');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n⚠️  MongoDB disconnected');
    process.exit(0);
  }
};

runTest();
