import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class ConvenioTiss extends Model {
    static init() {
        super.init(
            {
                convenio_id: Sequelize.INTEGER,
                data_ger: Sequelize.DATE,
                hora_ger: Sequelize.CHAR(5),
                dataini: Sequelize.DATE,
                datafin: Sequelize.DATE,
                operador_id: Sequelize.INTEGER,
                arquivo: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER
            },
            {
                sequelize,
                modelName: 'ConvenioTiss',
                tableName: 'convenio_tiss',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });
    }
}
