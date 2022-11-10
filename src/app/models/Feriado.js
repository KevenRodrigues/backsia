import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Feriado extends Model {
    static init() {
        super.init(
            {
                data: Sequelize.STRING,
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'feriado',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
