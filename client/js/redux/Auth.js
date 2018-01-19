// @flow
import { connect as connectRedux } from 'react-redux';
import _ from 'lodash';
import Auth, { type RegistrationData } from '../Auth';

type AuthResponse = {
  success: boolean,
  loggedIn: boolean,
  username: ?string,
  email: ?string,
  activated: ?boolean,
};

export const Actions = {
  startLogin() {
    return { type: 'START_LOGIN' };
  },
  finishLogin(data: AuthResponse) {
    return { type: 'FINISH_LOGIN', data };
  },
  updateLoginState(data: AuthResponse) {
    return { type: 'UPDATE_LOGIN_STATE', data };
  },
  startLogout() {
    return { type: 'START_LOGOUT' };
  },
  finishLogout() {
    return { type: 'FINISH_LOGOUT' };
  },
  startRegister() {
    return { type: 'START_REGISTER' };
  },
  finishRegister(data: AuthResponse) {
    return { type: 'FINISH_REGISTER', data };
  },
  setError(error: Object) {
    return { type: 'SET_ERROR', error };
  },
  setTutorialCompleted(tutorial: string, completed: boolean) {
    return { type: 'SET_TUTORIAL_COMPLETED', tutorial, completed };
  }
};

type State = {
  loading: boolean,
  loaded: boolean,
  response: AuthResponse,
  error: ?Object,
};

export function Reducer(state: ?State, action: any) { // Not typing action yet; not likely source of bugs
  function getDefaultState(): State {
    return {
      loading: false,
      loaded: false,
      response: {
        success: false,
        loggedIn: false,
        username: null,
        activated: null,
        email: null,
      },
      error: null
    };
  }

  if (!state) {
    state = getDefaultState();
  }

  switch (action.type) {
    case 'START_LOGIN':
    case 'START_REGISTER':
    case 'START_LOGOUT':
      return Object.assign({}, state, {
        loading: true,
        error: null
      });

    case 'FINISH_LOGIN':
    case 'FINISH_REGISTER':
    case 'UPDATE_LOGIN_STATE':
      return Object.assign({}, state, {
        loading: false,
        loaded: true,
        response: action.data
      });

    case 'SET_ERROR':
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });

    case 'FINISH_LOGOUT':
      return Object.assign(getDefaultState(), { loaded: true });
  }

  return state;
}

/**
 * Attempt a login with a given email/username and password
 * Returns a Promise
 * @param {function} dispatch   Redux dispatch function
 * @param {string} email
 * @param {string} password
 * @return {Promise.<object>} object with response
 */
export function login(dispatch: Function, email: string, password: string) {
  dispatch(Actions.startLogin());

  return Auth.login(email, password).then((data) => {
    if (data.success) {
      dispatch(Actions.finishLogin(data));
    } else {
      dispatch(Actions.setError(data));
    }
    return mapResponseToProps(data);
  }).catch((err) => {
    console.error(err);
    dispatch(Actions.setError(err));
  });
}

/**
 * Log out of an account
 * @param {function} dispatch  Redux dispatch function
 * @return {Promise.<object>} object with response
 */
export function logout(dispatch: Function) {
  dispatch(Actions.startLogout());
  Auth.logout().then((data) => {
    if (data.success) {
      dispatch(Actions.finishLogout());
    }
    return data;
  }).catch((err) => {
    console.error(err);
    dispatch(Actions.setError(err));
  });
}

/**
 * Register a user with given info
 * @param {Object} userData  user with email, username, password, name, company, etc.
 * @param {string} inviteKey optionally, an invite key
 * @return {Promise.<Object>} with login details
 */
function register(dispatch: Function, userData: RegistrationData, inviteKey?: string) {
  dispatch(Actions.startRegister());

  return Auth.register(userData, inviteKey).then((data) => {
    if (data.success) {
      dispatch(Actions.finishRegister(data));
    } else {
      dispatch(Actions.setError(data));
    }
    return data;
  }).catch((err) => {
    dispatch(Actions.setError(err));
  });
}

type AuthResponseInjectedProps = {
  isLoggedIn: boolean,
  username: ?string,
  isActivated: ?boolean,
  userEmail: ?string,
};

export type InjectedProps = {
  authStateLoaded: boolean,
  authLoading: boolean,
  authError: ?Object,

  // Dispatch functions
  login: Function,
  logout: Function,
  registerUser: Function,
  getLoginState: Function,
} & AuthResponseInjectedProps;

/**
 * Update the logged in status if it hasn't been loaded
 * already
 * @param {function} dispatch   Redux dispatch function
 * @param {Object}   store      if data already exists in store, will
 *                              use the cache
 * @return {Promise.<Object>} promise with response
 */
function getLoginState(dispatch: Function, store: { auth: State }): Promise<AuthResponseInjectedProps> {
  if (store && _.get(store, 'auth.loaded')) {
    return Promise.resolve(mapResponseToProps(store.auth.response));
  }

  return Auth.isLoggedIn().then((data) => {
    if (data.success) {
      dispatch(Actions.updateLoginState(data));
    } else {
      dispatch(Actions.setError(data));
    }
    return mapResponseToProps(data);
  }).catch((err) => {
    // Swallow error
    console.error('Error when trying to get login state');
    console.error(err);
  });
}

/**
 * Map the response from a getLoginState to their keys as props
 * @param {Object} response  response data
 * @return {Object} object with slightly altered keys
 */
function mapResponseToProps(response: AuthResponse): AuthResponseInjectedProps {
  return {
    isLoggedIn: response.isLoggedIn,
    username: response.username,
    isActivated: response.activated,
    userEmail: response.email,
  };
}

/**
 * This function can be called within any connected component
 * to get the login state (synchronously if already fetched,
 * or via a fetch if it hasn't)
 * @param {Object} props     props of the component
 * @return {Promise.<Object>} object with all auth props
 */
function getOrFetchLoginState(props: InjectedProps): Promise<InjectedProps> {
  const authStateLoaded = props.authStateLoaded;
  const getLoginState = props.getLoginState;

  if (authStateLoaded) {
    return Promise.resolve(props);  // Should contain all the keys we need
  }

  return getLoginState();
}

/**
 * Connect a dispatcher for updating the tutorial step both
 * locally and with a server call
 * @param {Object} options   options for ReactRedux.connect
 * @return {Object} wrapped React component
 */
export function connect(options?: ?Object) {
  const mapStateToProps = (globalState) => {
    const state = globalState.auth;
    return Object.assign({}, {
      authStateLoaded: state.loaded,
      authLoading: state.loading,
      authError: state.error
    }, mapResponseToProps(state.response));
  };

  const mapDispatchToProps = dispatch => ({
    login: login.bind(null, dispatch),
    logout: logout.bind(null, dispatch),
    registerUser: register.bind(null, dispatch),
    getLoginState: getLoginState.bind(null, dispatch),
  });

  return connectRedux(mapStateToProps, mapDispatchToProps, null, options);
}

export default {
  Actions,
  Reducer,
  connect,
  getOrFetchLoginState,
  getLoginState
};
