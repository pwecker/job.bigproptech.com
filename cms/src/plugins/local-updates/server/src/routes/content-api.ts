export default [
  {
    method: 'GET',
    path: '/',
    handler: 'controller.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/health',
    handler: 'controller.health',
    config: {
      policies: [],
      auth: false
    }
  }
];
