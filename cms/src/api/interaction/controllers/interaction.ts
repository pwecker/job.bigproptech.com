/**
 * interaction controller
 */

import { factories } from '@strapi/strapi'

type Filters = Record<string, any>;

export default factories.createCoreController('api::interaction.interaction', ({ strapi }) => ({

  async find(ctx) {
    const userId = ctx.state.user.documentId;
    const filters: Filters = ctx.query?.filters || {};
    ctx.query.filters = {
      ...filters,
      owner: {
        documentId: userId
      }
    };

    return super.find(ctx);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;

    const entity = await strapi.db.query('api::interaction.interaction').findOne({
      where: { id, owner: { documentId: userId } }
    });

    if (!entity) {
      return ctx.unauthorized('You don’t have access to this document');
    }

    return this.transformResponse(entity);
  },

  async create(ctx) {
    const userId = ctx.state.user.documentId;
    ctx.request.body.data.owner = userId;
    return super.create(ctx);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.documentId;
  
    const existing = await strapi.db.query('api::interaction.interaction').findOne({
      where: { documentId: id, owner: { documentId: userId } },
    });
  
    if (!existing) {
      return ctx.notFound('Issue getting document');
    }
  
    return super.update(ctx);
  }

}));
