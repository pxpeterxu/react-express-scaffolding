'use strict';

import passport from 'passport';
import user from './user';
import index from './index';

var loadRoutes = function(app) {
  app.use('/user', user);
  app.use('/', index);

  return app;
};

module.exports = loadRoutes;
