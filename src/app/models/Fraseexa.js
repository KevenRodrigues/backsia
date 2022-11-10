import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Fraseexa extends Model {
    static init() {
        super.init(
            {
                frase_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Fraseexa',
                tableName: 'fraseexa',
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

        this.belongsTo(models.Frase, {
            foreignKey: 'id',
            as: 'frase',
        });
    }
}
