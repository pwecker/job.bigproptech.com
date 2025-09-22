export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('BACK_URL'),
  
  app: {
    keys: env.array('APP_KEYS'),
  },

  // railway
  proxy: true,
  middlewares: {
    settings: {
      cors: {
        enabled: true,
      },
      trustProxy: true,
    },
  },
  session: {
    cookie: {
      secure: env('NODE_ENV') === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  },
});
