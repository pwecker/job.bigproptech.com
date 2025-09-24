import type { Core } from '@strapi/strapi';
import Redis from 'ioredis';

const host = process.env.REDIS_HOST;
const port = parseInt(process.env.REDIS_PORT);
const password = process.env.REDIS_PASS;

const client = new Redis({
  family: 0,
  host,
  port,
  password,
  maxRetriesPerRequest: null
});

export default async (policyContext: Core.PolicyContext, config, { strapi }) => {
  const { ctx } = policyContext.request;
  
  try {
    const ip = ctx.request.ip;
    const key = `limit:${ip}`;
    const windowMs = 750;
    const maxRequests = 1;
    
    const current = await client.incr(key);
    
    if (current === 1) {
      await strapi.redis.pexpire(key, windowMs);
    }

    
    if (current > maxRequests) {
      ctx.status = 429;
      ctx.body = { error: 'Too many requests, please try again later.' };
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Rate limit policy error:', error);
    return true;
  }
};