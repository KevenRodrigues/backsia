import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Questaoexa extends Model {
    static init() {
        super.init(
            {
                questao_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Questaoexa',
                tableName: 'questaoexa',
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

        this.belongsTo(models.Questao, {
            foreignKey: 'id',
            as: 'questao',
        });
    }
}
