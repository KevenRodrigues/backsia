import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Tags extends Model {
    static init() {
        super.init(
            {
                codigo: Sequelize.STRING,
                descricao: Sequelize.STRING,
                comando: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'tags',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}