import { createClient } from 'redis';

class RedisClient {
  constructor() {

    this.client = createClient();
    this.ready = true;
    this.client.on('error', (err) => {
      console.log('Redis Client Error', err);
      this.ready = false;
    });
    this.client.connect();
  }

  isAlive() {
    return this.ready;
  }

  async get(key) {
    if (!key) {
      console.error('Usage: get(key)');
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (err) {
      console.log('Error getting value', err);
      return null;
    }
  }

  async set(key, value, duration) {
    if (!key || !value || !duration) {
      console.error('Usage: set(key, value, duration)');
      return;
    }
    try {
      await this.client.set(key, value, {
        EX: duration,
      });
    } catch (err) {
      console.log('Error setting key', err);
    }
  }

  async del(key) {
    if (!key) {
      console.error('Usage: del(key)');
      return;
    }
    try {
      await this.client.del(key);
    } catch (err) {
      console.log('Error deleting key', err);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
