// @flow
import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { withRouter } from 'react-router';

import Navbar from 'react-bootstrap/lib/Navbar';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';

import Auth, { type InjectedProps } from '../js/redux/Auth';

type Props = {
  router: {
    push: Function,
  },
} & InjectedProps;

/**
 * This component is the user display (e.g., "Username | Sign out" or
 * "Sign in" that can be slotted into any display
 */
class NavbarUser extends React.PureComponent<Props> {
  logout = () => {
    this.props.logout().then(() => {
      this.props.router.push('/');
    });
  };

  render() {
    const isLoggedIn = this.props.isLoggedIn;
    const username = this.props.username;
    const logoutLoading = this.props.authLoading;

    if (isLoggedIn) {
      return (
        <Nav pullRight>
          <Navbar.Text>
            <strong>{username}</strong>
          </Navbar.Text>
          <NavItem href="#" onClick={this.logout} disabled={logoutLoading}>
            {logoutLoading ? 'Loading' : 'Sign out'}
          </NavItem>
        </Nav>
      );
    } else {
      return (
        <Nav pullRight>
          <LinkContainer to={{ pathname: '/login', query: { redirect: '/' } }}>
            <NavItem>Register or sign in</NavItem>
          </LinkContainer>
        </Nav>
      );
    }
  }
}

export default Auth.connect()(withRouter(NavbarUser));
