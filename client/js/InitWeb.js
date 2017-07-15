import React from 'react';
import ReactDOM from 'react-dom';
import MainRouter from '../templates/MainRouter';

require('es6-promise').polyfill();
require('es6-object-assign').polyfill();

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    React.createElement(MainRouter),
    document.getElementById('react-main')
  );
});
