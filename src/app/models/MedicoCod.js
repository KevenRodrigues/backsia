import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class MedicoCod extends Model {
    static init() {
        super.init(
            {
                medico_id:Sequelize.INTEGER,
                convenio_id:Sequelize.INTEGER,
                medicocod:Sequelize.STRING,
                idopera_ultacao:Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'MedicoCod',
                tableName: 'medicocod',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });

        this.belongsTo(models.Medico, {
            foreignKey: 'id',
            as: 'medico',
        });
    }
}
