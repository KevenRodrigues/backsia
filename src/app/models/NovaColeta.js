import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class NovaColeta extends Model {
        static init() {
            super.init(
                {
                    posto: Sequelize.CHAR(3),
                    amostra: Sequelize.CHAR(6),
                    nome: Sequelize.STRING,
                    motivo_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    nomopera: Sequelize.STRING,
                    fechado: Sequelize.NUMBER,
                    andamento: Sequelize.TEXT,
                    obsmot: Sequelize.STRING,
                    obscol: Sequelize.STRING,
                    status: Sequelize.CHAR(2),
                    movpac_id: Sequelize.INTEGER,
                    exame_id: Sequelize.INTEGER,
                    datasolic: Sequelize.DATE,
                    exames: Sequelize.TEXT,
                    movexa_id: Sequelize.INTEGER,
                    nome_social: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                    codpedapoio: Sequelize.STRING,
                    total: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    tableName: 'novacol',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Motivo, {
                foreignKey: 'motivo_id',
                as: 'motivo',
            });

            this.belongsTo(models.Exame, {
                foreignKey: 'exame_id',
                as: 'exame',
            });

            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });

            this.belongsTo(models.Movpac, {
                foreignKey: 'movpac_id',
                as: 'movpac',
            });
        }
    };
