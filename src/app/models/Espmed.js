import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Espmed extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                cnes: Sequelize.STRING,
                cnes2: Sequelize.STRING,
                cbos3: Sequelize.STRING,
                cons: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'espmed',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
