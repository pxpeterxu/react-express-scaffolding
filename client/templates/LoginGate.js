'use strict';

import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import Auth from '../js/redux/Auth';
import NewUtils from './NewUtils';
import LoginPage from './LoginPage';

// This component will do a login
var LoginGate = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    updateLocalTutorialStep: React.PropTypes.func.isRequired,
    componentOnceLoggedIn: React.PropTypes.any.isRequired,
    showLogo: React.PropTypes.bool,

    // Injected
    logout: React.PropTypes.func.isRequired,
    username: React.PropTypes.string,
    authStateLoaded: React.PropTypes.bool.isRequired,
    isLoggedIn: React.PropTypes.bool.isRequired
  },

  componentWillMount: function() {
    // Fetch current logged-in user
    Auth.getOrFetchLoginState(this.props);
  },

  render: function() {
    var component = this.props.componentOnceLoggedIn;
    var logout = this.props.logout;
    var username = this.props.username;
    var authStateLoaded = this.props.authStateLoaded;
    var isLoggedIn = this.props.isLoggedIn;

    if (!authStateLoaded) {
      return <div>Please wait... loading your account</div>;
    } else if (!isLoggedIn) {
      return (
        <LoginPage
            showLogo={this.props.showLogo} />
      );
    } else {
      return React.createElement(component, {
        username: username,
        logout: logout
      });
    }
  }
});

module.exports = Auth.connect()(LoginGate);
