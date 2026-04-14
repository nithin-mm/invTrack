const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.on('connect', () => console.log('🚀 Connected to Redis'));

const cache = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis Get Error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      console.error('Redis Set Error:', error);
    }
  },

  async del(pattern) {
    try {
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
      } else {
        await redis.del(pattern);
      }
    } catch (error) {
      console.error('Redis Del Error:', error);
    }
  },

  async clearInventory() {
    await this.del('inventory:*');
    await this.del('dashboard:stats');
  }
};

module.exports = cache;
