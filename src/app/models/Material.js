import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Material extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                codigo: Sequelize.STRING,
                deparamat: Sequelize.STRING,
                b2b: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
                incluir: Sequelize.VIRTUAL,
                alterar: Sequelize.VIRTUAL,
                deletar: Sequelize.VIRTUAL,
                consultar: Sequelize.VIRTUAL,
            },
            {
                sequelize,
                tableName: 'material',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
