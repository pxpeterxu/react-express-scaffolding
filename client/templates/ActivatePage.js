'use strict';

import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import Auth from '../js/Auth';
import Utility from '../js/Utility';
import Config from '../js/Config';

import NewUtils from './NewUtils';

var ActivatePage = React.createClass({
  mixins: [PureRenderMixin],

  getInitialState: function() {
    return {
      activated: false,
      loading: true,

      pluginInstalled: false,
      isChrome: true
    };
  },

  componentWillMount: function() {
    var activationKey = this.props.params ?
      this.props.params.activationKey : this.props.activationKey;
    var username = this.props.params ? this.props.params.username : this.props.username;

    this.setState({ loading: true, response: null });

    Auth.activate(username, activationKey)
      .then(NewUtils.getThen(this))
      .catch(NewUtils.getCatch(this));
  },

  render: function() {
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
});

module.exports = ActivatePage;
