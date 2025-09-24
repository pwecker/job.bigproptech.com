import Redis from 'ioredis';

const host = process.env.REDIS_HOST;
const port = parseInt(process.env.REDIS_PORT);
const password = process.env.REDIS_PASS;
let client: Redis | null = null;

export function createRedis(): Redis {
  if (!client) {
    client = new Redis({
      family: 0,
      host,
      port,
      password,
      maxRetriesPerRequest: null
    });
    client.on('error', (err) => {
      strapi.log.error('Redis connection error:', err);
    });
  }
  return client;
}