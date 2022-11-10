import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Examealt extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                layout_id: Sequelize.INTEGER,
                apoio_id: Sequelize.INTEGER,
                material_id: Sequelize.INTEGER,
                idade_ini: Sequelize.NUMBER,
                mes_ini: Sequelize.NUMBER,
                dia_ini: Sequelize.NUMBER,
                idade_fin: Sequelize.NUMBER,
                mes_fin: Sequelize.NUMBER,
                dia_fin: Sequelize.NUMBER,
                sexo: Sequelize.STRING,
                alterna: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'examealt',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });
        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });
        this.belongsTo(models.Apoio, {
            foreignKey: 'apoio_id',
            as: 'apoio',
        });
        this.belongsTo(models.Material, {
            foreignKey: 'material_id',
            as: 'material',
        });
    }
}
