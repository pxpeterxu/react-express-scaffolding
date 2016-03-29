'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var MySQLSessionStore = require('express-mysql-session');
var routes = require('./app/main');
var config = require('./app/config');
var logger = require('./app/libs/logger');
var auth = require('./app/libs/auth');
var cors = require('./app/libs/cors');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
if (process.env.NODE_REQUEST_LOG) {
  app.use(morgan('dev', {stream: logger.requestLogger.stream}));
}

app.use(bodyParser.json({ limit: '16mb' }));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '1mb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Allow cross domain from Chrome plugins
var allowCrossDomain = function(req, res, next) {
  if (req.headers.origin &&
      req.headers.origin.indexOf('chrome-extension://') === 0) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
};

// Authentication
var dbDetails = config.dbDetails;
var sessionStore = new MySQLSessionStore({
  host: dbDetails.host,
  port: dbDetails.port,
  user: dbDetails.user,
  password: dbDetails.password,
  database: dbDetails.database,
  schema: config.sessionsSchema
});

app.use(session({
  secret: 'ThisisAnINterestingsecret',
  saveUninitialized: false,
  resave: false,
  store: sessionStore
}));
auth.loadAuth(passport);
app.use(passport.initialize());
app.use(passport.session());

routes(app);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    logger.error('500 error', {
      message: err.message,
      error: err,
      title: 'error'
    });
    
    res.render('error', {
      message: err.message,
      error: err,
      title: 'error'
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  logger.error('500 error', {
    message: err.message,
    error: err,
    title: 'error'
  });
});


module.exports = app;
