import type { Core } from '@strapi/strapi';

export default async (policyContext: Core.PolicyContext, config, { strapi }) => {
  const { ctx } = policyContext.request;
  
  try {
    const ip = ctx.request.ip;
    const key = `limit:${ip}`;
    const windowMs = 750;
    const maxRequests = 3;
    
    const current = await strapi.redis.incr(key);
    
    if (current === 1) {
      await strapi.redis.pexpire(key, windowMs);
    }

    
    if (current > maxRequests) {
      return ctx.throw(429, 'Too many requests.');
    }
    
    return true;
  } catch (error) {
    if (error.status === 429) {
      throw error;
    }

    console.error('Rate limit policy error:', error);
    return true;
  }
};