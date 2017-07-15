'use strict';

import React from 'react';
import _ from 'lodash';

import NewUtils from './NewUtils';
import Tabs from './Tabs';
import AuthRedux from '../js/redux/Auth';
import Auth from '../js/Auth';
import Validate from '../js/Validate';

var tabOptions = {
  login: 'Sign in',
  register: 'Register'
};

var LoginForm = React.createClass({
  propTypes: {
    onLogin: React.PropTypes.func,
    onRegister: React.PropTypes.func,

    // Tab is controlled to allow LoginModal to adjust its size
    tab: React.PropTypes.oneOf(['login', 'register']),
    onTabChange: React.PropTypes.func.isRequired,

    // Injected
    login: React.PropTypes.func.isRequired,
    registerUser: React.PropTypes.func.isRequired,
    authLoading: React.PropTypes.bool.isRequired,
    authError: React.PropTypes.object
  },

  getInitialState: function() {
    return {
      form: {
        email: '',
        username: '',
        password: '',
        name: '',
        title: '',
        company: '',
        intendedUse: '',
        shouldContact: null
      },

      // These determine which errors to show
      blurred: {},
      hasSubmitErrors: false,

      loading: false,
      response: null
    };
  },

  login: function() {
    this.setState({ loading: false, response: null });
    this.props.login(this.state.form.email, this.state.form.password).then(function(data) {
      if (data.isLoggedIn) {
        this.props.onLogin();
      }
    }.bind(this));
  },

  register: function() {
    var errors = Validate.user(this.state.form);
    if (!_.isEmpty(errors)) {
      this.setState({ hasSubmitErrors: true, loading: false });
      return;
    }

    this.setState({ hasSubmitErrors: false, loading: false, response: null });
    this.props.registerUser(this.state.form).then(function(data) {
      if (data.isLoggedIn) {
        this.props.onRegister();
      }
    }.bind(this));
  },

  resetPassword: function() {
    Auth.startResetPassword(this.state.form.username, this.state.form.email)
      .then(NewUtils.getThen(this))
      .catch(NewUtils.getCatch(this));
  },

  submit: function(e) {
    if (e) e.preventDefault();

    this.setState({ loading: true, response: null });

    var activeTab = this.props.tab;
    if (activeTab === 'login') {
      this.login();
    } else if (activeTab === 'register') {
      this.register();
    } else if (activeTab === 'resetPassword') {
      this.resetPassword();
    }
  },

  render: function() {
    var activeTab = this.props.tab;
    var loading = this.state.loading || this.props.authLoading;

    var response = this.state.response || this.props.authError;
    var form = this.state.form;
    var blurred = this.state.blurred;
    var hasSubmitErrors = this.state.hasSubmitErrors;

    var activeVerb = null;
    switch (activeTab) {
      case 'login': activeVerb = 'Sign in'; break;
      case 'register': activeVerb = 'Register'; break;
      case 'resetPassword': activeVerb = 'Reset password'; break;
    }

    // Extra registration-only validation
    var errors = Validate.user(form);
    var visibleErrors = {};

    if (activeTab === 'register') {
      visibleErrors = _.clone(errors);
      if (!hasSubmitErrors) {
        // If we've tried submitting already, show all errors
        _.forEach(errors, function(error, key) {
          if (!blurred[key]) {
            delete visibleErrors[key];
          }
        });
      }
    }

    return (<div>
      <h1 className="wa-top0">{activeVerb}</h1>

      <div className="wa-bottom20">
        <Tabs tabs={tabOptions}
            value={activeTab}
            onChange={NewUtils.callProp(this, 'onTabChange')} />
      </div>

      <div className="row">
        <div className="col-sm-6 col-sm-pull-6">
          {NewUtils.renderResponse(response)}

          <form onSubmit={this.submit}>
            <div className={'form-group ' + (visibleErrors.email ? 'has-error' : '')}>
              <label htmlFor="email">Email{activeTab === 'login' && ' or username'}</label>
              <input type="text" id="email" className="form-control"
                  maxLength="128"
                  value={form.email}
                  onChange={NewUtils.update(this, 'form.email')}
                  onBlur={NewUtils.setState(this, 'blurred.email', true)} />
              {activeTab === 'register' && (
                <p className="help-block">
                  {visibleErrors.email || 'We will send an email here with an activation link.'}
                </p>
              )}
            </div>

            {(activeTab === 'register' || activeTab === 'resetPassword') && (
              <div className={'form-group ' + (visibleErrors.username ? 'has-error' : '')}>
                <label htmlFor="username">Username</label>
                <input type="username" id="username" className="form-control"
                    value={form.username}
                    onChange={NewUtils.update(this, 'form.username')}
                    onBlur={NewUtils.setState(this, 'blurred.username', true)} />
                {activeTab === 'register' && (
                  <p className="help-block">
                    {visibleErrors.username || <span>APIs you publish will be accessible at <code>(your username)/(repository)/(API name)</code></span>}
                  </p>
                )}
              </div>
            )}

            {(activeTab === 'register' || activeTab === 'login') && (
              <div className={'form-group ' + (visibleErrors.password ? 'has-error' : '')}>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" className="form-control"
                    value={form.password}
                    onChange={NewUtils.update(this, 'form.password')}
                    onBlur={NewUtils.setState(this, 'blurred.password', true)} />
                {activeTab === 'register' && (
                  <p className="help-block">
                    {visibleErrors.password || 'Choose a long, hard-to-guess password that you don\'t use anywhere else.'}
                  </p>
                )}
              </div>
            )}

            {hasSubmitErrors && (<div className="alert alert-danger">
              Some fields don't seem to be filled in correctly! Take a look at the error messages above.
            </div>)}

            <button className="btn btn-primary" type="submit"
                disabled={loading}>
              {activeVerb}
            </button>
            {activeTab === 'login' && (
              <a href="#" className="pull-right"
                  onClick={NewUtils.callProp(this, 'onTabChange', ['resetPassword'], true)}>
                Forgot password
              </a>
            )}
          </form>
        </div>
      </div>
    </div>);
  }
});

module.exports = AuthRedux.connect()(LoginForm);
