export default {
  routes: [
    {
      method: 'POST',
      path: '/email-login',
      handler: 'custom.emailLogin',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::recaptcha']
      },
    },
    {
      method: 'GET',
      path: '/magic-link',
      handler: 'custom.magicLink',
      config: {
        auth: false,
        policies: ['global::rate-limit']
      },
    },
    {
      method: 'POST',
      path: '/magic-link',
      handler: 'custom.magicLink',
      config: {
        auth: false,
        middlewares: ['global::recaptcha']
      },
    }
  ]
}