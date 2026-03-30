let Redis;
let client;
let isConnected = false;

try {
  Redis = require('ioredis');
  
  // ioredis automatically connects and manages connection pooling
  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times >= 3) return null; // Don't crash the server, bypass cache instead
      return Math.min(times * 50, 2000);
    }
  });

  client.on('error', (err) => {
    // Silently handle if Redis goes away to preserve e-commerce functionality
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('✅ Heavy-Traffic Cache (ioredis) connected');
    isConnected = true;
  });
} catch (e) {
  isConnected = false;
}

/**
 * Get data from cache
 * @param {string} key 
 */
const getCache = async (key) => {
  if (!isConnected) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

/**
 * Set data in cache safely
 * @param {string} key 
 * @param {any} data 
 * @param {number} expiration in seconds (default 3600)
 */
const setCache = async (key, data, expiration = 3600) => {
  if (!isConnected) return;
  try {
    await client.set(key, JSON.stringify(data), 'EX', expiration);
  } catch (err) { }
};

/**
 * Invalidate cache by exact key
 * @param {string} key 
 */
const invalidateCache = async (key) => {
  if (!isConnected) return;
  try {
    await client.del(key);
  } catch (err) { }
};

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  isConnected: () => isConnected,
};
