import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Setor extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                responsavel: Sequelize.STRING,
                status: Sequelize.INTEGER,
                impmap: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
                incluir: Sequelize.VIRTUAL,
                alterar: Sequelize.VIRTUAL,
                deletar: Sequelize.VIRTUAL,
                consultar: Sequelize.VIRTUAL,
            },
            {
                sequelize,
                tableName: 'setor',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}