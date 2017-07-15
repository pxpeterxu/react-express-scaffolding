import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import NewUtils from './NewUtils';
import Tabs from './Tabs';
import AuthRedux from '../js/redux/Auth';
import Auth from '../js/Auth';
import Validate from '../js/Validate';

const tabOptions = {
  login: 'Sign in',
  register: 'Register'
};

class LoginForm extends React.PureComponent {
  static propTypes = {
    onLogin: PropTypes.func,
    onRegister: PropTypes.func,

    // Tab is controlled to allow LoginModal to adjust its size
    tab: PropTypes.oneOf(['login', 'register']),
    onTabChange: PropTypes.func.isRequired,

    // Injected
    login: PropTypes.func.isRequired,
    registerUser: PropTypes.func.isRequired,
    authLoading: PropTypes.bool.isRequired,
    authError: PropTypes.object
  };

  state = {
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

  login = () => {
    this.setState({ loading: false, response: null });
    this.props.login(this.state.form.email, this.state.form.password).then((data) => {
      if (data.isLoggedIn) {
        this.props.onLogin();
      }
    });
  };

  register = () => {
    const errors = Validate.user(this.state.form);
    if (!_.isEmpty(errors)) {
      this.setState({ hasSubmitErrors: true, loading: false });
      return;
    }

    this.setState({ hasSubmitErrors: false, loading: false, response: null });
    this.props.registerUser(this.state.form).then((data) => {
      if (data.isLoggedIn) {
        this.props.onRegister();
      }
    });
  };

  resetPassword = () => {
    Auth.startResetPassword(this.state.form.username, this.state.form.email)
      .then(NewUtils.getThen(this))
      .catch(NewUtils.getCatch(this));
  };

  submit = (e) => {
    if (e) e.preventDefault();

    this.setState({ loading: true, response: null });

    const activeTab = this.props.tab;
    if (activeTab === 'login') {
      this.login();
    } else if (activeTab === 'register') {
      this.register();
    } else if (activeTab === 'resetPassword') {
      this.resetPassword();
    }
  };

  render() {
    const activeTab = this.props.tab;
    const loading = this.state.loading || this.props.authLoading;

    const response = this.state.response || this.props.authError;
    const form = this.state.form;
    const blurred = this.state.blurred;
    const hasSubmitErrors = this.state.hasSubmitErrors;

    let activeVerb = null;
    switch (activeTab) {
      case 'login': activeVerb = 'Sign in'; break;
      case 'register': activeVerb = 'Register'; break;
      case 'resetPassword': activeVerb = 'Reset password'; break;
    }

    // Extra registration-only validation
    const errors = Validate.user(form);
    let visibleErrors = {};

    if (activeTab === 'register') {
      visibleErrors = _.clone(errors);
      if (!hasSubmitErrors) {
        // If we've tried submitting already, show all errors
        _.forEach(errors, (error, key) => {
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

      {NewUtils.renderResponse(response)}

      <form onSubmit={this.submit}>
        <div className={'form-group ' + (visibleErrors.email ? 'has-error' : '')}>
          <label htmlFor="email">Email{activeTab === 'login' && ' or username'}</label>
          <input type="text"
              id="email"
              className="form-control"
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
            <input type="username"
                id="username"
                className="form-control"
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
            <input type="password"
                id="password"
                className="form-control"
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

        <button className="btn btn-primary"
            type="submit"
            disabled={loading}>
          {activeVerb}
        </button>
        {activeTab === 'login' && (
          <a href="#forgotPassword"
              className="pull-right"
              onClick={NewUtils.callProp(this, 'onTabChange', ['resetPassword'], true)}>
            Forgot password
          </a>
        )}
      </form>
    </div>);
  }
}

export default AuthRedux.connect()(LoginForm);
