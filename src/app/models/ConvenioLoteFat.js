import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class ConvenioLoteFat extends Model {
    static init() {
        super.init(
            {
                lotefat_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                operador_id: Sequelize.INTEGER,
                status: Sequelize.STRING,
                data: Sequelize.DATE,
                hora: Sequelize.STRING,
                datafecha: Sequelize.DATE,
                horafecha: Sequelize.STRING,
                operador_id_fecha: Sequelize.INTEGER,
                mesref: Sequelize.STRING,
                anoref: Sequelize.STRING,
                valtotlote: Sequelize.NUMBER,
                consulta: Sequelize.STRING,
                lotexml_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'ConvenioLoteFat',
                tableName: 'convenio_lotefat',
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
