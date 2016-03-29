'use strict';

var React = require('react');

var LoginPage = require('./LoginPage');
var Auth = require('../js/Auth');

// This component will do a login
var LoginGate = React.createClass({
  getInitialState: function() {
    return {
      loggedIn: null
    };
  },
    
  componentWillMount: function() {
    Auth.isLoggedIn().then(function(data) {
      if (data.success) {
        this.setState({
          loggedIn: data.loggedIn,
          username: data.username
        });
      }
    }.bind(this)).catch(function(err) {
      console.log(err);
      this.setState({ loggedIn: false });
    }.bind(this));
  },
  
  loginSuccess: function(data) {
    this.setState({
      loggedIn: true,
      username: data.username
    });
  },
  
  logout: function() {
    Auth.logout().then(function(data) {
      if (data.success) {
        this.setState({ loggedIn: false });
      } else {
        throw data;
      }
      
      return data;
    }.bind(this));
  },
  
  render: function() {
    var component = this.props.componentOnceLoggedIn;
    
    if (this.state.loggedIn === null) {
      return <div>Please wait... loading your account</div>;
    } else if (!this.state.loggedIn) {
      return (
        <LoginPage
          success={this.loginSuccess}
          showLogo={this.props.showLogo} />
      );
    } else {
      return React.createElement(component, {
        username: this.state.username,
        logout: this.logout
      });
    };
  }
});

module.exports = LoginGate;
