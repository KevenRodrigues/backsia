import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Layout extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                exame_id: Sequelize.INTEGER,
                mascara: Sequelize.STRING,
                formula: Sequelize.STRING,
                formulaweb: Sequelize.STRING,
                ranger: Sequelize.STRING,
                status: Sequelize.INTEGER,
                usaranger: Sequelize.NUMBER,
                padrao: Sequelize.NUMBER,
                alterna: Sequelize.STRING,
                usagraf: Sequelize.NUMBER,
                usarangertexto: Sequelize.NUMBER,
                deixavazio: Sequelize.NUMBER,
                tira_colchete: Sequelize.NUMBER,
                dec: Sequelize.NUMBER,
                formatohp: Sequelize.STRING,
                vrblocob2b: Sequelize.TEXT,
                notab2b: Sequelize.TEXT,
                metodo_id: Sequelize.INTEGER,
                campo_grafico: Sequelize.NUMBER,
                usa_resul_atu_graf: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
                usajson_ant_portal: Sequelize.NUMBER,
                vrblocob2b_env: Sequelize.TEXT,
                notab2b_env: Sequelize.TEXT,
                metodo_id_env: Sequelize.INTEGER,
                vrblocob2b_sia: Sequelize.TEXT,
                notab2b_sia: Sequelize.TEXT,
            },
            {
                sequelize,
                modelName: 'Layout',
                tableName: 'layout',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.belongsTo(models.Metodo, {
            foreignKey: 'metodo_id',
            as: 'metodo',
        });
        this.belongsTo(models.Metodo, {
            foreignKey: 'metodo_id_env',
            as: 'metodo_env',
        });
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });
        this.hasMany(models.LayoutExame, {
            foreignKey: 'layout_id',
            as: 'layout_exame',
        });
        this.hasMany(models.Layoutparam, {
            foreignKey: 'layout_id',
            as: 'layout_param',
        });
        this.hasMany(models.Layoutparamenv, {
            foreignKey: 'layout_id',
            as: 'layout_param_env',
        });
        this.hasMany(models.Layoutparamsia, {
            foreignKey: 'layout_id',
            as: 'layout_param_sia',
        });
    }
}
