export default {
  async emailLogin(ctx: any) {
    try {
      const { to } = ctx.request.body;

      const result = await strapi
        .service('api::custom-route.custom')
        .handleEmailLogin(to);

      ctx.status = 200;
      ctx.body = { success: true, result };
    } catch (err) {
      strapi.log.error('Email login error:', err);
      ctx.throw(500, 'Failed to handle email login');
    }
  }}