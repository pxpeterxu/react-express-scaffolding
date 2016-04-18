'use strict';

var React = require('react');
var _ = require('lodash');
var ReactRouter = require('react-router');

var ReactUtils = require('./ReactUtils');
var Config = require('../js/Config');
var Auth = require('../js/Auth');

var LoginPage = React.createClass({
  propTypes: {
    success: React.PropTypes.func
  },
  
  contextTypes: {
    history: React.PropTypes.object
  },
  
  getInitialState: function() {
    return {
      form: {
        email: '',
        username: '',
        password: '',
        password2: ''
      },
      loading: false,
      response: null,
      activeTab: 'login',
      blurredPassword2: false
        // Hide password2 error messages until user has edited it
    };
  },
  
  setDefaultTab: function(props) {
    var pathname = _.get(props, 'location.pathname');
    if (pathname === '/register') {
      this.setState({ activeTab: 'register' });
    } else {
      this.setState({ activeTab: 'login' });
    }
  },
  
  componentWillMount: function() {
    this.setDefaultTab(this.props);
  },
  
  componentWillReceiveProps: function(props) {
    this.setDefaultTab(props);
  },
  
  login: function() {
    Auth.login(this.state.form.email, this.state.form.password).then(function(data) {
      ReactUtils.defaultDone.call(this, data, null);
      
      if (data.success) {
        if (this.props.success) {
          this.props.success(data);
        }
        
        var redirect = _.get(this.props, 'location.query.redirect');
        if (redirect) {
          this.context.history.replaceState(null, redirect);
        }
      }
    }.bind(this)); 
  },
  
  register: function() {
    Auth.register(this.state.form)
      .then(ReactUtils.defaultDone.bind(this))
      .catch(ReactUtils.defaultFail.bind(this));
  },
  
  resetPassword: function() {
    Auth.startResetPassword(this.state.form.username, this.state.form.email)
      .then(ReactUtils.defaultDone.bind(this))
      .catch(ReactUtils.defaultFail.bind(this));
  },
  
  submit: function(e) {
    if (e) e.preventDefault();
    
    this.setState({ loading: true, response: null });
    
    var url = this.state.activeTab === 'login' ?
      Config.host + '/user/login' : 
      Config.host + '/user/register';
    
    var activeTab = this.state.activeTab;
    if (activeTab === 'login') {
      this.login();
    } else if (activeTab === 'register') {
      this.register();
    } else if (activeTab === 'resetPassword') {
      this.resetPassword();
    }
  },
  
  setActiveTab: function(tab, e) {
    if (e) e.preventDefault();
    
    this.setState({
      activeTab: tab,
      response: null,
      blurredPassword2: false
    });
  },
  
  render: function() {
    var response = this.state.response;
    var form = this.state.form;
    var activeTab = this.state.activeTab;
    
    var activeVerb = null;
    switch (activeTab) {
      case 'login': activeVerb = 'Sign in'; break;
      case 'register': activeVerb = 'Register'; break;
      case 'resetPassword': activeVerb = 'Reset password'; break;
    }
    
    // Extra registration-only validation
    var registerDisabled = activeTab === 'register' &&
      (form.password2 === '' || form.password !== form.password2);
    var showPassword2Error = form.password !== form.password2 &&
      (this.state.blurredPassword2 || form.password2 !== '');
    
    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
            {this.props.showLogo && (<div className="text-center top20">
              <img src="assets/logo-large.png" alt="WrapAPI logo" style={{ maxWidth: '100%', maxHeight: '75px' }} />
            </div>)}
            
            <h1>{activeVerb}</h1>
            <ul className="nav nav-tabs bottom20">
              <li className={activeTab === 'login' ? 'active' : null}>
                <a href="#" onClick={this.setActiveTab.bind(this, 'login')}>Sign in</a>
              </li>
              <li className={activeTab === 'register' ? 'active' : null}>
                <a href="#" onClick={this.setActiveTab.bind(this, 'register')}>Register</a>
              </li>
            </ul>
            
            {ReactUtils.defaultRenderMessages(response)}
            
            <form onSubmit={this.submit}>
              <div className="form-group">
                <label htmlFor="email">Email{activeTab === 'login' && ' or username'}</label>
                <input type="text" id="email" className="form-control"
                  maxLength="128"
                  value={form.email}
                  onChange={ReactUtils.updateFormField(this, 'form.email')}
                  />
                {activeTab === 'register' && (
                  <p className="help-block">
                    We will send an email here with an activation link.
                  </p>
                )}
              </div>
              
              {(activeTab === 'register' || activeTab === 'resetPassword') && (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input type="username" id="username" className="form-control"
                    value={form.username}
                    onChange={ReactUtils.updateFormField(this, 'form.username')}
                    />
                </div>
              )}
              
              {(activeTab === 'register' || activeTab === 'login') && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input type="password" id="password" className="form-control"
                    value={form.password}
                    onChange={ReactUtils.updateFormField(this, 'form.password')}
                    />
                  {activeTab === 'register' && (
                    <p className="help-block">
                      Choose a long, hard-to-guess password that you don't use anywhere else.
                    </p>
                  )}
                </div>
              )}
              
              {activeTab === 'register' && (
                <div className={'form-group ' +
                    (showPassword2Error ? 'has-error' : '')}>
                  <label htmlFor="password2">Password again</label>
                  <input type="password" id="password2" className="form-control"
                    value={form.password2}
                    onChange={ReactUtils.updateFormField(this, 'form.password2')}
                    onBlur={ReactUtils.setState.bind(this, 'blurredPassword2', true)}
                    />
                  <p className="help-block">
                    {showPassword2Error ?
                      'The two passwords you entered do not match; please try again.' :
                      'Enter your password again to ensure that you entered it correctly and won\'t be locked out of your account.'}
                  </p>
                </div>
              )}
              
              <button className="btn btn-primary" type="submit"
                  disabled={this.state.loading || registerDisabled}>
                {activeVerb}
              </button>
              {activeTab === 'login' && (
                <a href="#" className="pull-right"
                    onClick={ReactUtils.setState.bind(this, 'activeTab', 'resetPassword')}>
                  Forgot password
                </a>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = LoginPage;
