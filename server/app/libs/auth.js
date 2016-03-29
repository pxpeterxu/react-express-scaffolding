var bcrypt = require('bcryptjs');
var randomstring = require('randomstring');
var passport = require('passport');
var Promise = require('bluebird');

var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/User');
var logger = require('./logger');

var localStrategy = new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function(username, password, done) {
  User.findOne({
    where: {
      $or: [
        { email: username },
        { username: username }
      ]
    },
    attributes: ['id', 'username', 'email', 'password', 'activated']
  }).then(function(user) {
    if (user === null) {
      return done(null, false, {
        errType: 'username',
        message: 'We could not find a user with the given username or email'
      });
    } else {
      bcrypt.compare(password, user.password, function(err, res) {
        if (!res) {
          return done(null, false, {
            errType: 'password',
            message: 'The password is incorrect'
          });
        }
        
        if (!user.activated) {
          return done(null, false, {
            errType: 'activation',
            message: 'Your account has not yet been activated; please check your email'
          });
        }
        
        return done(null, user, {
          message: 'You have successfully signed in!'
        });
      });
    }
  }).catch(function(err) {
    return done(err);
  });
});

var serializeUser = function(user, done) {
  done(null, user.id);
};

var deserializeUser = function(id, done) {
  User.findOne({
    where: { id: id },
    attributes: ['id', 'username', 'apiElementModifyTime']
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
