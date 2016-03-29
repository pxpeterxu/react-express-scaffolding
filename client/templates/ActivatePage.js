'use strict';

var React = require('react');
var rp = require('request-promise');
var Config = require('../js/Config');

var ReactUtils = require('./ReactUtils');

var ActivatePage = React.createClass({
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
    
    rp({
      uri: Config.host + '/user/activate/' + username + '/' + activationKey,
      method: 'POST',
      body: {
        activationKey: activationKey,
        username: username
      },
      json: true
    })
      .then(ReactUtils.defaultDone.bind(this))
      .catch(ReactUtils.defaultFail.bind(this));
  },
  
  render: function() {
    return (
      <div className="container">
        <h1>Activating your account</h1>
        
        {this.state.loading && (        
          <div className="text-center">
            <p>Please wait while we try to activate your account:</p>
            <img src="assets/loading.gif" alt="Loading..." />
          </div>
        )}
        
        {ReactUtils.defaultRenderMessages(this.state.response)}
      </div>
    );
  }
});

module.exports = ActivatePage;
