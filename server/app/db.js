import Sequelize from 'sequelize';
import config from './config';
import logger from './libs/logger';

const options = {
  logging: false
};

if (process.env.NODE_SQL_LOG) {
  options.logging.sqlLogger = logger.info;
}

const db = new Sequelize(config.db, options);
export default db;
