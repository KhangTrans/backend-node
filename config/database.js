const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 10000
    },
    logging: false, // Disable logging in production
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    
    // Sync models with database (only if not in serverless)
    if (process.env.VERCEL !== '1') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database synced');
    }
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    // Don't exit process in serverless environment
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
