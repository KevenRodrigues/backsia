import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Apoiopos extends Model {
        static init() {
            super.init(
                {
                    apoio_id: Sequelize.INTEGER,
                    posto_id: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    codlab: Sequelize.STRING,
                    senhalab: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Apoiopos',
                    tableName: 'apoiopos',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        static associate(models) {
            this.belongsTo(models.Posto, {
                foreignKey: 'posto_id',
                as: 'Posto',
            });

            this.belongsTo(models.Apoio, {
                foreignKey: 'id',
                as: 'apoio',
            });
        }
    };
