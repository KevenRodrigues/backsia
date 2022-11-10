import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Convenio_espec extends Model {
    static init() {
        super.init(
            {
                convenio_id: Sequelize.INTEGER,
                plano_id: Sequelize.INTEGER,
                esptab_id: Sequelize.INTEGER,
                valorch: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'convenio_espec',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Esptab, {
            foreignKey: 'esptab_id',
            as: 'esptab',
        });
        this.belongsTo(models.Plano, {
            foreignKey: 'plano_id',
            as: 'plano',
        });
    }
}
