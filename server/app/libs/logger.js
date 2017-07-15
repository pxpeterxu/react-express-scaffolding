'use strict';

import config from '../config';
import winston from 'winston';

var createLogger = function(logPath) {
  return new winston.Logger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: logPath }),
    ]
  });
};

var createFileOnlyLogger = function(logPath) {  // eslint-disable-line no-unused-vars
  return new winston.Logger({
    transports: [
      new winston.transports.File({ filename: logPath }),
    ]
  });
};

var logger = createLogger(config.logPath);

module.exports = logger;
