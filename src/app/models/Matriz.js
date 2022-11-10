import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Matriz extends Model {
    static init() {
        super.init(
            {
                codigo: Sequelize.STRING,
                descricao: Sequelize.STRING,
                matriz: Sequelize.STRING,
                status: Sequelize.INTEGER,
                matrizrtf: Sequelize.TEXT,
                usamatrizrtf: Sequelize.NUMBER,
                layout_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'matriz',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });
    }
}
