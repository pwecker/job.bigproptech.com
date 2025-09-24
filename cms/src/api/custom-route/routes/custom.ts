export default {
  routes: [
    {
      method: 'POST',
      path: '/email-login',
      handler: 'custom.emailLogin',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::recaptcha'],
      },
    }
  ]
}