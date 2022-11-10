import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class ConvenioSus extends Model {
    static init() {
        super.init(
            {
                convenio_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'ConvenioSus',
                tableName: 'convenio_cns',
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

        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });
    }
}