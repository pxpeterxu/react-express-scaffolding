'use strict';

import axios from './Axios';

import Config from './Config';

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
    method: 'post',
    data: {
      email: email,
      password: password
    },
    withCredentials: true
  });
};

/**
 * Check whether we are already logged in
 * @return Promise.{loggedIn, username}
 */
var isLoggedIn = function() {
  return axios({
    url: Config.host + '/user/isLoggedin'
  });
};

/**
 * Sign out of a user
 * @return {Promise.<Object>} response data
 */
var logout = function() {
  return axios({
    url: Config.host + '/user/logout',
    method: 'post'
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
    method: 'post'
  });
};

/**
 * Set the tutorial state that a user is at
 * @param step           tutorial step from Tutorial.steps
 * @example Auth.thenTutorialStep('pressToRecord').then...
 * @return Promise.<object>
 */
var setTutorialStep = function(step) {
  return axios({
    url: Config.host + '/user/tutorialStep',
    data: { step: step },
    method: 'post'
  });
};

/**
 * Sets whether we've completed the Yukata interface tutorial
 * @param {boolean} completed   whether it's complete
 * @return {Promise.<object>} response
 */
function setYukataTutorialCompleted(completed) {
  return axios({
    url: Config.host + '/user/yukataTutorialCompleted',
    data: { completed: completed },
    method: 'post'
  });
}

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
    method: 'post'
  });
};

/**
 * Activate a user's account so that they can use the
 * /use endpoint
 * @param username       username of account to activate
 * @param activationkey  secret activation key
 * @return Promise.<data>
 */
var activate = function(username, activationKey) {
  return axios({
    url: Config.host + '/user/activate/' + username + '/' + activationKey,
    method: 'post'
  });
};

/**
 * Check if a password reset token is valid
 * @param token       password reset token to use
 * @return Promise.<data>
 */
var isValidPasswordResetToken = function(token) {
  return axios({
    url: Config.host + '/user/isValidPasswordResetToken',
    method: 'get',
    params: { token: token }
  });
};

/**
 * Reset the password using a password reset token
 * @param token       password reset token to use
 * @param password    new password to use
 * @return Promise.<data>
 */
var resetPassword = function(token, password) {
  return axios({
    url: Config.host + '/user/resetPassword',
    method: 'post',
    data: { token: token, password: password }
  });
};

module.exports = {
  login: login,
  isLoggedIn: isLoggedIn,
  logout: logout,
  register: register,
  activate: activate,
  setTutorialStep: setTutorialStep,
  setYukataTutorialCompleted: setYukataTutorialCompleted,
  startResetPassword: startResetPassword,
  isValidPasswordResetToken: isValidPasswordResetToken,
  resetPassword: resetPassword,
};
