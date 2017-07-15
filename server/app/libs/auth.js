'use strict';

import PassportLocal from 'passport-local';
import User from '../models/User';
import misc from './misc';

const LocalStrategy = PassportLocal.Strategy;

var AuthError = function(error) {
  misc.WAError.call(this, [error]);
  this.errorObject = error;
};
AuthError.prototype = misc.WAError.prototype;
AuthError.prototype.constructor = AuthError;

var serializedAttributes = ['id', 'username', 'email', 'password', 'activated'];

/**
 * Get output based on a user's data, used for a response for logins
 * or isLoggedIn
 * @param {Object} user     (optional) sequelize User object
 * @param {Object} session  (optional) session variables for use in yukataTutorialCompleted
 * @return {Object} response to send
 */
function getUserOutput(user, session) {
  return {
    success: true,
    isLoggedIn: !!user,
    username: user ? user.username : null,
    email: user ? user.email : null,
    activated: user ? user.activated : null,
  };
}

var localStrategy = new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function(username, password, done) {
  var user = null;

  Promise.all([
    User.findOne({
      where: {
        $or: [
          { email: username },
          { username: username }
        ]
      },
      attributes: serializedUserColumns.concat(['password'])
    })
  ]).then(function(results) {
    user = results[0];
    var adminUser = results[1];

    if (user === null) {
      throw new AuthError({
        errType: 'username',
        message: 'We could not find a user with the given username or email'
      });
    }

    return user.comparePassword(password);
  }).then(function(matched) {
    if (!matched) {
      throw new AuthError({
        errType: 'password',
        message: 'The password is incorrect'
      });
    }

    done(null, user, Object.assign({
      message: 'You have successfully signed in!',
      token: token
    }, getUserOutput(user)));
  }).catch(function(err) {
    if (err instanceof AuthError) {
      return done(null, false, err.errorObject);
    } else {
      return done(err, false, err);
    }
  });
});

var serializeUser = function(user, done) {
  done(null, user.id);
};

var deserializeUser = function(id, done) {
  User.findOne({
    where: { id: id },
    attributes: serializedUserColumns
  }).then(function(user) {
    done(null, user);
    return null;
  }).catch(function(err) {
    done(err);
  });
};

/**
 * Node.js middleware that ensures user is logged in,
 * and if not, return a default message
 */
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

/**
 * Node.js middleware that ensures user is logged in AND is an admin
 */
function adminCheck(req, res, next) {
  loginCheck(req, res, function() {
    if (req.user.role !== 'Administrator') {
      res.json({
        success: false,
        message: ['You are not authorized to see this page'],
        errType: 'notAuthorized'
      });
    } else {
      next();
    }
  });
}

var loadAuth = function(passport) {
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  passport.use(localStrategy);
};

module.exports = {
  serializeUser: serializeUser,
  deserializeUser: deserializeUser,
  getUserOutput: getUserOutput,
  localStrategy: localStrategy,
  loadAuth: loadAuth,
  loginCheck: loginCheck,
  adminCheck: adminCheck,
};
