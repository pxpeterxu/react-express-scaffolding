'use strict';

var rp = require('request-promise');
var _ = require('lodash');

var Config = require('./Config');

var loggedInCache = null;

/**
 * Attempt a login with a given email/username and password
 * Returns a Promise
 * @param email  
 * @param password
 * @return Promise.<object>
 */
var login = function(email, password) {
  return rp({
    uri: Config.host + '/user/login',
    method: 'POST',
    body: {
      email: email,
      password: password
    },
    json: true
  }).then(function(data) {
    if (data.success) {
      loggedInCache = {
        success: true,
        loggedIn: true,
        username: data.username
      };
      
      // Call all the registered callbacks
      _.forEach(this.onLogin, function(callback, name) {
        callback(data);
      });
    }
    
    return data;
  }.bind(this));
};

/**
 * Check whether we are already logged in
 * @return Promise.{loggedIn, username}
 */
var isLoggedIn = function() {
  if (loggedInCache) {
    var ret = _.clone(loggedInCache);
    ret.success = true;
    return Promise.resolve(ret);
  }
  
  return rp({
    uri: Config.host + '/user/isLoggedin',
    json: true
  }).then(function(data) {
    if (data.success) {
      loggedInCache = data;
      // Call all the registered callbacks
      _.forEach(this.onLogin, function(callback, name) {
        callback(data);
      });
    }
    
    return data;
  }.bind(this));
};

/**
 * Return the login status in the cache
 * @return object
 */
var isLoggedInSync = function() {
  return loggedInCache;
};

var logout = function() {
  return rp({
    uri: Config.host + '/user/logout',
    method: 'POST',
    json: true
  }).then(function(data) {
    loggedInCache = {
      success: true,
      loggedIn: false,
      username: null
    };
    return data;
  });
};

/**
 * Register a user with given info
 * @param user  user with email, username, password
 * @return Promise.<object>
 */
var register = function(user) {
  return rp({
    uri: Config.host + '/user/register',
    body: user,
    method: 'POST',
    json: true
  });
};


/**
 * Begin a password reset process
 * @param username    username of user to reset password for
 * @param email       email of user to reset password for
 * @return Promise.<object>
 */
var startResetPassword = function(username, email) {
  return rp({    
    uri: Config.host + '/user/startResetPassword',
    body: { username: username, email: email },
    method: 'POST',
    json: true
  });
};


module.exports = {
  login: login,
  isLoggedIn: isLoggedIn,
  isLoggedInSync: isLoggedInSync,
  logout: logout,
  register: register,
  startResetPassword: startResetPassword,
  
  onLogin: {}  // Can be overridden
};
