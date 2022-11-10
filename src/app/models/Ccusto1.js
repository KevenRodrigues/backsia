import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Ccusto1 extends Model {
        static init() {
            super.init(
                {
                    ccusto_id: Sequelize.INTEGER,
                    pl_contas_id: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Ccusto1',
                    tableName: 'ccusto1',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        static associate(models) {
            this.belongsTo(models.Ccusto, {
                foreignKey: 'id',
                as: 'ccusto',
            });

            this.belongsTo(models.Plcontas, {
                foreignKey: 'pl_contas_id',
                as: 'plcontas',
            });
        }
    };
