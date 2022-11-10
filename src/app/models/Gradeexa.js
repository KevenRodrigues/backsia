import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Gradeexa extends Model {
        static init() {
            super.init(
                {
                    grade_id: Sequelize.INTEGER,
                    exame_id: Sequelize.INTEGER,
                    ordem: { type: Sequelize.STRING, defaultValue: '000' },
                    bilirrubina: { type: Sequelize.INTEGER, defaultValue: 0 },
                    lipidograma: { type: Sequelize.INTEGER, defaultValue: 0 },
                    coagulograma: { type: Sequelize.INTEGER, defaultValue: 0 },
                    ttromboplastina: {
                        type: Sequelize.INTEGER,
                        defaultValue: 0,
                    },
                    tprotrombina: { type: Sequelize.INTEGER, defaultValue: 0 },
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Gradeexa',
                    tableName: 'gradeexa',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        static associate(models) {
            this.belongsTo(models.Exame, {
                foreignKey: 'exame_id',
                as: 'exame',
            });

            this.belongsTo(models.Grade, {
                foreignKey: 'id',
                as: 'grade',
            });
        }
    };
