const { getCache, setCache } = require('../config/redis');

/**
 * Cache middleware - Check cache before proceeding to controller
 * @param {string} keyPrefix - Cache key prefix (e.g., 'categories', 'products')
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
const cacheMiddleware = (keyPrefix, ttl = 300) => {
  return async (req, res, next) => {
    try {
      // Build cache key from prefix and query params
      const queryString = JSON.stringify(req.query);
      const cacheKey = `${keyPrefix}:${queryString}`;

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        // Cache hit - return cached data
        return res.status(200).json({
          ...cachedData,
          cached: true,
          cacheKey
        });
      }

      // Cache miss - continue to controller
      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          setCache(cacheKey, data, ttl).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without cache
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware - Clear cache after mutation operations
 * @param {string|string[]} patterns - Cache key patterns to delete
 */
const invalidateCacheMiddleware = (patterns) => {
  return async (req, res, next) => {
    try {
      const { deleteCachePattern } = require('../config/redis');
      
      // Store original res.json
      const originalJson = res.json.bind(res);

      res.json = async (data) => {
        // Only invalidate cache on successful mutations
        if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
          const patternArray = Array.isArray(patterns) ? patterns : [patterns];
          
          for (const pattern of patternArray) {
            await deleteCachePattern(pattern).catch(err => {
              console.error(`Cache invalidation error for ${pattern}:`, err);
            });
          }
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware
};
