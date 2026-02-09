require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const recommendationService = require('../services/recommendation.service');
const Product = require('../models/Product.model');

const runTest = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();

    // Get a sample product for testing
    const sampleProduct = await Product.findOne({ isActive: true });
    
    if (!sampleProduct) {
      console.log('⚠️  No products found in database. Please add some products first.');
      return;
    }

    console.log(`\n📦 Using sample product: ${sampleProduct.name} (${sampleProduct._id})`);

    // Test 1: Similar Products
    console.log('\n--- Test 1: Similar Products ---');
    try {
      const similarResult = await recommendationService.getSimilarProducts(sampleProduct._id.toString(), 5);
      console.log(`✅ Found ${similarResult.total} similar products`);
      similarResult.products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ`);
      });
    } catch (error) {
      console.error('❌ Similar Products Error:', error.message);
    }

    // Test 2: Trending Products
    console.log('\n--- Test 2: Trending Products ---');
    try {
      const trendingResult = await recommendationService.getTrendingProducts(5, 30);
      console.log(`✅ Found ${trendingResult.total} trending products (${trendingResult.period})`);
      trendingResult.products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ`);
      });
    } catch (error) {
      console.error('❌ Trending Products Error:', error.message);
    }

    // Test 3: New Arrivals
    console.log('\n--- Test 3: New Arrivals ---');
    try {
      const newArrivalsResult = await recommendationService.getNewArrivals(5, 30);
      console.log(`✅ Found ${newArrivalsResult.total} new arrivals (${newArrivalsResult.period})`);
      newArrivalsResult.products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ`);
      });
    } catch (error) {
      console.error('❌ New Arrivals Error:', error.message);
    }

    // Test 4: Products by Category
    if (sampleProduct.categoryId) {
      console.log('\n--- Test 4: Products by Category ---');
      try {
        const categoryResult = await recommendationService.getProductsByCategory(
          sampleProduct.categoryId.toString(),
          sampleProduct._id.toString(),
          5
        );
        console.log(`✅ Found ${categoryResult.total} products in same category`);
        categoryResult.products.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ`);
        });
      } catch (error) {
        console.error('❌ Category Products Error:', error.message);
      }
    }

    // Test 5: Best Rated Products
    console.log('\n--- Test 5: Best Rated Products ---');
    try {
      const bestRatedResult = await recommendationService.getBestRatedProducts(5);
      console.log(`✅ Found ${bestRatedResult.total} best rated products`);
      bestRatedResult.products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ`);
      });
    } catch (error) {
      console.error('❌ Best Rated Products Error:', error.message);
    }

    console.log('\n✅ All recommendation tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n⚠️  MongoDB disconnected');
    process.exit(0);
  }
};

runTest();
