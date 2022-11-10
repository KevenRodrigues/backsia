import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Receber1 extends Model {
        static init() {
            super.init(
                {
                    contas_id: Sequelize.INTEGER,
                    valpag: Sequelize.NUMBER,
                    desconto: Sequelize.NUMBER,
                    receber_id: Sequelize.INTEGER,
                    datvenc: Sequelize.DATE,
                    numche: Sequelize.STRING,
                    juros: Sequelize.NUMBER,
                    numbanco: Sequelize.STRING,
                    tippag: Sequelize.NUMBER,
                    observ: Sequelize.STRING,
                    valglosa: Sequelize.NUMBER,
                    perc_cartao_db: Sequelize.NUMBER,
                    valor_cartao_db: Sequelize.NUMBER,
                    perc_cartao_cr: Sequelize.NUMBER,
                    valor_cartao_cr: Sequelize.NUMBER,
                    conciliacao_id: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Receber1',
                    tableName: 'receber1',
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
            this.belongsTo(models.Receber, {
                foreignKey: 'receber_id',
                as: 'receber',
            });
        }
    };
