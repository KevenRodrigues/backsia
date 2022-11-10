import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Situacao extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                codigo: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'situacao',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
