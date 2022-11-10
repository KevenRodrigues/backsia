import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Esptab extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                codigo: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'esptab',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Convenio_espec, {
            foreignKey: 'esptab_id',
            as: 'convenio_espec',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
