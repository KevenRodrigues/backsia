import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Pagar2 extends Model {
        static init() {
            super.init(
                {
                    ccusto_id: Sequelize.INTEGER,
                    plcontas_id: Sequelize.INTEGER,
                    valor: Sequelize.NUMBER,
                    pagar_id: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Pagar2',
                    tableName: 'pagar2',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Ccusto, {
                foreignKey: 'ccusto_id',
                as: 'ccusto',
            });
            this.belongsTo(models.Plcontas, {
                foreignKey: 'plcontas_id',
                as: 'plcontas',
            });
        }
    };
