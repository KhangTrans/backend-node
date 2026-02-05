require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');

const TARGET_EMAIL = 'thicamtien20003@gmail.com';

const deleteUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log(`Deleting user(s) with email: ${TARGET_EMAIL}...`);
    const result = await User.deleteMany({ email: TARGET_EMAIL });

    if (result.deletedCount > 0) {
        console.log(`✅ Successfully deleted ${result.deletedCount} user(s).`);
    } else {
        console.log(`⚠️ User with email ${TARGET_EMAIL} not found.`);
    }

  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
};

deleteUser();
