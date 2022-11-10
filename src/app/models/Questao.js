import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Questao extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                obriga: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Questao',
                tableName: 'questao',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Questaoexa, {
            foreignKey: 'questao_id',
            as: 'questaoexa',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}