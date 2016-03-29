'use strict';

var React = require('react');
var _ = require('lodash');
var ReactRouter = require('react-router');

var ReactUtils = require('./ReactUtils');
var Auth = require('../js/Auth');

var LoginPage = React.createClass({
  contextTypes: {
    history: React.PropTypes.object
  },
  
  getInitialState: function() {
    return {
      form: {
        email: '',
        username: '',
        password: ''
      },
      loading: false,
      response: null,
      activeTab: 'login'
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
  
  submit: function(e) {
    if (e) e.preventDefault();
    
    this.setState({ loading: true, response: null });
    
    if (this.state.activeTab === 'login') {
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
    } else {
      Auth.register(this.state.form)
        .then(ReactUtils.defaultDone.bind(this))
        .catch(ReactUtils.defaultFail.bind(this));
    }
  },
  
  setActiveTab: function(tab, e) {
    if (e) e.preventDefault();
    
    this.setState({ activeTab: tab, response: null });
  },
  
  render: function() {
    var response = this.state.response;
    var form = this.state.form;
    var activeTab = this.state.activeTab;
    
    var activeVerb = activeTab === 'login' ? 'Sign in' : 'Register';
    
    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
            <h1>{activeVerb}</h1>
            <ul className="nav nav-tabs bottom20">
              <li className={activeTab === 'login' ? 'active' : null}>
                <a href="#" onClick={this.setActiveTab.bind(this, 'login')}>Sign in</a>
              </li>
              <li className={activeTab === 'register' ? 'active' : null}>
                <a href="#" onClick={this.setActiveTab.bind(this, 'register')}>Register</a>
              </li>
            </ul>
            
            {ReactUtils.defaultRenderMessages(this.state.response)}

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
              
              {activeTab === 'register' && (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input type="username" id="username" className="form-control"
                    value={form.username}
                    onChange={ReactUtils.updateFormField(this, 'form.username')}
                    />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" className="form-control"
                  value={form.password}
                  onChange={ReactUtils.updateFormField(this, 'form.password')}
                  />
                {activeTab === 'register' && (
                  <p className="help-block">
                    Choose a good, unique password!
                  </p>
                )}
              </div>
              <button className="btn btn-primary" type="submit"
                  disabled={this.state.loading}>
                {activeVerb}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = LoginPage;
