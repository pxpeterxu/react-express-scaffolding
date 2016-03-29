var config = require('./config');
var Sequelize = require('sequelize');
var logger = require('./libs/logger');

var options = {
  logging: false
};

if (process.env.NODE_SQL_LOG) {
  options.logging.sqlLogger = logger.info;
}

var db = new Sequelize(config.db, options);
module.exports = db;
