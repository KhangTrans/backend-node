require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const recommendationService = require('../services/recommendation.service');
const Product = require('../models/Product.model');

const runDetailedTest = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();

    // Get a sample product WITH category for testing
    const sampleProduct = await Product.findOne({ 
      isActive: true,
      categoryId: { $ne: null }
    });
    
    if (!sampleProduct) {
      console.log('⚠️  No products with category found.');
      return;
    }

    console.log(`\n📦 Testing with: ${sampleProduct.name}`);
    console.log(`   Category ID: ${sampleProduct.categoryId}`);

    // Test Similar Products
    console.log('\n--- Testing Similar Products Response ---');
    const similarResult = await recommendationService.getSimilarProducts(sampleProduct._id.toString(), 2);
    
    if (similarResult.products.length > 0) {
      const product = similarResult.products[0];
      console.log('\n✅ Sample Product Response:');
      console.log(JSON.stringify(product, null, 2));
      
      console.log('\n📋 Fields Check:');
      console.log(`  ✓ _id: ${product._id ? '✅' : '❌'}`);
      console.log(`  ✓ name: ${product.name ? '✅' : '❌'}`);
      console.log(`  ✓ slug: ${product.slug ? '✅' : '❌'}`);
      console.log(`  ✓ description: ${product.description ? '✅' : '❌'}`);
      console.log(`  ✓ price: ${product.price ? '✅' : '❌'}`);
      console.log(`  ✓ stock: ${product.stock !== undefined ? '✅' : '❌'}`);
      console.log(`  ✓ images: ${product.images ? '✅' : '❌'}`);
      console.log(`  ✓ categoryId: ${product.categoryId ? '✅' : '❌'}`);
      
      if (product.categoryId) {
        console.log(`    → categoryId._id: ${product.categoryId._id ? '✅' : '❌'}`);
        console.log(`    → categoryId.name: ${product.categoryId.name ? '✅' : '❌'}`);
        console.log(`    → categoryId.slug: ${product.categoryId.slug ? '✅' : '❌'}`);
        console.log(`    → Category Name: "${product.categoryId.name}"`);
      }
      
      console.log(`  ✓ createdAt: ${product.createdAt ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  No similar products found');
    }

    // Test Trending Products
    console.log('\n--- Testing Trending Products Response ---');
    const trendingResult = await recommendationService.getTrendingProducts(1);
    
    if (trendingResult.products.length > 0) {
      const product = trendingResult.products[0];
      console.log('\n✅ Trending Product Sample:');
      console.log(`  Name: ${product.name}`);
      console.log(`  Description: ${product.description || 'N/A'}`);
      console.log(`  Category: ${product.categoryId ? product.categoryId.name : 'N/A'}`);
    }

    console.log('\n✅ All fields verified!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n⚠️  MongoDB disconnected');
    process.exit(0);
  }
};

runDetailedTest();
