import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Entrega extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    codigo: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    gerainter: Sequelize.NUMBER,
                    naoimprime: Sequelize.NUMBER,
                    impbmp: Sequelize.NUMBER,
                    naogeradeve: Sequelize.NUMBER,
                    gerainterent: Sequelize.NUMBER,
                    loginent: Sequelize.STRING,
                    senhainterent: Sequelize.STRING,
                    naogerapac: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'entrega',
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
        }
    };
