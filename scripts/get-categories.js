require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const Category = require('../models/Category.model');

const getCategories = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    const categories = await Category.find();
    
    if (categories.length === 0) {
      console.log('❌ Không có categories nào trong database!');
    } else {
      console.log('\n✅ Categories trong database:\n');
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   _id: ${cat._id}`);
        console.log(`   slug: ${cat.slug}\n`);
      });
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

getCategories();
