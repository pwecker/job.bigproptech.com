export default {
  async emailLogin(ctx: any) {
    try {
      const { to } = ctx.request.body;

      const result = await strapi
        .service('api::custom-route.custom')
        .handleEmailLogin(to);

      if (result.error) {
        ctx.status = 400;
        ctx.body = { success: false, error: result.error };
        return;
      } else if (result.warn) {
        ctx.status = 503;
        ctx.body = { success: false, warn: result.warn };
        return;
      }
  
      ctx.status = 200;
      ctx.body = { success: true, result };
    } catch (err) {
      strapi.log.error('Email login error:', err);
      ctx.throw(500, 'Failed to handle email login');
    }
  },
  async magicLink(ctx: any) {
    const { token } = ctx.request.body?.token || ctx.request.query;
    if (!token) return ctx.badRequest('Missing token');

    try {
      const isPrefetch = ctx.request.method === 'GET';
      
      const result = await strapi
        .service('api::custom-route.custom')
        .handleMagicLink(token, { consume: !isPrefetch });

      if (isPrefetch) {
        ctx.status = 200;
        ctx.body = { valid: true };
        return;
      }

      ctx.status = 200;
      ctx.body = result;
    } catch (err) {
      strapi.log.error('Email login error:', err);

      if (err.message === 'INVALID_OR_EXPIRED_TOKEN') {
        return ctx.unauthorized('Invalid or expired token');
      }

      ctx.throw(500, 'Failed to handle email login');
    }
  }
}