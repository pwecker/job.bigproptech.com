import contentAPIRoutes from './content-api';
import adminAPIRoutes from './admin';

const routes = {
  'content-api': {
    type: 'content-api',
    routes: contentAPIRoutes,
  },
  'admin': {
    type: 'admin',
    routes: adminAPIRoutes,
  }
};

export default routes;
