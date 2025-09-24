/**
 * data router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::data.data', {
  config: {
    find: {
      policies: ['api::data.rate-limit']
    },
    findOne: {
      policies: ['api::data.rate-limit']
    },
    create: {
      policies: ['api::data.rate-limit']
    },
    update: {
      policies: ['api::data.rate-limit']
    },
    delete: {
      policies: ['api::data.rate-limit']
    }
  }
});
