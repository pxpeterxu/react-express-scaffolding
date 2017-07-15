import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { withRouter } from 'react-router';

import NewUtils from './NewUtils';
import LoginForm from './LoginForm';

class LoginPage extends React.PureComponent {
  static propTypes = {
    showLogo: PropTypes.bool,

    // Injected
    location: PropTypes.object,
    router: PropTypes.object,
  };

  state = {
    tab: 'login',
    registrationResponse: null
  };

  setTabFromUrl = (props) => {
    const pathname = _.get(props, 'location.pathname');
    if (pathname === '/register') {
      this.setState({ tab: 'register' });
    } else {
      this.setState({ tab: 'login' });
    }
  };

  componentWillMount() {
    this.setTabFromUrl(this.props);
  }

  componentWillReceiveProps(props) {
    this.setTabFromUrl(props);
  }

  onLogin = () => {
    const redirect = _.get(this.props, 'location.query.redirect');
    if (redirect) {
      this.props.router.push(redirect);
    }
  };

  onRegister = (data) => {
    this.setState({ registrationResponse: data });
  };

  render() {
    const showLogo = this.props.showLogo;
    const registrationResponse = this.state.registrationResponse;
    const tab = this.state.tab;

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
}

export default withRouter(LoginPage);
