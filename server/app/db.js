'use strict';

import config from './config';
import Sequelize from 'sequelize';
import logger from './libs/logger';

var options = {
  logging: false
};

if (process.env.NODE_SQL_LOG) {
  options.logging.sqlLogger = logger.info;
}

var db = new Sequelize(config.db, options);
module.exports = db;
