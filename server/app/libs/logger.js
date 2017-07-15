import config from '../config';
import winston from 'winston';

function createLogger(logPath) {
  return new winston.Logger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: logPath }),
    ]
  });
};

function createFileOnlyLogger(logPath) {  // eslint-disable-line no-unused-vars
  return new winston.Logger({
    transports: [
      new winston.transports.File({ filename: logPath }),
    ]
  });
};

let logger = createLogger(config.logPath);

export default logger;
