import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Ccusto extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    pl_contas_id: Sequelize.INTEGER,
                    ordem: Sequelize.STRING,
                    novabusca: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'ccusto',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Plcontas, {
                foreignKey: 'pl_contas_id',
                as: 'plcontas',
            });

            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });

            this.hasMany(models.Ccusto1, {
                foreignKey: 'ccusto_id',
                as: 'ccusto1',
            });
        }
    };
