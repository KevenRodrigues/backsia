import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Tablogcai extends Model {
        static init() {
            super.init(
                {
                    caixa_id: Sequelize.INTEGER,
                    opera_id: Sequelize.INTEGER,
                    acao: Sequelize.STRING,
                    motivo: Sequelize.STRING,
                    data: Sequelize.DATE,
                    hora: Sequelize.STRING,
                    descricao: Sequelize.STRING,
                    valpag: Sequelize.NUMBER,
                    movpac_id: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    amostra: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'tab_logcai',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Operador, {
                foreignKey: 'opera_id',
                as: 'operador',
            });
        }
    };
