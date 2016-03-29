'use strict';

var React = require('react');
var _ = require('lodash');

var preventDefault = function(event) {
  if (event) event.preventDefault();
};

/**
 * Join two paths into either a string or an array
 * @param reactObj
 * @param prefix
 */
var joinPath = function(prefix, stateIndex) {
  if (typeof stateIndex === 'string') {
    prefix = typeof prefix === 'string' ? prefix : prefix.join('.');
    return prefix + '.' + stateIndex;
  } else if (typeof stateIndex === 'array') {
    prefix = typeof prefix === 'array' ? prefix : prefix.split('.');
    return prefix.concat(stateIndex);
  }
};

/**
 * Creates a way to update form fields with prefixes, for when a child element
 * is meant to be just a transparent hook into the parent
 */
var updateFormFieldWithPrefix = function(reactObj, prefix) {
  return function(stateIndex, forceType, changeTracker) {
    stateIndex = joinPath(prefix, stateIndex);
    return updateFormField(reactObj, stateIndex, forceType, changeTracker);
  };
};

var updateFormField = function(reactObj, stateIndex, forceType, changeTracker) {
  /**
   * Creates an event handler for handling keystroke updates
   * for a controlled React.js form element, by updating this.state
   * with the given index
   * @param reactObj  object to set React.js state on
   * @param stateIndex  name of property in this.state to update
   * @param forceType  force the number to either 'int' or 'float'
   * @param changeTracker  name of property in this.state to set to true
   *                       to indicate that we've made a change
   */
  return function handleChange(e) {
    var value = e.target.value;
    
    try {      
      if (forceType === 'int') {
        value = parseInt(value, 10);
      } else if (forceType === 'float') {
        value = parseFloat(value);
      }
    } catch (err) {
      e.preventDefault();
      return err;
    }
    
    var state = reactObj.state;
    _.set(state, stateIndex, value);
    
    if (changeTracker) {
      _.set(state, changeTracker, true);
    }
    
    reactObj.setState(state);
  };
};

var toggle = function(stateIndex, value, e) {
  /**
   * A "bind"-able function for handling click toggles for
   * e.g., accordion elements to set an active item.
   * If the clicked item is already active, hide/deselect it;
   * otherwise open it
   *
   * @example Use it as ReactUtils.toggle.bind(this, 'openTab', tabName)
   * @param stateIndex  name of property in this.state to update 
   * @param value  value to set the property to  
   */
  if (e) e.preventDefault();
  
  var curValue = _.get(this.state, stateIndex);
  
  // If it's another click on the same object, toggle it off;
  // otherwise, open it
  var newValue = curValue === value ? null : value;
  _.set(this.state, stateIndex, newValue);
  
  this.setState(this.state);
};

var toggleCheckbox = function(stateIndex, changeTracker) {
  return toggleBoolTrackingChanges.call(this, stateIndex, changeTracker, null);
};

var toggleCheckboxWithPrefix = function(prefix, stateIndex, changeTracker) {
  return toggleCheckbox.call(this, joinPath(prefix, stateIndex), changeTracker);
};

var toggleBool = function(stateIndex, e) {
  return toggleBoolTrackingChanges.call(this, stateIndex, null, e);
};

var toggleBoolTrackingChanges = function(stateIndex, changeTracker, e) {
  if (e) e.preventDefault();
  
  var newValue = !_.get(this.state, stateIndex);
  _.set(this.state, stateIndex, newValue);
  
  if (changeTracker) {
    _.set(this.state, changeTracker, true);
  }
  
  this.setState(this.state);
};

var setState = function(stateIndex, value, e) {
  /**
   * A "bind"-able function for handling click to sets
   *
   * @example Use it as ReactUtils.setState.bind(this, 'options.showModal', true)
   * @param stateIndex  name of property in this.state to update 
   * @param value  value to set the property to
   * @param e  event object; if provided, will have preventDefault() called
   */
  if (e) e.preventDefault();
  _.set(this.state, stateIndex, value);
  
  this.setState(this.state);
};

