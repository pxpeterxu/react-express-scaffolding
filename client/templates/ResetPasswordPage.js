// @flow
import React from 'react';
import { Link } from 'react-router';
import {
  update,
  setState,
  getCatch,
  getThen,
  renderResponse,
} from 'react-updaters';
import type { Response } from '../../common/Types';
import Auth from '../js/Auth';

type Props = {
  params: {
    username: string,
    token: string,
  },
};

type State = {
  loading: boolean,
  isValid: ?boolean,
  response: ?Response,

  password: string,
  password2: string,
  blurredPassword2: boolean,

  passwordChanged: boolean,
};

class ResetPasswordPage extends React.PureComponent<Props, State> {
  state = {
    loading: true,
    isValid: null,
    response: null,

    password: '',
    password2: '',
    blurredPassword2: false,

    passwordChanged: false,
  };

  checkToken = (props: Props) => {
    const token = props.params.token;

    this.setState({ loading: true, response: null, isValid: null });

    Auth.isValidPasswordResetToken(token)
      .then(data => {
        this.setState({
          loading: false,
          isValid: data.isValid,
          response: !data.isValid
            ? {
                success: false,
                messages: [
                  'The password reset link you followed has expired or is invalid. Please go to the Sign In page to request another one',
                ],
                errTypes: ['expired'],
              }
            : null,
        });
      })
      .catch(getCatch(this));
  };

  componentWillMount() {
    this.checkToken(this.props);
  }

  componentWillReceiveProps(props: Props) {
    if (props.params.token !== this.props.params.token) {
      this.checkToken(props);
    }
  }

  resetPassword = (e: Event) => {
    e.preventDefault();
    this.setState({ loading: true, response: null });

    const params = this.props.params;

    Auth.resetPassword(params.token, this.state.password)
      .then(data => {
        if (data.success) {
          // Add extra link if successful
          data.messages.push(
            <span>
              <Link to="/login">Sign in with your new password</Link> to start
              using YOUR_SITE_NAME.
            </span>
          );
          this.setState({ passwordChanged: true });
        }

        getThen(this)(data);
      })
      .catch(getCatch(this));
  };

  render() {
    const {
      password,
      password2,
      blurredPassword2,
      loading,
      response,
      passwordChanged,
    } = this.state;

    const enableSubmit =
      password === password2 &&
      password &&
      password2 &&
      !loading &&
      !passwordChanged;
    // Disable if missing inputs, loading, or already done
    const showPassword2Error =
      password !== password2 && (blurredPassword2 || password2 !== '');

    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
            <h1>Reset your password</h1>

            {loading && this.state.isValid === null ? (
              <div className="text-center">
                <p>
                  Please wait while we check if you followed a valid password
                  reset link:
                </p>
                <i className="fa fa-circle-o-notch fa-spin fa-3x" />
              </div>
            ) : (
              <div>
                {renderResponse(response)}

                {this.state.isValid && (
                  <form onSubmit={this.resetPassword}>
                    <input
                      type="text"
                      value={this.props.match.params.username}
                      autoComplete="username"
                      className="hidden"
                    />
                    {/* This is only used for populating Chrome autocomplete:
                        see https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands */}

                    <div className="form-group">
                      <label htmlFor="password">New password</label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        autoComplete="new-password"
                        disabled={passwordChanged}
                        value={password}
                        onChange={update(this, 'password')}
                      />
                      <p className="help-block">
                        Choose a long, hard-to-guess password that you don't use
                        anywhere else.
                      </p>
                    </div>

                    <div
                      className={
                        'form-group ' + (showPassword2Error ? 'has-error' : '')
                      }
                    >
                      <label htmlFor="password2">New password again</label>
                      <input
                        type="password"
                        id="password2"
                        className="form-control"
                        autoComplete="new-password"
                        disabled={passwordChanged}
                        value={password2}
                        onChange={update(this, 'password2')}
                        onBlur={setState(this, 'blurredPassword2', true)}
                      />
                      <p className="help-block">
                        {showPassword2Error
                          ? 'The two passwords you entered do not match; please try again.'
                          : "Enter your password again to ensure that you entered it correctly and won't be locked out of your account."}
                      </p>
                    </div>

                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={!enableSubmit}
                    >
                      Set new password
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ResetPasswordPage;
