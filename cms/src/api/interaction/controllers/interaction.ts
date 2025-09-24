/**
 * interaction controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::interaction.interaction', ({ strapi }) => ({

  async find(ctx) {
    const userId = ctx.state.user.documentId;
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    // owner
    const baseWhere = (sanitizedQuery.where as Record<string, any>) || {};
    
    const results = await strapi.db.query('api::interaction.interaction').findMany({
      ...sanitizedQuery,
      where: {
        ...baseWhere,
        owner: { documentId: userId },
        publishedAt: { $notNull: true }
      },
    });

    // pagination
    const total = await strapi.db.query('api::interaction.interaction').count({
      where: {
        ...baseWhere,
        owner: { documentId: userId }
      },
    });

    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination: { total } });
  },

  async findOne(ctx) {
    const documentId = ctx.params.id;
    const userId = ctx.state.user.documentId;

    const entity = await strapi.db.query('api::interaction.interaction').findOne({
      where: { documentId, owner: { documentId: userId } }
    });

    if (!entity) {
      return ctx.unauthorized('You don’t have access to this document');
    }

    return this.transformResponse(entity);
  },

  async create(ctx) {
    const { query } = ctx;
    const userId = ctx.state.user.documentId;
    const data = {
      ...(ctx.request.body.data || {}),
      owner: { connect: [userId] },
      publishedAt: new Date().toISOString()
    };

    const entity = await strapi.documents('api::interaction.interaction').create({
      data,
      ...query,
      status: 'published'
    });

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },

  async update(ctx) {
    const { query } = ctx;
    const userId = ctx.state.user.documentId;
    const documentId = ctx.params.id;

    const existing = await strapi.db.query('api::interaction.interaction').findOne({
      where: { documentId, owner: { documentId: userId } }
    });

    if (!existing) {
      return ctx.unauthorized('Not allowed to update this resource');
    }

    // prevent reassignment
    if (ctx.request.body.data?.owner) {
      delete ctx.request.body.data.owner;
    }

    const existingId = existing.documentId;
    const updates = ctx.request.body.data;
    const updated = await strapi.documents('api::interaction.interaction').update({
      documentId: existingId,
      data: {
        ...updates,
        updatedAt: new Date().toISOString()
      },
      ...query
    });
    const sanitized = await this.sanitizeOutput(updated, ctx);
    return this.transformResponse(sanitized);
  }

}));
