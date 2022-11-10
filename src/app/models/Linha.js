import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Linha extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Linha',
                tableName: 'linha',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Linhacusto, {
            foreignKey: 'linha_id',
            as: 'linhacusto',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
