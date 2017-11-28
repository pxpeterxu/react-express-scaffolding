import React from 'react';
import PropTypes from 'prop-types';
import Navbar from 'react-bootstrap/lib/Navbar';
import Nav from 'react-bootstrap/lib/Nav';

import NavbarUser from './NavbarUser';

class MainPage extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
    router: PropTypes.object.isRequired,

    // Redux injected
    isLoggedIn: PropTypes.bool,
  };

  render() {
    return (
      <div>
        <Navbar fixedTop>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#/">
                Site Name
              </a>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav pullLeft>
            </Nav>
            <NavbarUser />
          </Navbar.Collapse>
        </Navbar>

        <div className="navbar-offset">
          {this.props.children}
        </div>

        <footer className="footer">
          <div className="container">
            <p>
              <span className="pull-left">Created by YOUR NAME</span>
              <span className="pull-left" style={{ marginLeft: 20 }}>Email: email@example.com</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }
}

export default MainPage;
