export default {
  routes: [
    {
      method: 'GET',
      path: '/tags/grouped',
      handler: 'tag.grouped',
      config: {
        policies: [],
        middlewares: [],
        auth: false
      },
    },
  ],
};