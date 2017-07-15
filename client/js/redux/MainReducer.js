import { combineReducers } from 'redux';
import { Reducer as AuthReducer } from './Auth';

const MainReducer = combineReducers({
  auth: AuthReducer
});

export default MainReducer;
