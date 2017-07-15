import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import MainReducer from '../../client/js/redux/MainReducer';
import routes from '../../client/templates/Routes';

const loadedRoutes = routes();

const router = express.Router();

/**
 * Asynchronously load all the data required on a render by reading renderProps
 * @param req           express request object
 * @param res           express response object (used for redirects)
 * @param renderProps   router render props
 * @return store to use, or null if redirected
 */
function loadData(/* req, res, renderProps */) {
  const store = createStore(MainReducer);

  return Promise.resolve({ store });
}

function handleRequest(req, res) {
  match({ routes: loadedRoutes, location: req.originalUrl }, (error, redirectLocation, renderProps) => {
    if (error) {
      console.log('Error: ' + req.originalUrl + ' not found');
      console.log(error.message);
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      console.log('Redirecting');
      console.log(redirectLocation.pathname + redirectLocation.search);
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      const loadDataStart = Date.now();
      loadData(req, res, renderProps).then((result) => {
        console.log(`Load data: ${Date.now() - loadDataStart}`);
        if (!result) return;  // We got redirected
        const { store, title, keywords, description, fbImage } = result;

        res.type('text/html');
        res.status(200);
        res.render('index', {
          title,
          keywords,
          description,
          fbImage,
          react: renderToString(
            <Provider store={store}>
              <RouterContext {...renderProps} />
            </Provider>
          ),
          reduxState: store.getState()
        });
      }).catch((err) => {
        console.error(err.stack);
        res.status(500).send('An unexpected error occurred; please try again later');
      });
    } else {
      console.log('Not found');
      res.status(404).send('Not found');
    }
  });
}

router.get('*', handleRequest);

export default router;
