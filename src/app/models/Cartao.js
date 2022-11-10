import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Cartao extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    perc_venda: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'cartao',
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
