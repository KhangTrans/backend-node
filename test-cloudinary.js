const fs = require('fs');
const path = require('path');
require('dotenv').config();

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('🔧 Cloudinary Configuration:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET');
console.log('');

// Test 1: Upload image from URL
async function testUploadFromUrl() {
  try {
    console.log('📤 Test 1: Uploading image from URL...');
    const result = await cloudinary.uploader.upload(
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      {
        folder: 'products',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' }
        ]
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Size:', result.bytes, 'bytes');
    console.log('');
    
    return result.public_id;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Error details:', error);
    return null;
  }
}

// Test 2: Upload image from base64
async function testUploadBase64() {
  try {
    console.log('📤 Test 2: Uploading image from base64...');
    
    // Sample base64 image (1x1 red pixel)
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'products',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    console.log('✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Size:', result.bytes, 'bytes');
    console.log('');
    
    return result.public_id;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    return null;
  }
}

// Test 3: Delete image
async function testDeleteImage(publicId) {
  if (!publicId) {
    console.log('⏭️  Skipping delete test (no image to delete)');
    return;
  }
  
  try {
    console.log('🗑️  Test 3: Deleting image...');
    console.log('Public ID:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted successfully!');
    } else {
      console.log('⚠️  Delete result:', result.result);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Delete failed:', error.message);
  }
}

// Test 4: List resources in folder
async function testListResources() {
  try {
    console.log('📋 Test 4: Listing resources in products folder...');
    
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'products/',
      max_results: 10
    });
    
    console.log('✅ Found', result.resources.length, 'images');
    result.resources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.public_id} (${resource.bytes} bytes)`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ List failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Cloudinary Upload Tests...\n');
  
  // Test upload from URL
  const publicId1 = await testUploadFromUrl();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test upload from base64
  const publicId2 = await testUploadBase64();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // List all resources
  await testListResources();
  
  // Delete test images
  if (publicId1) {
    await testDeleteImage(publicId1);
  }
  
  if (publicId2) {
    await testDeleteImage(publicId2);
  }
  
  console.log('✨ All tests completed!');
}

// Run tests
runAllTests().catch(console.error);
