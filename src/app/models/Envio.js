import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Envio extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    codigo: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                    incluir: Sequelize.VIRTUAL,
                    alterar: Sequelize.VIRTUAL,
                    deletar: Sequelize.VIRTUAL,
                    consultar: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    tableName: 'envio',
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
