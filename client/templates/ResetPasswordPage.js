import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { Link } from 'react-router';

import Auth from '../js/Auth';
import NewUtils from './NewUtils';

let ResetPasswordPage = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    params: React.PropTypes.shape({
      token: React.PropTypes.string
    }),
    token: React.PropTypes.string
  },

  getInitialState: function() {
    return {
      loading: true,
      isValid: null,
      response: null,

      password: '',
      password2: '',
      blurredPassword2: false,

      passwordChanged: false
    };
  },

  checkToken: function(props) {
    props = props.params || props;
    let token = props.token;

    this.setState({ loading: true, response: null, isValid: null });

    Auth.isValidPasswordResetToken(token)
      .then(function(data) {
        this.setState({
          loading: false,
          isValid: data.isValid,
          response: !data.isValid ? {
            success: false,
            messages: ['The password reset link you followed has expired or is invalid. Please go to the Sign In page to request another one']
          } : null
        });
      }.bind(this))
      .catch(NewUtils.getCatch(this));
  },

  componentWillMount: function() {
    this.checkToken(this.props);
  },

  componentWillReceiveProps: function(props) {
    if (props.token !== this.props.token) {
      this.checkToken(props);
    }
  },

  resetPassword: function(e) {
    e.preventDefault();
    this.setState({ loading: true, response: null });

    let props = this.props.params || this.props;

    Auth.resetPassword(props.token, this.state.password)
      .then(function(data) {
        if (data.success) {
          // Add extra link if successful
          data.messages.push(<span>
            <Link to="/login">Sign in with your new password</Link> to start using WrapAPI.
          </span>);
          this.setState({ passwordChanged: true });
        }

        NewUtils.getThen(this)(data);
      }.bind(this))
      .catch(NewUtils.getCatch(this));
  },

  render: function() {
    let password = this.state.password;
    let password2 = this.state.password2;
    let blurredPassword2 = this.state.blurredPassword2;
    let loading = this.state.loading;
    let response = this.state.response;

    let enableSubmit = password === password2 &&
      password && password2 && !loading && !this.state.passwordChanged;
      // Disable if missing inputs, loading, or already done
    let showPassword2Error = password !== password2 &&
      (blurredPassword2 || password2 !== '');

    return (
      <div className="container"><div className="row">
        <div className="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
          <h1>Reset your password</h1>

          {(loading && this.state.isValid === null) ? (
            <div className="text-center">
              <p>Please wait while we check if you followed a valid password reset link:</p>
              <i className="fa fa-circle-o-notch fa-spin fa-3x"></i>
            </div>
          ) : (<div>

            {NewUtils.renderResponse(response)}

            {this.state.isValid && (
              <form onSubmit={this.resetPassword}>
                <div className="form-group">
                  <label htmlFor="password">New password</label>
                  <input type="password" id="password" className="form-control"
                      value={password}
                      onChange={NewUtils.update(this, 'password')} />
                  <p className="help-block">
                    Choose a long, hard-to-guess password that you don't use anywhere else.
                  </p>
                </div>

                <div className={'form-group ' +
                    (showPassword2Error ? 'has-error' : '')}>
                  <label htmlFor="password">New password again</label>
                  <input type="password" id="password2" className="form-control"
                      value={password2}
                      onChange={NewUtils.update(this, 'password2')}
                      onBlur={NewUtils.setState(this, 'blurredPassword2', true)} />
                  <p className="help-block">
                    {showPassword2Error ?
                      'The two passwords you entered do not match; please try again.' :
                      'Enter your password again to ensure that you entered it correctly and won\'t be locked out of your account.'}
                  </p>
                </div>

                <button className="btn btn-primary" type="submit"
                    disabled={!enableSubmit}>
                  Set new password
                </button>
              </form>
            )}
          </div>)}
        </div>
      </div></div>
    );
  }
});

export default ResetPasswordPage;
