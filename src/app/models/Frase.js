import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Frase extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                exame_id: Sequelize.INTEGER,
                publica: Sequelize.NUMBER,
                codalfa: Sequelize.STRING,
                status: Sequelize.INTEGER,
                naogeral: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Frase',
                tableName: 'frase',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Fraseexa, {
            foreignKey: 'frase_id',
            as: 'fraseexa',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.belongsTo(models.Exame, { foreignKey: 'exame_id', as: 'exame' });
    }
}
