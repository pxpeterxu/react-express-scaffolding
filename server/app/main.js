var passport = require('passport');
var user = require('./user');
var index = require('./index');

var loadRoutes = function(app) {
  app.use('/user', user);
  app.use('/', index);
  
  return app;
};

module.exports = loadRoutes;
