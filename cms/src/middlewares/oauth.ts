export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      const forwardedProto = ctx.headers['x-forwarded-proto'];

      console.log('Railway Proxy Debug:', {
        'x-forwarded-proto': forwardedProto,
        host: ctx.headers['host'],
        'original-secure': ctx.request.secure,
        'original-protocol': ctx.protocol,
      });

      if (forwardedProto === 'https') {
        console.log('Detected Railway HTTPS, applying fix');

        Object.defineProperty(ctx.request, 'secure', {
          value: true,
          configurable: true,
        });

        // This is enough — don't try to overwrite ctx.protocol
        ctx.app.proxy = true;

        console.log('After Railway fix:', {
          secure: ctx.request.secure,
          protocol: ctx.protocol,
        });
      }
    }

    await next();
  };
};
