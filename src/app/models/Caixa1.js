import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Caixa1 extends Model {
        static init() {
            super.init(
                {
                    forpag_id: Sequelize.INTEGER,
                    valfor: Sequelize.NUMBER,
                    tipfor: Sequelize.NUMBER,
                    obscai: Sequelize.STRING,
                    caixa_id: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'caixa1',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Caixa, {
                foreignKey: 'caixa_id',
                as: 'caixa',
            });
        }
    };
