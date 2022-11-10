import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Porte extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                codigo: Sequelize.STRING,
                valor: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'porte',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
