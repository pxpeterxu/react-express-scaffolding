// @flow
import React from 'react';
import _ from 'lodash';
import {
  callProp,
  update,
  setState,
  getThen,
  getCatch,
  renderResponse,
} from 'react-updaters';

import Tabs from './Tabs';
import AuthRedux, { type InjectedProps } from '../js/redux/Auth';
import Auth from '../js/Auth';
import Validate from '../js/Validate';
import type { Response } from '../../common/Types';

const tabOptions = {
  login: 'Sign in',
  register: 'Register',
};

type Tab = 'login' | 'register';

type Props = {
  onLogin: () => mixed,
  onRegister: Response => mixed,

  /** Tab is controlled to allow the containing element adjust its size */
  tab: Tab,
  onTabChange: Tab => mixed,
} & InjectedProps;

type State = {
  form: {
    email: string,
    username: string,
    password: string,
    company: string,
  },

  blurred: { [string]: boolean },
  hasSubmitErrors: boolean,
  loading: boolean,
  response: ?Response,
};

class LoginForm extends React.PureComponent<Props, State> {
  state = {
    form: {
      email: '',
      username: '',
      password: '',
      company: '',
    },

    // These determine which errors to show
    blurred: {},
    hasSubmitErrors: false,

    loading: false,
    response: null,
  };

  login = () => {
    this.setState({ loading: false, response: null });
    this.props
      .login(this.state.form.email, this.state.form.password)
      .then(data => {
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
    this.props.registerUser(this.state.form).then(data => {
      if (data.isLoggedIn) {
        this.props.onRegister(data);
      }
    });
  };

  resetPassword = () => {
    Auth.startResetPassword(this.state.form.username, this.state.form.email)
      .then(getThen(this))
      .catch(getCatch(this));
  };

  submit = e => {
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
      case 'login':
        activeVerb = 'Sign in';
        break;
      case 'register':
        activeVerb = 'Register';
        break;
      case 'resetPassword':
        activeVerb = 'Reset password';
        break;
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

    return (
      <div>
        <h1 className="top0">{activeVerb}</h1>

        <div className="bottom20">
          <Tabs
            tabs={tabOptions}
            value={activeTab}
            onChange={callProp(this, 'onTabChange')}
          />
        </div>

        {renderResponse(response)}

        <form onSubmit={this.submit}>
          <div
            className={'form-group ' + (visibleErrors.email ? 'has-error' : '')}
          >
            <label htmlFor="email">
              Email{activeTab === 'login' && ' or username'}
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              maxLength="128"
              autoComplete="email"
              value={form.email}
              onChange={update(this, 'form.email')}
              onBlur={setState(this, 'blurred.email', true)}
            />
            {activeTab === 'register' && (
              <p className="help-block">
                {visibleErrors.email ||
                  'We will send an email here with an activation link.'}
              </p>
            )}
          </div>

          {(activeTab === 'register' || activeTab === 'resetPassword') && (
            <div
              className={
                'form-group ' + (visibleErrors.username ? 'has-error' : '')
              }
            >
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                autoComplete="username"
                value={form.username}
                onChange={update(this, 'form.username')}
                onBlur={setState(this, 'blurred.username', true)}
              />
            </div>
          )}

          {(activeTab === 'register' || activeTab === 'login') && (
            <div
              className={
                'form-group ' + (visibleErrors.password ? 'has-error' : '')
              }
            >
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                autoComplete={
                  activeTab === 'register' ? 'new-password' : 'current-password'
                }
                value={form.password}
                onChange={update(this, 'form.password')}
                onBlur={setState(this, 'blurred.password', true)}
              />
              {activeTab === 'register' && (
                <p className="help-block">
                  {visibleErrors.password ||
                    "Choose a long, hard-to-guess password that you don't use anywhere else."}
                </p>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="form-group">
              <label htmlFor="company">Company name</label>
              <input
                type="text"
                id="company"
                className="form-control"
                autoComplete="organization"
                value={form.company}
                onChange={update(this, 'form.company')}
                onBlur={setState(this, 'blurred.company', true)}
              />
            </div>
          )}

          {hasSubmitErrors && (
            <div className="alert alert-danger">
              Some fields don't seem to be filled in correctly! Take a look at
              the error messages above.
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {activeVerb}
          </button>
          {activeTab === 'login' && (
            <a
              href="#forgotPassword"
              className="pull-right"
              onClick={callProp(this, 'onTabChange', ['resetPassword'], true)}
            >
              Forgot password
            </a>
          )}
        </form>
      </div>
    );
  }
}

export default AuthRedux.connect()(LoginForm);
