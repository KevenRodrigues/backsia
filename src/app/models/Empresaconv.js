import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Empresaconv extends Model {
    static init() {
        super.init(
            {
                empresa_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                codeletron: Sequelize.STRING,
                codconv: Sequelize.STRING,
                registro: Sequelize.STRING,
                codconvcon: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Empresaconv',
                tableName: 'empresaconv',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Empresa, {
            foreignKey: 'id',
            as: 'empresa',
        });
        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });
    }
}
