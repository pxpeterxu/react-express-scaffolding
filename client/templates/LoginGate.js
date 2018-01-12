// @flow
import React from 'react';

import Auth, { type InjectedProps } from '../js/redux/Auth';
import LoginPage from './LoginPage';

type Props = {
  componentOnceLoggedIn: Class<React.Component<*, *>>,
  showLogo: boolean,
} & InjectedProps;

// This component will do a login
class LoginGate extends React.PureComponent<Props> {
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
