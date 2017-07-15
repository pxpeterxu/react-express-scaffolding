'use strict';

import React from 'react';
import _ from 'lodash';
import { withRouter } from 'react-router';

import NewUtils from './NewUtils';
import LoginForm from './LoginForm';

var LoginPage = React.createClass({
  propTypes: {
    showLogo: React.PropTypes.bool,

    // Injected
    location: React.PropTypes.object,
    router: React.PropTypes.object,
  },

  getInitialState: function() {
    return {
      tab: 'login',
      registrationResponse: null
    };
  },

  setTabFromUrl: function(props) {
    var pathname = _.get(props, 'location.pathname');
    if (pathname === '/register') {
      this.setState({ tab: 'register' });
    } else {
      this.setState({ tab: 'login' });
    }
  },

  componentWillMount: function() {
    this.setTabFromUrl(this.props);
  },

  componentWillReceiveProps: function(props) {
    this.setTabFromUrl(props);
  },

  onLogin: function() {
    var redirect = _.get(this.props, 'location.query.redirect');
    if (redirect) {
      this.props.router.push(redirect);
    }
  },

  onRegister: function(data) {
    this.setState({ registrationResponse: data });
  },

  render: function() {
    var showLogo = this.props.showLogo;
    var registrationResponse = this.state.registrationResponse;
    var tab = this.state.tab;

    if (registrationResponse && registrationResponse.success) {
      return (<div className="container">
        <h1>Register</h1>
        {NewUtils.renderResponse(registrationResponse)}
      </div>);
    }

    return (<div className="container">
      <div className="row"><div className={tab === 'register' ? 'col-sm-12' : 'col-sm-6 col-sm-offset-3'}>
        <div className="wa-top20">
          <LoginForm onLogin={this.onLogin}
              onRegister={this.onRegister}
              showLogo={showLogo}
              tab={tab}
              onTabChange={NewUtils.update(this, 'tab')} />
        </div>
      </div></div>
    </div>);
  }
});

module.exports = withRouter(LoginPage);
