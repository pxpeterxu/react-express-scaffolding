import user from './user';
import index from './index';

function loadRoutes(app) {
  app.use('/user', user);
  app.use('*', index);

  return app;
}

export default loadRoutes;
