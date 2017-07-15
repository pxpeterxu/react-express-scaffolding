import { combineReducers } from 'redux';
import { Reducer as AuthReducer } from './Auth';

let MainReducer = combineReducers({
  auth: AuthReducer
});

export default MainReducer;
