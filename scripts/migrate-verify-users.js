require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');

const migrateUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Updating existing users...');
    
    // Update all users who don't have isEmailVerified set, or set to false
    // We assume all existing users BEFORE this feature are considered "verified" (trusted)
    const result = await User.updateMany(
      { isEmailVerified: { $ne: true } }, 
      { $set: { isEmailVerified: true } }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} users.`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

migrateUsers();
