import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Repre extends Model {
        static init() {
            super.init(
                {
                    nome: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    perc: Sequelize.NUMBER,
                    tiporepre: Sequelize.INTEGER,
                    banco: Sequelize.STRING,
                    agencia: Sequelize.STRING,
                    corrente: Sequelize.STRING,
                    ret465: Sequelize.NUMBER,
                    retrepre465: Sequelize.NUMBER,
                    ret150: Sequelize.NUMBER,
                    retrepre150: Sequelize.NUMBER,
                    cgc_cpf: Sequelize.STRING,
                    tipoded: Sequelize.NUMBER,
                    percded: Sequelize.NUMBER,
                    for_id: Sequelize.INTEGER,
                    ban_id: Sequelize.INTEGER,
                    cen_id: Sequelize.INTEGER,
                    pl_id: Sequelize.INTEGER,
                    desccontas: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Repre',
                    tableName: 'repre',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela Representante
        static associate(models) {
            this.hasMany(models.Represac, {
                foreignKey: 'repre_id',
                as: 'repre',
            });
        }
    };
