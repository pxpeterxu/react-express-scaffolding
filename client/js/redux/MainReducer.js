'use strict';

import { combineReducers } from 'redux';
import { Reducer as AuthReducer } from './Auth';

var MainReducer = combineReducers({
  auth: AuthReducer
});

module.exports = MainReducer;
