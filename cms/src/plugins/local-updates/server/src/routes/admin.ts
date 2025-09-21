export default [
  {
    method: 'POST',
    path: '/update',
    handler: 'controller.update',
    config: {
      update: {auth: true},
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/sync',
    handler: 'controller.sync',
    config: {
      update: {auth: true},
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/tag',
    handler: 'controller.tagBatch',
    config: {
      update: {auth: true},
      policies: [],
    },
  }
];
