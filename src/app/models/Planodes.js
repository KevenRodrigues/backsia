import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Planodes extends Model {
    static init() {
        super.init(
            {
                plano_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                faixaini: Sequelize.NUMBER,
                faixafin: Sequelize.NUMBER,
                porcdesc: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'planodes',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Plano, {
            foreignKey: 'plano_id',
            as: 'plano',
        });
    }
}
