export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      const forwardedProto = ctx.headers['x-forwarded-proto'];
      const forwardedScheme = ctx.headers['x-forwarded-scheme'];
      
      if (forwardedProto === 'https' || forwardedScheme === 'https') {
        ctx.request.secure = true;
        ctx.protocol = 'https';
      }
    }
    
    await next();
  };
};