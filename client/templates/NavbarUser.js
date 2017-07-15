import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { LinkContainer } from 'react-router-bootstrap';
import { withRouter } from 'react-router';

import Navbar from 'react-bootstrap/lib/Navbar';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';

import Auth from '../js/redux/Auth';

/**
 * This component is the user display (e.g., "Username | Sign out" or
 * "Sign in" that can be slotted into any display
 */
const NavbarUser = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    // withRouter injected
    router: React.PropTypes.object,

    // Redux injected
    isLoggedIn: React.PropTypes.bool,
    username: React.PropTypes.string,
    authLoading: React.PropTypes.bool.isRequired,
    logout: React.PropTypes.func
  },

  logout: function() {
    this.props.logout().then(() => {
      this.props.router.push('/');
    });
  },

  render: function() {
    const isLoggedIn = this.props.isLoggedIn;
    const username = this.props.username;
    const logoutLoading = this.props.authLoading;

    if (isLoggedIn) {
      return (
        <Nav pullRight>
          <Navbar.Text><strong>{username}</strong></Navbar.Text>
          <NavItem href="#"
              onClick={this.logout}
              disabled={logoutLoading}>
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
});

export default Auth.connect()(withRouter(NavbarUser));
