'use strict';

import Immutable from 'immutable';
import _ from 'lodash';

// Extend Immutable with a.b.c getIn formats for better
// readability in the code
function dotFunc(origFuncName) {
  return function(searchKey) {
    var args = Array.prototype.slice.call(arguments);
    args[0] = searchKey.split('.');
    return this[origFuncName].apply(this, args);
  };
}

function autoFunc(origFuncName, dotFuncName) {
  return function(searchKey) {
    if (typeof searchKey === 'string') {
      return this[dotFuncName].apply(this, arguments);
    } else {
      return this[origFuncName].apply(this, arguments);
    }
  };
}

Immutable.Iterable.prototype.getDot = dotFunc('getIn');
Immutable.Iterable.prototype.setDot = dotFunc('setIn');

Immutable.Iterable.prototype.getAuto = autoFunc('getIn', 'getDot');
Immutable.Iterable.prototype.setAuto = autoFunc('setIn', 'setDot');

// Alias for convenience
Immutable.isImmutable = Immutable.Iterable.isIterable;

/**
 * Used to make sure an object is the raw JS version
 * if it could be either immutable or JS
 * @param obj  obj to potentially convert
 * @return mutable, normal-JS version of obj
 */
Immutable.toJS = function(obj) {
  if (Immutable.isImmutable(obj)) {
    return obj.toJS();
  }
  return obj;
};

//
// Extra functions for dealing with semi-immutable objects
// or non-immutable objects with immutable semantics
//

/**
 * Split a stateIndex path into two parts:
 * 1. Up to where the first immutable object is
 * 2. Everything after that
 * @param obj    object to look in
 * @param index  array of keys to look in obj
 * @note  this must be called with "this" bound correctly
 * @note  this assumes the mutable part comes first
 *        (e.g., with passing a React state object)
 */
function splitMutableImmutable(obj, index) {
  if (typeof index === 'string') {
    index = index.split('.');
  } else if (typeof index === 'number') {
    index = [index];
  }

  var cur = obj;
  var immutableParts = [];
  var mutableParts = [];

  for (var i = 0; i !== index.length; i++) {
    if (Immutable.Iterable.isIterable(cur)) {
      // Everything after the current is mutable
      immutableParts = index.slice(i);
      break;
    }
    var part = index[i];
    mutableParts.push(part);
    cur = obj[part];
  }

  return {
    mutable: mutableParts,
    immutable: immutableParts
  };
}

/**
 * Set a variable deep in a map that's potentially partly
 * immutable and partly not
 * @param obj         object to set
 * @param stateIndex  path to the property to set
 * @param value       value to set to
 * @param withType    if specified, used with setWith; currently disabled
 * @return modified root obj
 */
function setMixed(obj, stateIndex, value, withType) {
  var keys = splitMutableImmutable(obj, stateIndex);
  var hasMutable = !!keys.mutable.length;
  var hasImmutable = !!keys.immutable.length;

  var immutable = hasMutable ? _.get(obj, keys.mutable) : obj;
  var curValue = hasImmutable ? immutable.getIn(keys.immutable) : immutable;
  if (curValue === value) {
    // Prevent unneeded changes
    return obj;
  }

  var toSet = hasImmutable ? immutable.setIn(keys.immutable, value) : value;

  if (hasMutable) {
    var keysSoFar = [];

    // Clone parents so that we still have good behavior
    // with PureRenderMixin
    obj = _.clone(obj);
    for (var i = 0; i !== keys.mutable.length - 1; i++) {
      var key = keys.mutable[i];
      keysSoFar.push(key);
      _.set(obj, keysSoFar, _.clone(_.get(obj, keysSoFar)));
    }

    if (!withType) {
      _.set(obj, keys.mutable, toSet);
    } else {
      _.setWith(obj, keys.mutable, toSet, withType);
    }
    return obj;
  } else {
    // Purely immutable
    return toSet;
  }
}

/**
 * Get a variable deep in a map that's potentially partly
 * immutable and partly not
 * @param obj         object to get
 * @param stateIndex  path to the property to set
 * @return value or undefined
 */
function getMixed(obj, stateIndex) {
  var keys = splitMutableImmutable(obj, stateIndex);
  var hasMutable = !!keys.mutable.length;
  var hasImmutable = !!keys.immutable.length;

  var immutable = hasMutable ? _.get(obj, keys.mutable) : obj;
  var value = hasImmutable ? immutable.getIn(keys.immutable) : immutable;

  return value;
}

/**
 * Delete a variable deep in a map that's potentially partly
 * immutable and partly not
 * @param obj         object to delete in
 * @param stateIndex  path of item to delete
 * @return updated obj (with shallow copies to preserve immutable semantices)
 */
function deleteMixed(obj, stateIndex) {
  var keys = splitMutableImmutable(obj, stateIndex);
  var hasMutable = !!keys.mutable.length;
  var hasImmutable = !!keys.immutable.length;
  var immutable = hasMutable ? _.get(obj, keys.mutable) : obj;
  var toSet = hasImmutable ? immutable.deleteIn(keys.immutable) : immutable;

  if (hasMutable) {
    var keysSoFar = [];

    // Clone parents so that we still have good behavior
    // with PureRenderMixin
    obj = _.clone(obj);
    for (var i = 0; i !== keys.mutable.length - 1; i++) {
      var key = keys.mutable[i];
      keysSoFar.push(key);
      _.set(obj, keysSoFar, _.clone(_.get(obj, keysSoFar)));
    }

    if (hasImmutable) {
      // The deletion took place in the immutable part
      _.set(obj, keys.mutable, toSet);
    } else {
      // Use the second-to-last key to get the object to delete in
      var deleteObjKey = keys.mutable.slice(0, -1);
      var deleteObj = deleteObjKey.length !== 0 ? _.get(obj, deleteObjKey) : obj;
      var deleteKey = keys.mutable[keys.mutable.length - 1];

      if (deleteObj instanceof Array) {
        deleteObj.splice(deleteKey, 1);
      } else {
        delete deleteObj[deleteKey];
      }
    }
    return obj;
  } else {
    // Purely immutable
    return toSet;
  }
}

Immutable.setMixed = setMixed;
Immutable.getMixed = getMixed;
Immutable.deleteMixed = deleteMixed;

module.exports = Immutable;
