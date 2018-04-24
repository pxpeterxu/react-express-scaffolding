// @flow
import Sequelize from 'sequelize';

/** Truncate relevant tables for a test. Usually used in beforeAll() */
export function truncateTables(models: Array<Sequelize.Model>) {
  return Promise.all(
    models.map(model => model.destroy({ truncate: { cascade: true } }))
  );
}

export default { truncateTables };
