export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      const forwardedProto = ctx.headers['x-forwarded-proto'];
      if (forwardedProto === 'https') {
        Object.defineProperty(ctx.request, 'secure', {
          value: true,
          configurable: true,
        });

        ctx.app.proxy = true;
      }
    }

    await next();
  };
};
