import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Movcai extends Model {
        static init() {
            super.init(
                {
                    movpac_id: Sequelize.INTEGER,
                    caixa_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    amostra: Sequelize.STRING,
                    tippag: Sequelize.NUMBER,
                    banco_id: Sequelize.INTEGER,
                    cartao_id: Sequelize.INTEGER,
                    numero: Sequelize.STRING,
                    validade: Sequelize.STRING,
                    valpag: Sequelize.NUMBER,
                    obs: Sequelize.STRING,
                    dtvenc: Sequelize.DATE,
                    descricao: Sequelize.STRING,
                    gerarecebe: Sequelize.NUMBER,
                    perc_tx_cartao: Sequelize.NUMBER,
                    valor_tx_cartao: Sequelize.NUMBER,
                    dtpagam: Sequelize.DATE,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'movcai',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Movpac, {
                foreignKey: 'movpac_id',
                as: 'movpac',
            });
            this.belongsTo(models.Caixa, {
                foreignKey: 'caixa_id',
                as: 'caixa',
            });
            this.belongsTo(models.Operador, {
                foreignKey: 'operador_id',
                as: 'operador',
            });
            this.belongsTo(models.Banco, {
                foreignKey: 'banco_id',
                as: 'banco',
            });
            this.belongsTo(models.Cartao, {
                foreignKey: 'cartao_id',
                as: 'cartao',
            });
        }
    };