var setStateRadio = function(stateIndex, event) {
  return setState.call(this, stateIndex, event.target.value);
};

var setStateCheckbox = function(stateIndex, event) {
  return setState.call(this, stateIndex, event.target.checked);
};

var addBreaks = function(str, splitAt) {
  splitAt = splitAt || /[\/&]/;
  var parts = str.split(splitAt);
  
  var withBreaks = parts.map(function(part, i) {
    if (i === parts.length - 1) return (<span key={i}>{part}</span>);
    return (<span key={i}>{part}/<wbr /></span>);
  }); // Add zero-width
  
  return (<span>{withBreaks}</span>);
};


var defaultDoneToVariable = function(variable, data, status) {
  /**
   * Bind-able function that can be used as the standard
   * jQuery.ajax.done callback
   * @param variable  variable in state to save to
   * @param data
   * @param status
   * @example $.post(...).done(ReactUtils.defaultDone.bind(this, 'response2'))
   */
   
  var stateObj = {
    loading: false,
    response: null
  };
  _.set(stateObj, variable, data);
  this.setState(stateObj);
};

var defaultDone = function(data, status) {
  /**
   * Bind-able function that can be used as the standard
   * jQuery.ajax.done callback
   * @param data
   * @param status
   * @example $.post(...).done(ReactUtils.defaultDone.bind(this))
   */
  defaultDoneToVariable.call(this, 'response', data, status);
};

/**
 * Get a default error object to encapsulate the data
 * returned from the server
 * @param data     data returned from server
 * @return error object
 */
var getDefaultError = function(data) {
  var defaultError = {
    success: false,
    messages: ['There was an unknown error; please try again later' ]
  };
  
  if (data) {
    defaultError.error = data;
  }
  
  return defaultError;
};


var defaultFailToVariable = function(data, status) {
  /**
   * Bind-able function that can be used as the standard
   * jQuery.ajax.fail callback
   * @param variable  variable in state to save to
   * @param data
   * @param status
   * @example $.post(...).fail(ReactUtils.defaultFail.bind(this, 'response2'))
   */
  var defaultError = getDefaultError(data);
  
  this.setState({
    loading: false,
    response: !_.isEmpty(data) ? data : defaultError
  });
};


var defaultFail = function(data, status) {
  /**
   * Bind-able function that can be used as the standard
   * jQuery.ajax.fail callback
   * @param data
   * @param status
   * @example $.post(...).fail(ReactUtils.defaultFail.bind(this))
   */
  defaultFailToVariable.call(this, 'response', data, status);
};

var defaultRenderMessages = function(response, additionalClasses) {
  /**
   * Bind-able function that renders an alert based on the output
   * from a defaultDone or defaultFail
   * @param response this.state.response variable
   * @param additionalClasses additional CSS classes for alert
   * @return alert if success or fail
   */
  return response && response.messages && (
    <div className={'alert alert-' +
      (response.success ? 'success' : 'danger') +
      (additionalClasses ? ' ' + additionalClasses : '')}>
      {response.messages.map(function(message) {
        return <p>{message}</p>;
      })}
    </div>
  );
};

var ReactUtils = {
  updateFormField: updateFormField,
  updateFormFieldWithPrefix: updateFormFieldWithPrefix,
  preventDefault: preventDefault,
  addBreaks: addBreaks,
  toggle: toggle,
  setState: setState,
  setStateRadio: setStateRadio,
  setStateCheckbox: setStateCheckbox,
  toggleCheckbox: toggleCheckbox,
  toggleCheckboxWithPrefix: toggleCheckboxWithPrefix,
  toggleBool: toggleBool,
  defaultDoneToVariable: defaultDoneToVariable,
  defaultFailToVariable: defaultFailToVariable,
  defaultDone: defaultDone,
  defaultFail: defaultFail,
  defaultRenderMessages: defaultRenderMessages
};

module.exports = ReactUtils;
