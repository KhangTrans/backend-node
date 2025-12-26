const { Redis } = require('@upstash/redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    // Check if Redis is enabled
    if (process.env.REDIS_ENABLED !== 'true') {
      console.log('⚠️  Redis is disabled. Set REDIS_ENABLED=true in .env to enable caching.');
      return null;
    }

    // Check if Upstash credentials exist
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Use Upstash REST API (for serverless/Vercel)
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      // Test connection
      await redisClient.ping();
      console.log('✅ Upstash Redis connected successfully (REST API)');
      return redisClient;
    }

    // Fallback to standard Redis TCP
    if (process.env.REDIS_URL) {
      const { createClient } = require('redis');
      
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.log('❌ Redis connection failed after 3 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis connected successfully (TCP)');
      });

      await redisClient.connect();
      return redisClient;
    }

    console.log('⚠️  No Redis configuration found. Add UPSTASH_REDIS_REST_URL or REDIS_URL to .env');
    return null;

  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    console.log('⚠️  Continuing without Redis cache...');
    redisClient = null;
    return null;
  }
};

// Get Redis client
const getRedisClient = () => {
  return redisClient;
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisClient !== null;
};

// Cache get with error handling
const getCache = async (key) => {
  try {
    if (!isRedisAvailable()) return null;
    
    const data = await redisClient.get(key);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error.message);
    return null;
  }
};

// Cache set with error handling
const setCache = async (key, value, ttl = 300) => {
  try {
    if (!isRedisAvailable()) return false;
    
    await redisClient.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error.message);
    return false;
  }
};

// Cache delete with error handling
const deleteCache = async (key) => {
  try {
    if (!isRedisAvailable()) return false;
    
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error.message);
    return false;
  }
};

// Delete cache by pattern
const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisAvailable()) return false;
    
    // Upstash REST doesn't support KEYS command well, use scan
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
    return true;
  } catch (error) {
    console.error(`Redis DEL pattern error for ${pattern}:`, error.message);
    return false;
  }
};

// Clear all cache
const clearCache = async () => {
  try {
    if (!isRedisAvailable()) return false;
    
    await redisClient.flushdb();
    console.log('✅ Redis cache cleared');
    return true;
  } catch (error) {
    console.error('Redis FLUSH error:', error.message);
    return false;
  }
};

// Graceful shutdown
const disconnectRedis = async () => {
  try {
    if (redisClient) {
      // Upstash client doesn't need explicit disconnect
      if (typeof redisClient.quit === 'function') {
        await redisClient.quit();
      }
      console.log('✅ Redis disconnected gracefully');
    }
  } catch (error) {
    console.error('Redis disconnect error:', error);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  clearCache,
  disconnectRedis
};
