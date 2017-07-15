import React from 'react';
import PropTypes from 'prop-types';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import Auth from '../js/redux/Auth';
import LoginPage from './LoginPage';

// This component will do a login
const LoginGate = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    updateLocalTutorialStep: PropTypes.func.isRequired,
    componentOnceLoggedIn: PropTypes.any.isRequired,
    showLogo: PropTypes.bool,

    // Injected
    logout: PropTypes.func.isRequired,
    username: PropTypes.string,
    authStateLoaded: PropTypes.bool.isRequired,
    isLoggedIn: PropTypes.bool.isRequired
  },

  componentWillMount: function() {
    // Fetch current logged-in user
    Auth.getOrFetchLoginState(this.props);
  },

  render: function() {
    const component = this.props.componentOnceLoggedIn;
    const logout = this.props.logout;
    const username = this.props.username;
    const authStateLoaded = this.props.authStateLoaded;
    const isLoggedIn = this.props.isLoggedIn;

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

export default Auth.connect()(LoginGate);
