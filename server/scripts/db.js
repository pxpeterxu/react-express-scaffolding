import requireDir from 'require-dir';
import db from '../app/db';

requireDir('../app/models');
db.sync({ logging: console.log });
