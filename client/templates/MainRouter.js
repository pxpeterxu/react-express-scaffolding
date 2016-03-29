'use strict';

var React = require('react');
var router = require('react-router');
var createHashHistory = require('history').createHashHistory;
var ga = require('react-ga');

var MainPage = require('./MainPage');
var HomePage = require('./HomePage');
var LoginPage = require('./LoginPage');
var ActivatePage = require('./ActivatePage');

var Router = router.Router;
var Route = router.Route;
var IndexRoute = router.IndexRoute;
var Redirect = router.Redirect;

var history = createHashHistory();

var MainRouter = React.createClass({
  requireLoggedIn: function(nextState, replaceState, callback) {
    var redirectToLogin = function() {
      replaceState({}, '/login', {
        redirect: nextState.location.pathname
      });
      callback();
    };
    
    // Get the token if we have one
    Auth.isLoggedIn().then(function(data) {
      console.log(data);
      // Get the login status, and redirect to callback
      if (data.loggedIn) {
        callback();
      } else {
        redirectToLogin();
      }
    }).catch(function(data) {
      redirectToLogin();
    });
  },
  
  componentDidMount: function() {
    /*
    ga.initialize('ENTER-YOUR-GA-TOKEN');
  
    history.listen(function(location) {
      ga.pageview(location.pathname);
    });
    */
  },
  
  render: function() {
    return (
      <Router history={history}>
        <Route path="/" component={MainPage}>
          <IndexRoute component={HomePage} />
          <Route path="/index" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={LoginPage} />
          <Route path="/activate/:username/:activationKey" component={ActivatePage} />
        </Route>
      </Router>
    );
  }
});

module.exports = MainRouter;
