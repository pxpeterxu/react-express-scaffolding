var requireDir = require('require-dir');
var db = require('../app/db');

requireDir('../app/models');
db.sync({ logging: console.log });
