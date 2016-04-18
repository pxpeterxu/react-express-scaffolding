var randomstring = require('randomstring');
var passport = require('passport');
var Promise = require('bluebird');

var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var logger = require('./logger');

var serializedAttributes = ['id', 'username', 'email', 'password', 'activated'];

var localStrategy = new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function(username, password, done) {
  var user = null;
  var token = null;
  User.findOne({
    where: {
      $or: [
        { email: username },
        { username: username }
      ]
    },
    attributes: serializedAttributes
  }).then(function(dbUser) {
    user = dbUser;
    if (user === null) {
      return done(null, false, {
        errType: 'username',
        message: 'We could not find a user with the given username or email'
      });
    }
    
    return user.comparePassword(password);
  }).then(function(matched) {      
    if (!matched) {
      return done(null, false, {
        errType: 'password',
        message: 'The password is incorrect'
      });
    }
  }).then(function() {
    return done(null, user, {
      message: 'You have successfully signed in!',
      token: token,
      tutorialStep: user.tutorialStep
    });
  }).catch(function(err) {
    logger.warn('Error while logging in', err.stack);
    return done(err);
  });
});

var serializeUser = function(user, done) {
  done(null, user.id);
};

var deserializeUser = function(id, done) {
  User.findOne({
    where: { id: id },
    attributes: serializedAttributes
  }).then(function(user) {
    done(null, user);
  }).catch(function(err) {
    done(err);
  });
};

var loginCheck = function(req, res, next) {
  if (!req.user) {
    res.json({
      success: false,
      messages: ['You must be logged in'],
      errType: 'notLoggedin'
    });
    return;
  }
  
  next();
};

var loadAuth = function(passport) {
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  passport.use(localStrategy);
};

module.exports = {
  serializeUser: serializeUser,
  deserializeUser: deserializeUser,
  localStrategy: localStrategy,
  loadAuth: loadAuth,
  loginCheck: loginCheck
};
