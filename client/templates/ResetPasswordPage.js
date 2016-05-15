'use strict';

var React = require('react');
var axios = require('axios');
var Link = require('react-router').Link;

var Auth = require('../js/Auth');
var Config = require('../js/Config');
var ReactUtils = require('./ReactUtils');

var ResetPasswordPage = React.createClass({
  getInitialState: function() {
    return {
      loading: true,
      isValid: null,
      response: null,
      
      password: '',
      password2: '',
      curPassword: '',
      blurredPassword2: false,
      
      passwordChanged: false
    }
  },
  
  checkToken: function(props) {
    var props = props.params || props;
    var token = props.token;
    
    this.setState({
      loading: true,
      response: null,
      isValid: null
    });
    
    if (token) {    
      axios({
        url: Config.host + '/user/isValidPasswordResetToken',
        method: 'GET',
        params: { token: token }
      })
        .then(function(response) {
          var data = response.data;
          
          this.state.loading = false;
          this.state.isValid = data.isValid;
          if (!data.isValid) {
            this.state.response = {
              success: false,
              messages: ['The password reset link you followed has expired or is invalid. Please go to the Sign In page to request another one']
            };
          }
          this.setState(this.state);
          
        }.bind(this))
        .catch(ReactUtils.defaultFail.bind(this));
    } else {
      Auth.isLoggedIn().then(function(data) {
        this.state.loading = false;
        this.state.isValid = data.loggedIn;
        if (!data.loggedIn) {
            this.state.response = {
              success: false,
              messages: ['You must be logged in to change your password']
            };
          }
          this.setState(this.state);
      }.bind(this));
    }
  },
  
  componentWillMount: function() {
    this.checkToken(this.props);
  },
  
  componentWillReceiveProps: function(props) {
    if (props.token !== this.props.token) {
      this.checkToken(props); 
    }
  },
  
  resetPassword: function(e) {
    e.preventDefault();
    this.setState({ loading: true, response: null });
    
    var props = this.props.params || this.props;
    var token = props.token;
    
    var req = token ?    
      rp({
        url: Config.host + '/user/resetPassword',
        method: 'POST',
        body: { token: props.token, password: this.state.password }
      }) : 
      rp({
        url: Config.host + '/user/changePassword',
        method: 'POST',
        body: { curPassword: this.state.curPassword, password: this.state.password }
      });
      
    req.then(function(data) {
        if (data.success && token) {
          // Add extra link if successful
          data.messages.push(<span>
            <Link to="/login">Sign in with your new password</Link>.
          </span>);
          this.setState({ passwordChanged: true });
        }
        
        ReactUtils.defaultDone.call(this, data);
      }.bind(this))
      .catch(ReactUtils.defaultFail.bind(this));
  },
  
  render: function() {
    var password = this.state.password;
    var password2 = this.state.password2;
    var blurredPassword2 = this.state.blurredPassword2;
    var loading = this.state.loading;
    var response = this.state.response;

    var props = this.props.params || this.props;
    var token = props.token;
    var verb = token ? 'reset' : 'change';
    
    var enableSubmit = password === password2 &&
      password && password2 && !loading && !this.state.passwordChanged;
      // Disable if missing inputs, loading, or already done
    var showPassword2Error = password !== password2 &&
      (blurredPassword2 || password2 !== '');
    
    return (
      <div className="container"><div className="row">
        <div className="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
          <h1>{token ? 'Reset' : 'Change'} your password</h1>
          
          {(loading && this.state.isValid === null) ? (        
            <div className="text-center">
              <p>Please wait while we check if you can {verb} your password:</p>
              <img src="assets/loading.gif" alt="Loading..." />
            </div>
          ) : (<div>
          
            {ReactUtils.defaultRenderMessages(response)}
            
            {this.state.isValid && (
              <form onSubmit={this.resetPassword}>
                {!token && (
                  <div className="form-group">
                    <label htmlFor="curPassword">Current password</label>
                    <input type="password" id="curPassword" className="form-control"
                      value={this.state.curPassword}
                      onChange={ReactUtils.updateFormField(this, 'curPassword')}
                      />
                    <p className="help-block">
                      Confirm your current account password to make changes.
                    </p>
                  </div>
                )}
              
                <div className="form-group">
                  <label htmlFor="password">New password</label>
                  <input type="password" id="password" className="form-control"
                    value={password}
                    onChange={ReactUtils.updateFormField(this, 'password')}
                    />
                  <p className="help-block">
                    Choose a long, hard-to-guess password that you don't use anywhere else.
                  </p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">New password again</label>
                  <input type="password" id="password2" className="form-control"
                    value={password2}
                    onChange={ReactUtils.updateFormField(this, 'password2')}
                    onBlur={ReactUtils.setState.bind(this, 'blurredPassword2', true)}
                    />
                </div>
                
                <button className="btn btn-primary" type="submit"
                    disabled={!enableSubmit}>
                  Set new password
                </button>
              </form>
            )}
          </div>)}
        </div>
      </div></div>
    );
  }
});

module.exports = ResetPasswordPage;
