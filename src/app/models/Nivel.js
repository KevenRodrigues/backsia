import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Nivel extends Model {
        static init() {
            super.init(
                {
                    nome: Sequelize.STRING,
                },
                {
                    sequelize,
                    tableName: 'operador',
                    timestamps: false,
                }
            );
            return this;
        }
    };
