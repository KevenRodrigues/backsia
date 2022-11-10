import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Filtro extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    cursor: Sequelize.STRING,
                    filtro: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'filtro',
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
