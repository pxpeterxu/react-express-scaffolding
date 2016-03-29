'use strict';

var React = require('react');
var router = require('react-router');
var ReactBootstrap = require('react-bootstrap');

var Auth = require('../js/Auth');
var ReactUtils = require('./ReactUtils');

var Navbar = ReactBootstrap.Navbar;
var Nav = ReactBootstrap.Nav;
var NavItem = ReactBootstrap.NavItem;

var OverlayTrigger = ReactBootstrap.OverlayTrigger;
var Tooltip = ReactBootstrap.Tooltip;

var Link = router.Link;

var MainPage = React.createClass({
  contextTypes: {
    history: React.PropTypes.object.isRequired
  },
  
  getInitialState: function() {
    return {
      loggedIn: false,
      search: '',
      
      isChrome: false,
      pluginInstalled: false
    };
  },
  
  componentWillMount: function() {
    Auth.onLogin['MainPage'] = this.onLogin;
    
    Auth.isLoggedIn().then(function(data) {
      if (data.success) {
        this.setState({
          loggedIn: data.loggedIn,
          username: data.username
        });
      }
    }.bind(this)).catch(function(data) {
      this.setState({ loggedIn: false });
    }.bind(this));
  },
  
  onLogin: function(data) {
    this.setState({
      loggedIn: true,
      username: data.username
    });
  },
  
  logout: function(e) {
    if (e) e.preventDefault();
    
    this.setState({ logoutLoading: true });
    
    Auth.logout().then(function(data) {
      if (data.success) {
        this.setState({
          logoutLoading: false,
          loggedIn: false,
          username: null
        });
        this.context.history.replaceState(null, '/');
      }
    }.bind(this)).catch(function(data) {
      this.setState({ logoutLoading: false });
    }.bind(this));
  },
  
  render: function() {
    var loggedIn = this.state.loggedIn;
    var username = this.state.username;
    var logoutLoading = this.state.logoutLoading;
    
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
            {loggedIn ? (  
              <Nav pullRight>
                <Navbar.Text><strong>{username}</strong></Navbar.Text>
                <NavItem href="#" onClick={this.logout}
                    disabled={logoutLoading}>
                  {logoutLoading ? 'Signing out...' : 'Sign out'}
                </NavItem>
              </Nav>
            ) : (
              <Nav pullRight>
                <NavItem href="#/login?redirect=/">Register or sign in</NavItem>
              </Nav>
            )}
          </Navbar.Collapse>
        </Navbar>
        
        <div className="navbar-offset">
          {this.props.children}
        </div>
        
        <footer className="footer">
          <div className="container">
            <p>
              <span className="pull-left">Created by YOUR NAME</span>
              <span className="pull-left" style={{marginLeft: 20}}>Email: email@example.com</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }
});

module.exports = MainPage;
