/**
 * tag controller
 */

import { factories } from '@strapi/strapi'

let cache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default factories.createCoreController('api::tag.tag', ({ strapi }) => ({
  async grouped(ctx) {
    const now = Date.now();

    if (cache && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS) {
      ctx.body = { data: cache };
      return;
    }

    const results = await strapi.db.connection.raw(`
      SELECT category, array_agg(DISTINCT value) AS values
      FROM tags
      GROUP BY category
    `);

    const grouped = results.rows.reduce((acc, row) => {
      acc[row.category] = row.values;
      return acc;
    }, {});

    cache = grouped;
    cacheTimestamp = now;

    ctx.body = { data: grouped };
  }
}));
