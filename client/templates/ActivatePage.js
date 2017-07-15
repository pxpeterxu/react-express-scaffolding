import React from 'react';

import Auth from '../js/Auth';
import NewUtils from './NewUtils';

class ActivatePage extends React.PureComponent {
  state = {
    activated: false,
    loading: true,

    pluginInstalled: false,
    isChrome: true
  };

  componentWillMount() {
    const activationKey = this.props.params ?
      this.props.params.activationKey : this.props.activationKey;
    const username = this.props.params ? this.props.params.username : this.props.username;

    this.setState({ loading: true, response: null });

    Auth.activate(username, activationKey)
      .then(NewUtils.getThen(this))
      .catch(NewUtils.getCatch(this));
  }

  render() {
    return (
      <div className="container">
        <h1>Activating your account</h1>

        {this.state.loading && (
          <div className="text-center">
            <p>Please wait while we try to activate your account:</p>
            <i className="fa fa-circle-o-notch fa-spin fa-3x"></i>
          </div>
        )}

        {NewUtils.renderResponse(this.state.response)}
      </div>
    );
  }
}

export default ActivatePage;
