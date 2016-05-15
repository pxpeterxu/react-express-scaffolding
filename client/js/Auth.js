'use strict';

var axios = require('axios');
var _ = require('lodash');

var Config = require('./Config');
var Utility = require('./Utility');

var loggedInCache = null;

/**
 * Attempt a login with a given email/username and password
 * Returns a Promise
 * @param email  
 * @param password
 * @return Promise.<object>
 */
var login = function(email, password) {
  return axios({
    url: Config.host + '/user/login',
    method: 'POST',
    data: {
      email: email,
      password: password
    }
  }).then(Utility.getAxiosData).then(function(data) {
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
  
  return axios({
    url: Config.host + '/user/isLoggedin'
  }).then(Utility.getAxiosData).then(function(data) {
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
  return axios({
    url: Config.host + '/user/logout',
    method: 'POST'
  }).then(Utility.getAxiosData).then(function(response) {
    var data = response.data;
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
  return axios({
    url: Config.host + '/user/register',
    data: user,
    method: 'POST'
  }).then(Utility.getAxiosData);
};


/**
 * Begin a password reset process
 * @param username    username of user to reset password for
 * @param email       email of user to reset password for
 * @return Promise.<object>
 */
var startResetPassword = function(username, email) {
  return axios({    
    url: Config.host + '/user/startResetPassword',
    data: { username: username, email: email },
    method: 'POST'
  }).then(Utility.getAxiosData);
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
