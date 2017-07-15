import Sequelize from 'sequelize';
import db from '../db';

let PasswordResetToken = db.define('PasswordResetToken', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false
  },
  token: {
    type: Sequelize.STRING(32),
    allowNull: false,
    unique: true
  }
});

export default PasswordResetToken;

// At bottom of file due to circular requires
import User from './User';
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });
