import type { Core } from '@strapi/strapi';

// strapi.redis
import Redis from 'ioredis';
import { createRedis } from './utils/redis';
type ExtendedStrapi = Core.Strapi & { redis?: Redis };

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: ExtendedStrapi }) {
    const redis = createRedis();
    strapi.redis = redis;
  }
};
