import User from './User';
import PasswordResetToken from './PasswordResetToken';

User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });
