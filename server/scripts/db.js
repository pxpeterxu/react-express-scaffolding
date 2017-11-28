import requireDir from 'require-dir'; // eslint-disable-line import/no-extraneous-dependencies
import db from '../app/db';

requireDir('../app/models');
db.sync({ logging: console.log });
