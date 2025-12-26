const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...\n');

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@example.com' }
    });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Email:', existingUser.email);
      console.log('Username:', existingUser.username);
      console.log('Role:', existingUser.role);
      console.log('\n✨ Done!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'user@example.com',
        password: hashedPassword,
        fullName: 'Test User',
        role: 'user',
        isActive: true
      }
    });

    console.log('✅ Test user created successfully!\n');
    console.log('📋 User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', user.email);
    console.log('Password: ', '123456');
    console.log('Username: ', user.username);
    console.log('Role:     ', user.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Done!');
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
