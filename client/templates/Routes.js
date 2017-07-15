'use strict';

import React from 'react';
import { Route, IndexRoute } from 'react-router';

import MainPage from './MainPage';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import ActivatePage from './ActivatePage';
import ResetPasswordPage from './ResetPasswordPage';

module.exports = (requireLoggedIn) => (
  <Route path="/" component={MainPage}>
    <IndexRoute component={HomePage} />
    <Route path="/index" component={HomePage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/register" component={LoginPage} />
    <Route path="/startResetPassword" component={LoginPage} />
    <Route path="/resetPassword/:username/:token" component={ResetPasswordPage} />
    <Route path="/activate/:username/:activationKey" component={ActivatePage} />
    <Route path="/changePassword" component={ResetPasswordPage} onEnter={requireLoggedIn} />
  </Route>
);
