import _ from 'lodash';
import logger from './logger';

/**
 * Process Sequelize validation messages so that we only display
 * the last one for each field
 * @param errors .errors from a sequelize.validate() or .save()
 * @return list of error messages
 */
function oneMessagePerField(errors) {
  let hasError = {};
  let messages = [];

  for (let i = 0; i !== errors.length; i++) {
    let error = errors[i];
    if (!hasError[error.path]) {
      hasError[error.path] = true;
      messages.push(error.message);
    }
  }

  return messages;
}

/**
 * An internal error type for outputting expected error messages
 * and errTypes in catch() statements
 * @param errors  array of [{ message: '...', type: '...'}, ...]
 */
function WAError(errors) {
  let messages = errors.map(function(err) {
    return err.message;
  });
  let errTypes = errors.map(function(err) {
    return err.type;
  });

  this.name = 'WAError';
  this.messages = messages;
  this.message = messages.join('\n');
  this.errTypes = errTypes;
  this.stack = (new Error()).stack;
}

/**
 * An internal error for throwing an error as a response
 * @param response   response object
 */
function ResponseError(response) {
  this.name = 'ResponseError';
  this.response = response;
  this.message = response.messages.join('\n');
  this.errTypes = response.errTypes;
  this.stack = (new Error()).stack;
}

function buildWAError(message, type) {
  return new WAError([{ message: message, type: type }]);
}

function defaultCatch(res) {
  return function(err) {
    if (_.isArray(err)) {
      // By convention, this is an error that we threw
      // ourselves, so we should actually output the error
      // messages to the client
      res.json({
        success: false,
        messages: err
      });
    } else if (err instanceof ResponseError) {
      res.json(err.response);
    } else if (err instanceof WAError) {
      // This is also an internally-generated error similar
      // to the above, except with details and futureproofing
      res.json({
        success: false,
        messages: err.messages,
        errTypes: err.errTypes
      });
    } else if (err.name === 'SequelizeValidationError') {
      res.json({ success: false, messages: oneMessagePerField(err.errors) });
    } else {
      logger.error('Caught unusual exception', err.stack);
      res.json({
        success: false,
        messages: ['An unexpected error has occurred'],
        error: err
      });
    }
  };
}

/**
 * Middleware for disabling a feature
 */
function disabledMiddleware(req, res) {
  res.json({
    success: false,
    messages: ['This feature is disabled'],
    errTypes: ['disabled']
  });
}

/**
 * Middleware that automatically calls next()
 */
function doNothingMiddleware(req, res, next) {
  next();
}

const exported = {
  defaultCatch: defaultCatch,
  WAError: WAError,
  ResponseError: ResponseError,
  buildWAError: buildWAError,
  oneMessagePerField: oneMessagePerField,
  disabledMiddleware: disabledMiddleware,
  doNothingMiddleware: doNothingMiddleware
};

export default exported;
export { defaultCatch, WAError, ResponseError, buildWAError, oneMessagePerField, disabledMiddleware, doNothingMiddleware };
