import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Examecusto extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                produto_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'examecusto',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });
        this.belongsTo(models.Produto, {
            foreignKey: 'produto_id',
            as: 'produto',
        });
    }
}
