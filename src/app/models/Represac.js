import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Represac extends Model {
        static init() {
            super.init(
                {
                    perc: Sequelize.NUMBER,
                    semimp: Sequelize.INTEGER,
                    repre_id: Sequelize.INTEGER,
                    sacado_id: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Represac',
                    tableName: 'represac',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        static associate(models) {
            this.belongsTo(models.Convenio, {
                foreignKey: 'sacado_id',
                as: 'convenio',
            });

            this.belongsTo(models.Repre, {
                foreignKey: 'repre_id',
                as: 'repre',
            });
        }
    };
