import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Naofatura extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                plano_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'naofatura',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });
        this.belongsTo(models.Plano, {
            foreignKey: 'plano_id',
            as: 'plano',
        });
    }
}