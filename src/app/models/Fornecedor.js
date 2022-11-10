import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Fornecedor extends Model {
        static init() {
            super.init(
                {
                    razao: Sequelize.STRING,
                    fantasia: Sequelize.STRING,
                    endereco: Sequelize.STRING,
                    bairro: Sequelize.STRING,
                    cep: Sequelize.STRING,
                    uf: Sequelize.STRING,
                    cidade: Sequelize.STRING,
                    fone: Sequelize.STRING,
                    fax: Sequelize.STRING,
                    email: Sequelize.STRING,
                    contato: Sequelize.STRING,
                    cgc_cpf: Sequelize.STRING,
                    ie: Sequelize.STRING,
                    obs: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    banc: Sequelize.STRING,
                    historico: Sequelize.STRING,
                    im: Sequelize.STRING,
                    pl_contas_id: Sequelize.INTEGER,
                    ccusto_id: Sequelize.INTEGER,
                    qualidade: Sequelize.NUMBER,
                    logistica: Sequelize.NUMBER,
                    competitivo: Sequelize.NUMBER,
                    exclusivo: Sequelize.NUMBER,
                    datquali: Sequelize.DATE,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'fornecedor',
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

            this.belongsTo(models.Plcontas, {
                foreignKey: 'pl_contas_id',
                as: 'plcontas',
            });

            this.belongsTo(models.Ccusto, {
                foreignKey: 'ccusto_id',
                as: 'ccusto',
            });
        }
    };
