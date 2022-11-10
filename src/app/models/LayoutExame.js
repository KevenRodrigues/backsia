import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class LayoutExame extends Model {
    static init() {
        super.init(
            {
                layout_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'LayoutExame',
                tableName: 'layout_exame',
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
        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });
    }
}
