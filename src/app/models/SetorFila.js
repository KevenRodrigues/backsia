import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class SetorFila extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                prioridade: Sequelize.NUMBER,
                seqsenha: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'setorfila',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
