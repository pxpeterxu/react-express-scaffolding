import React from 'react';
import PropTypes from 'prop-types';

import Auth from '../js/redux/Auth';
import LoginPage from './LoginPage';

// This component will do a login
class LoginGate extends React.PureComponent {
  static propTypes = {
    updateLocalTutorialStep: PropTypes.func.isRequired,
    componentOnceLoggedIn: PropTypes.any.isRequired,
    showLogo: PropTypes.bool,

    // Injected
    logout: PropTypes.func.isRequired,
    username: PropTypes.string,
    authStateLoaded: PropTypes.bool.isRequired,
    isLoggedIn: PropTypes.bool.isRequired
  };

  componentWillMount() {
    // Fetch current logged-in user
    Auth.getOrFetchLoginState(this.props);
  }

  render() {
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
}

export default Auth.connect()(LoginGate);
