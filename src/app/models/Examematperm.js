import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Examematperm extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                material_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'examematperm',
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
        this.belongsTo(models.Material, {
            foreignKey: 'material_id',
            as: 'examematperm',
        });
    }
}
