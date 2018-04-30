// @flow
import axios from './Axios';
import Config from './Config';

/**
 * Attempt a login with a given email/username and password
 * Returns a Promise
 * @param email
 * @param password
 * @return Promise.<object>
 */
function login(email: string, password: string) {
  return axios({
    url: Config.host + '/user/login',
    method: 'post',
    data: {
      email: email,
      password: password,
    },
    withCredentials: true,
  });
}

/**
 * Check whether we are already logged in
 * @return Promise.{isLoggedIn, username}
 */
function isLoggedIn() {
  return axios({
    url: Config.host + '/user/isLoggedin',
  });
}

/**
 * Sign out of a user
 * @return {Promise.<Object>} response data
 */
function logout() {
  return axios({
    url: Config.host + '/user/logout',
    method: 'post',
  });
}

export type RegistrationData = {
  email: string,
  username: string,
  password: string,
  company: string,
};

/**
 * Register a user with given info
 * @param user  user with email, username, password
 * @return Promise.<object>
 */
function register(user: RegistrationData, inviteKey?: string) {
  return axios({
    url: Config.host + `/user/register${inviteKey ? `?${inviteKey}` : ''}`,
    data: user,
    method: 'post',
  });
}

/**
 * Begin a password reset process
 * @param username    username of user to reset password for
 * @param email       email of user to reset password for
 * @return Promise.<object>
 */
function startResetPassword(username: string, email: string) {
  return axios({
    url: Config.host + '/user/startResetPassword',
    data: { username: username, email: email },
    method: 'post',
  });
}

/**
 * Activate a user's account so that they can use the
 * /use endpoint
 * @param username       username of account to activate
 * @param activationkey  secret activation key
 * @return Promise.<data>
 */
function activate(username: string, activationKey: string) {
  return axios({
    url: Config.host + '/user/activate/' + username + '/' + activationKey,
    method: 'post',
  });
}

/**
 * Check if a password reset token is valid
 * @param token       password reset token to use
 * @return Promise.<data>
 */
function isValidPasswordResetToken(token: string) {
  return axios({
    url: Config.host + '/user/isValidPasswordResetToken',
    method: 'get',
    params: { token: token },
  });
}

/**
 * Reset the password using a password reset token
 * @param token       password reset token to use
 * @param password    new password to use
 * @return Promise.<data>
 */
function resetPassword(token: string, password: string) {
  return axios({
    url: Config.host + '/user/resetPassword',
    method: 'post',
    data: { token: token, password: password },
  });
}

const exported = {
  login: login,
  isLoggedIn: isLoggedIn,
  logout: logout,
  register: register,
  activate: activate,
  startResetPassword: startResetPassword,
  isValidPasswordResetToken: isValidPasswordResetToken,
  resetPassword: resetPassword,
};

export default exported;
export {
  login,
  isLoggedIn,
  logout,
  register,
  activate,
  startResetPassword,
  isValidPasswordResetToken,
  resetPassword,
};
