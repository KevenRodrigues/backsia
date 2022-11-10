import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Caixa extends Model {
        static init() {
            super.init(
                {
                    operador_id: Sequelize.INTEGER,
                    datcai: Sequelize.DATE,
                    sitcai: Sequelize.STRING,
                    valini: Sequelize.NUMBER,
                    valfin: Sequelize.NUMBER,
                    dt_abertura: Sequelize.DATE,
                    hr_abertura: Sequelize.STRING,
                    dt_fechamento: Sequelize.DATE,
                    hr_fechamento: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'caixa',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Operador, {
                foreignKey: 'operador_id',
                as: 'operador',
            });
            this.hasMany(models.Caixa1, {
                foreignKey: 'caixa_id',
                as: 'caixa1',
            });
        }
    };
