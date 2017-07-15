import config from './config';
import Sequelize from 'sequelize';
import logger from './libs/logger';

let options = {
  logging: false
};

if (process.env.NODE_SQL_LOG) {
  options.logging.sqlLogger = logger.info;
}

let db = new Sequelize(config.db, options);
export default db;
