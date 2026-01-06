require('dotenv').config();
const { connectMongoDB, mongoose } = require('./config/mongodb');

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await connectMongoDB();
    
    console.log('\n✅ Connection successful!');
    console.log('📊 Connection details:');
    console.log('  - Database:', mongoose.connection.db.databaseName);
    console.log('  - Host:', mongoose.connection.host);
    console.log('  - Ready State:', mongoose.connection.readyState);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    if (collections.length === 0) {
      console.log('  (No collections yet - database is empty)');
    } else {
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
