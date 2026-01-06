const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    const adminEmail = 'admin@backend.com';
    const adminPassword = 'Admin@123456';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Administrator',
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', adminEmail);
    console.log('Password: ', adminPassword);
    console.log('Username: ', admin.username);
    console.log('Role:     ', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔐 Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };

