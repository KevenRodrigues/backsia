import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Pagar1 extends Model {
        static init() {
            super.init(
                {
                    contas_id: Sequelize.INTEGER,
                    valpag: Sequelize.NUMBER,
                    desconto: Sequelize.NUMBER,
                    pagar_id: Sequelize.INTEGER,
                    datvenc: Sequelize.DATE,
                    numche: Sequelize.STRING,
                    juros: Sequelize.NUMBER,
                    numbanco: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Pagar1',
                    tableName: 'pagar1',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Contas, {
                foreignKey: 'contas_id',
                as: 'contas',
            });
        }
    };
