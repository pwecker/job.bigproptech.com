export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.log('Railway Proxy Debug:', {
        'x-forwarded-proto': ctx.headers['x-forwarded-proto'],
        'x-forwarded-scheme': ctx.headers['x-forwarded-scheme'],
        'x-forwarded-ssl': ctx.headers['x-forwarded-ssl'],
        'x-forwarded-port': ctx.headers['x-forwarded-port'],
        'host': ctx.headers['host'],
        'original-secure': ctx.request.secure,
        'original-protocol': ctx.protocol,
      });
      
      const forwardedProto = ctx.headers['x-forwarded-proto'];
      const forwardedScheme = ctx.headers['x-forwarded-scheme'];
      const forwardedSsl = ctx.headers['x-forwarded-ssl'];
      
      if (forwardedProto === 'https' || 
          forwardedScheme === 'https' || 
          forwardedSsl === 'on' ||
          ctx.headers['host']?.includes('railway.app')) {
        
        console.log('Setting secure context for Railway HTTPS');
        ctx.request.secure = true;
        ctx.protocol = 'https';
        
        if (ctx.request.URL) {
          ctx.request.URL.protocol = 'https:';
        }
      }
      
      console.log('After Railway fix:', {
        'secure': ctx.request.secure,
        'protocol': ctx.protocol,
      });
    }
    
    await next();
  };
};