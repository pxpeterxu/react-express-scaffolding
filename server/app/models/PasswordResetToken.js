import Sequelize from 'sequelize';
import User from './User';
import db from '../db';

const PasswordResetToken = db.define('PasswordResetToken', {
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

PasswordResetToken.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });
export default PasswordResetToken;
