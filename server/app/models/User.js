var Sequelize = require('sequelize');
var db = require('../db');

var User = db.define('User', {
  // id: implied
  email: {
    type: Sequelize.STRING(128),
    allowNull: false,
    unique: {
      name: 'email',
      msg: 'There already is a user with this email address; please sign in instead'
    },
    validate: {
      isEmail: { msg: 'Please enter a valid email address' }
    }
  },
  username: {
    type: Sequelize.STRING(30),
    allowNull: false,
    unique: {
      name: 'username',
      msg: 'There already is a user with this username; please pick another one'
    },
    validate: {
      notEmpty: { msg: 'A username is required' },
      is: {
        args: /^\w[\w-]*\w$/,
        msg: 'Your username must only contain numbers, letters, and dashes (-) and be at least 2 characters long'
      }
    }
  },
  password: {
    type: Sequelize.STRING(60),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A password is required' }
    }
  },
  activationKey: { type: Sequelize.STRING(8), allowNull: false },
  activated: { type: Sequelize.BOOLEAN, defaultValue: 0, allowNull: false },
  apiElementModifyTime: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false }
});

module.exports = User;
