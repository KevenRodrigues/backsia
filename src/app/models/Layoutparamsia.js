import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Layoutparamsia extends Model {
    static init() {
        super.init(
            {
                linha: Sequelize.STRING,
                tipores: Sequelize.STRING,
                tipocampo: Sequelize.STRING,
                qtd_casas_esquerda: Sequelize.STRING,
                qtd_casas_decimais: Sequelize.STRING,
                separa_pontos: Sequelize.STRING,
                calculo: Sequelize.STRING,
                tipocampo2: Sequelize.STRING,
                qtd_casas_esquerda2: Sequelize.STRING,
                qtd_casas_decimais2: Sequelize.STRING,
                separa_pontos2: Sequelize.STRING,
                calculo2: Sequelize.STRING,
                descricao: Sequelize.STRING,
                resultado: Sequelize.STRING,
                unidade: Sequelize.STRING,
                valorref: Sequelize.STRING,
                valorreftext: Sequelize.TEXT,
                resultado2: Sequelize.STRING,
                unidade2: Sequelize.STRING,
                valorref2: Sequelize.STRING,
                valorreftext2: Sequelize.TEXT,
                material_id: Sequelize.STRING,
                metodo_id: Sequelize.STRING,
                layout_id: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Layoutparamsia',
                tableName: 'layout_param_sia',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Material, {
            foreignKey: 'material_id',
            as: 'material',
        });
        this.belongsTo(models.Metodo, {
            foreignKey: 'metodo_id',
            as: 'metodo',
        });
        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });
    }
}
