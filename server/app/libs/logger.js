'use strict';
var config = require('../config');
var winston = require('winston');

var createLogger = function(logPath) {
  return new (winston.Logger) ({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File) ({ filename: logPath }),
    ]
  });
};

var createFileOnlyLogger = function(logPath) {
  return new (winston.Logger) ({
    transports: [
      new (winston.transports.File) ({ filename: logPath }),
    ]
  });
};


var logger = createLogger(config.logPath);
logger.requestLogger = createFileOnlyLogger(config.requestsLogPath);
logger.sqlLogger = createFileOnlyLogger(config.requestsLogPath);

logger.requestLogger.stream = {
  write: function(message, encoding){
    logger.info(message);
  }
};

module.exports = logger;
