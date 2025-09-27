/**
 * interaction controller
 */

import { factories } from '@strapi/strapi'

// todo: find this in @strapi
type Params = {
  where?: any;
  filters?: any;
  select?: any;
  populate?: any;
  orderBy?: any;
  _q?: string;
  data?: any;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  count?: boolean;
};

export default factories.createCoreController('api::interaction.interaction', ({ strapi }) => ({

  async find(ctx) {
    const userId = ctx.state.user.documentId;
    const sanitizedQuery: Params = await this.sanitizeQuery(ctx);

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
        owner: { documentId: userId },
        publishedAt: { $notNull: true }
      },
    });

    // population
    const { populate } = sanitizedQuery;
    const trimmedResults = results.map((r) => {
      const out: any = {
        id: r.id,
        flavor: r.flavor,
        documentId: r.documentId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };

      if (populate?.datum) {
        const fields = populate.datum.fields || [];
        out.datum = {};
        for (const f of fields) {
          out.datum[f] = r.datum?.[f];
        }
      }

      if (populate?.owner) {
        const fields = populate.owner.fields || [];
        out.owner = {};
        for (const f of fields) {
          out.owner[f] = r.owner?.[f];
        }
      }

      return out;
    });

    const sanitizedResults = await this.sanitizeOutput(trimmedResults, ctx);
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
