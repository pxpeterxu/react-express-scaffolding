// @flow
import React from 'react';
import { getThen, getCatch, renderResponse } from 'react-updaters';

import Auth from '../js/Auth';
import type { Response } from '../../common/Types';

type Props = {
  params: {
    activationKey: string,
    username: string,
  },
};

type State = {
  loading: boolean,
  response: ?Response,
};

class ActivatePage extends React.PureComponent<Props, State> {
  state = {
    loading: true,
    response: null,
  };

  componentWillMount() {
    const { username, activationKey } = this.props.params;

    this.setState({ loading: true, response: null });

    Auth.activate(username, activationKey)
      .then(getThen(this))
      .catch(getCatch(this));
  }

  render() {
    return (
      <div className="container">
        <h1>Activating your account</h1>

        {this.state.loading && (
          <div className="text-center">
            <p>Please wait while we try to activate your account:</p>
            <i className="fa fa-circle-o-notch fa-spin fa-3x" />
          </div>
        )}

        {renderResponse(this.state.response)}
      </div>
    );
  }
}

export default ActivatePage;
