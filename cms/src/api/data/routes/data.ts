/**
 * data router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::data.data', {
  config: {
    find: {
      policies: ['global::rate-limit']
    },
    findOne: {
      policies: ['global::rate-limit']
    },
    create: {
      policies: ['global::rate-limit']
    },
    update: {
      policies: ['global::rate-limit']
    },
    delete: {
      policies: ['global::rate-limit']
    }
  }
});
