import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Plcontas extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    fx1: Sequelize.NUMBER,
                    fx2: Sequelize.NUMBER,
                    fx3: Sequelize.NUMBER,
                    fx4: Sequelize.NUMBER,
                    status: Sequelize.INTEGER,
                    tp_mov: Sequelize.NUMBER,
                    tp_pl: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'pl_contas',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });

            this.belongsTo(models.Ccusto1, {
                foreignKey: 'id',
                as: 'ccusto1',
            });
        }
    };
