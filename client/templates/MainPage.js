import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import Navbar from 'react-bootstrap/lib/Navbar';
import Nav from 'react-bootstrap/lib/Nav';

import NavbarUser from './NavbarUser';

const MainPage = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    children: React.PropTypes.node,
    router: React.PropTypes.object.isRequired,

    // Redux injected
    isLoggedIn: React.PropTypes.bool,
  },

  render: function() {
    return (
      <div>
        <Navbar fixedTop>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#/">
                Site name
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
});

export default MainPage;
