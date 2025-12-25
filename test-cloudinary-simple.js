require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('=== CLOUDINARY CONFIGURATION CHECK ===\n');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret Length:', process.env.CLOUDINARY_API_SECRET?.length);
console.log('API Secret First 5 chars:', process.env.CLOUDINARY_API_SECRET?.substring(0, 5));
console.log('API Secret Last 5 chars:', process.env.CLOUDINARY_API_SECRET?.slice(-5));
console.log('\n');

// Configure
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Simple test - list resources
async function testConnection() {
  try {
    console.log('🔍 Testing connection to Cloudinary...\n');
    
    // Try to get account usage
    const result = await cloudinary.api.usage();
    
    console.log('✅ SUCCESS! Connected to Cloudinary');
    console.log('📊 Account Info:');
    console.log('  - Plan:', result.plan);
    console.log('  - Used credits:', result.credits?.used || 0);
    console.log('  - Resources:', result.resources || 0);
    console.log('  - Bandwidth:', result.bandwidth?.used_bytes || 0, 'bytes');
    
    return true;
  } catch (error) {
    console.log('❌ FAILED! Cannot connect to Cloudinary');
    console.log('Error:', error.message);
    console.log('\n📝 Common issues:');
    console.log('  1. API Secret is incorrect (check for typos)');
    console.log('  2. Cloud Name is wrong (should be "dsom4uuux")');
    console.log('  3. API Key is wrong');
    console.log('\n💡 Please double-check your credentials at:');
    console.log('   https://console.cloudinary.com/settings/c-52fe54e48f169476089840bd0d3092357160895b/api-keys');
    
    return false;
  }
}

testConnection();
