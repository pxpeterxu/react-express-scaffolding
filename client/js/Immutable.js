import Immutable from 'immutable';
import _ from 'lodash';

// Extend Immutable with a.b.c getIn formats for better
// readability in the code
function dotFunc(origFuncName) {
  return function(...allArgs) {
    const searchKey = allArgs[0];
    const args = Array.prototype.slice.call(allArgs);
    args[0] = searchKey.split('.');
    return this[origFuncName].apply(this, ...args);
  };
}

function autoFunc(origFuncName, dotFuncName) {
  return function(...args) {
    const searchKey = args[0];
    if (typeof searchKey === 'string') {
      return this[dotFuncName].apply(this, ...args);
    } else {
      return this[origFuncName].apply(this, ...args);
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

  let cur = obj;
  let immutableParts = [];
  const mutableParts = [];

  for (let i = 0; i !== index.length; i++) {
    if (Immutable.Iterable.isIterable(cur)) {
      // Everything after the current is mutable
      immutableParts = index.slice(i);
      break;
    }
    const part = index[i];
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
  const keys = splitMutableImmutable(obj, stateIndex);
  const hasMutable = !!keys.mutable.length;
  const hasImmutable = !!keys.immutable.length;

  const immutable = hasMutable ? _.get(obj, keys.mutable) : obj;
  const curValue = hasImmutable ? immutable.getIn(keys.immutable) : immutable;
  if (curValue === value) {
    // Prevent unneeded changes
    return obj;
  }

  const toSet = hasImmutable ? immutable.setIn(keys.immutable, value) : value;

  if (hasMutable) {
    const keysSoFar = [];

    // Clone parents so that we still have good behavior
    // with PureRenderMixin
    obj = _.clone(obj);
    for (let i = 0; i !== keys.mutable.length - 1; i++) {
      const key = keys.mutable[i];
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
  const keys = splitMutableImmutable(obj, stateIndex);
  const hasMutable = !!keys.mutable.length;
  const hasImmutable = !!keys.immutable.length;

  const immutable = hasMutable ? _.get(obj, keys.mutable) : obj;
  const value = hasImmutable ? immutable.getIn(keys.immutable) : immutable;

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
  const keys = splitMutableImmutable(obj, stateIndex);
  const hasMutable = !!keys.mutable.length;
  const hasImmutable = !!keys.immutable.length;
  const immutable = hasMutable ? _.get(obj, keys.mutable) : obj;
  const toSet = hasImmutable ? immutable.deleteIn(keys.immutable) : immutable;

  if (hasMutable) {
    const keysSoFar = [];

    // Clone parents so that we still have good behavior
    // with PureRenderMixin
    obj = _.clone(obj);
    for (let i = 0; i !== keys.mutable.length - 1; i++) {
      const key = keys.mutable[i];
      keysSoFar.push(key);
      _.set(obj, keysSoFar, _.clone(_.get(obj, keysSoFar)));
    }

    if (hasImmutable) {
      // The deletion took place in the immutable part
      _.set(obj, keys.mutable, toSet);
    } else {
      // Use the second-to-last key to get the object to delete in
      const deleteObjKey = keys.mutable.slice(0, -1);
      const deleteObj = deleteObjKey.length !== 0 ? _.get(obj, deleteObjKey) : obj;
      const deleteKey = keys.mutable[keys.mutable.length - 1];

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

export default Immutable;
export { setMixed, getMixed, deleteMixed };

export const {
  isImmutable,
  toJS
} = Immutable;
