import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Router, browserHistory, applyRouterMiddleware } from 'react-router';
import { useScroll } from 'react-router-scroll';
import ga from 'react-ga';
import { logger } from 'redux-logger';

import Config from '../js/Config';
import Auth from '../js/redux/Auth';
import MainReducer from '../js/redux/MainReducer';
import Constants from '../js/Constants';
import routes from './Routes';

const preloadedState = window.__REDUX_STATE__;

let store;
if (Config.environment === 'development') {
  store = createStore(
    MainReducer,
    preloadedState,
    applyMiddleware(logger),
  );
} else {
  store = createStore(MainReducer, preloadedState);
}
export default class MainRouter extends React.PureComponent {
  componentWillMount() {
    Auth.getLoginState(store.dispatch, store.getState());
    ga.initialize(Constants.googleAnalyticsId);
    browserHistory.listen((location) => {
      ga.pageview(location.pathname);
    });
  }

  requireLoggedIn(nextState, replace, callback) {
    const redirectToLogin = () => {
      replace({
        pathname: '/login',
        query: { redirect: nextState.location.pathname }
      });
      callback();
    };

    return Auth.getLoginState(store.dispatch, store.getState()).then((data) => {
      // Get the login status, and redirect to callback
      if (data.isLoggedIn) {
        callback();
      } else {
        redirectToLogin();
      }
    }).catch(() => {
      redirectToLogin();
    });
  }

  render() {
    return (
      <Provider store={store}>
        <Router history={browserHistory} render={applyRouterMiddleware(useScroll())}>
          {routes(this.requireLoggedIn)}
        </Router>
      </Provider>
    );
  }
}
