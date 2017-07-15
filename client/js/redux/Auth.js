import { connect as connectRedux } from 'react-redux';
import _ from 'lodash';

import Auth from '../Auth';

let Actions = {
  startLogin: function() {
    return { type: 'START_LOGIN' };
  },
  finishLogin: function(data) {
    return { type: 'FINISH_LOGIN', data: data };
  },
  updateLoginState: function(data) {
    return { type: 'UPDATE_LOGIN_STATE', data: data };
  },
  startLogout: function() {
    return { type: 'START_LOGOUT' };
  },
  finishLogout: function() {
    return { type: 'FINISH_LOGOUT' };
  },
  startRegister: function() {
    return { type: 'START_REGISTER' };
  },
  finishRegister: function() {
    return { type: 'FINISH_REGISTER' };
  },
  setError: function(error) {
    return { type: 'SET_ERROR', error: error };
  }
};

function AuthReducer(state, action) {
  function getDefaultState() {
    return {
      loading: false,
      loaded: false,
      response: {
        loggedIn: false,
        username: null,
        activated: null,
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
function login(dispatch, email, password) {
  dispatch(Actions.startLogin());

  return Auth.login(email, password).then(function(data) {
    if (data.success) {
      dispatch(Actions.finishLogin(data));
    } else {
      dispatch(Actions.setError(data));
    }
    return mapResponseToProps(data);
  }).catch(function(err) {
    console.error(err);
    dispatch(Actions.setError(err));
  });
}

/**
 * Log out of an account
 * @param {function} dispatch  Redux dispatch function
 * @return {Promise.<object>} object with response
 */
function logout(dispatch) {
  dispatch(Actions.startLogout());

  return Auth.logout().then(function(data) {
    if (data.success) {
      dispatch(Actions.finishLogout());
    }
    return data;
  }).catch(function(err) {
    console.error(err);
    dispatch(Actions.setError(err));
  });
}

/**
 * Register a user with given info
 * @param {Object} user  user with email, username, password
 * @return {Promise.<Object>} with login details
 */
function register(dispatch, userData) {
  dispatch(Actions.startRegister());

  return Auth.register(userData).then(function(data) {
    if (data.success) {
      dispatch(Actions.finishRegister(data));
    } else {
      dispatch(Actions.setError(data));
    }
    return mapResponseToProps(data);
  }).catch(function(err) {
    dispatch(Actions.setError(err));
  });
}

/**
 * Update the logged in status if it hasn't been loaded
 * already
 * @param {function} dispatch   Redux dispatch function
 * @param {Object}   store      if data already exists in store, will
 *                              use the cache
 * @return {Promise.<Object>} promise with response
 */
function getLoginState(dispatch, store) {
  if (store && _.get(store, 'auth.loaded')) {
    return Promise.resolve(mapResponseToProps(store.auth.response));
  }

  return Auth.isLoggedIn().then(function(data) {
    if (data.success) {
      dispatch(Actions.updateLoginState(data));
    } else {
      dispatch(Actions.setError(data));
    }
    return mapResponseToProps(data);
  }).catch(function(err) {
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
function mapResponseToProps(response) {
  return {
    isLoggedIn: response.loggedIn,
    username: response.username,
    isActivated: response.activated,
  };
}

/**
 * This function can be called within any connected component
 * to get the login state (synchronously if already fetched,
 * or via a fetch if it hasn't)
 * @param {Object} props     props of the component
 * @return {Promise.<Object>} object with all auth props
 */
function getOrFetchLoginState(props) {
  let authStateLoaded = props.authStateLoaded;
  let getLoginState = props.getLoginState;

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
function connect(options) {
  function mapStateToProps(globalState) {
    let state = globalState.auth;
    return Object.assign({
      authStateLoaded: state.loaded,
      authLoading: state.loading,
      authError: state.error
    }, mapResponseToProps(state.response));
  };

  function mapDispatchToProps(dispatch) {
    return {
      login: login.bind(null, dispatch),
      logout: logout.bind(null, dispatch),
      registerUser: register.bind(null, dispatch),
      getLoginState: getLoginState.bind(null, dispatch),
    };
  };

  return connectRedux(mapStateToProps, mapDispatchToProps, null, options);
}

module.exports = {
  Actions: Actions,
  Reducer: AuthReducer,
  connect: connect,
  getOrFetchLoginState: getOrFetchLoginState,
  getLoginState: getLoginState
};
