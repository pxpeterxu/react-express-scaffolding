import React from 'react';
import ReactDOM from 'react-dom';
require('es6-promise').polyfill();
require('es6-object-assign').polyfill();
import MainRouter from '../templates/MainRouter';

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    React.createElement(MainRouter),
    document.getElementById('react-main')
  );
});
