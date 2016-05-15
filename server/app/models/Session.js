var Sequelize = require('sequelize');
var db = require('../db');

var Session = db.define('Session', {
  id: {
    type: Sequelize.STRING(255),
    primaryKey: true
  },
  expires: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false
  },
  data: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  charset: 'ascii_bin'
});

module.exports = Session;
