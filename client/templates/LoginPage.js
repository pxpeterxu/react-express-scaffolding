// @flow
import React from 'react';
import _ from 'lodash';
import { withRouter } from 'react-router';
import { update, renderResponse } from 'react-updaters';
import LoginForm from './LoginForm';
import type { Response } from '../../common/Types';

type Props = {
  showLogo: boolean,
  location: {
    pathname: string,
    query: {
      redirect?: string,
    },
  },
  router: {
    push: Function,
  },
};

type Tab = 'register' | 'login';

type State = {
  tab: Tab,
  registrationResponse: ?Response,
};

class LoginPage extends React.PureComponent<Props, State> {
  state = {
    tab: 'login',
    registrationResponse: null,
  };

  setTabFromUrl = props => {
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

  onRegister = data => {
    this.setState({ registrationResponse: data });
  };

  render() {
    const showLogo = this.props.showLogo;
    const registrationResponse = this.state.registrationResponse;
    const tab = this.state.tab;

    if (registrationResponse && registrationResponse.success) {
      return (
        <div className="container">
          <h1>Register</h1>
          {renderResponse(registrationResponse)}
        </div>
      );
    }

    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-6 col-sm-offset-3">
            <div className="top20">
              <LoginForm
                onLogin={this.onLogin}
                onRegister={this.onRegister}
                showLogo={showLogo}
                tab={tab}
                onTabChange={update(this, 'tab')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(LoginPage);
