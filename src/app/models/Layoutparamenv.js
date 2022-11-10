import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Layoutparamenv extends Model {
    static init() {
        super.init(
            {
                param: Sequelize.STRING,
                descricao: Sequelize.STRING,
                ordem: Sequelize.STRING,
                layout_id: Sequelize.INTEGER,
                transf_ponto_inter: Sequelize.NUMBER,
                unidadeb2b: Sequelize.STRING,
                tiporesb2b: Sequelize.STRING,
                tamanhob2b: Sequelize.STRING,
                casasdecib2b: Sequelize.STRING,
                calc_param: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Layoutparamenv',
                tableName: 'layout_param_env',
                timestamps: false,
            }
        );
        return this;
    }
}
