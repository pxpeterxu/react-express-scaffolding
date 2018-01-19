// @flow
import Sequelize from 'sequelize';
import promisify from 'es6-promisify';
import bcrypt from 'bcryptjs';

import db from '../db';

const hash = promisify(bcrypt.hash.bind(bcrypt));
const compare = promisify(bcrypt.compare.bind(bcrypt));

const User = db.define('User', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  accountId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
  },
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
}, {
  indexes: [{
    name: 'email',
    fields: ['email'],
    unique: true
  }],
});

User.prototype.comparePassword = function(password: string) {
  return compare(password, this.password);
};

User.hashPassword = function(password: string) {
  return hash(password, 10);
};

User.comparePassword = function(password: string, hash: string) {
  return compare(password, hash);
};

export default User;
