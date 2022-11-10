import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Eqp extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                dirtxt: Sequelize.STRING,
                amostrainter: Sequelize.STRING,
                nome: Sequelize.STRING,
                dirresul: Sequelize.STRING,
                dirresulbkp: Sequelize.STRING,
                maquina: Sequelize.STRING,
                postos: Sequelize.STRING,
                extensao_mtx_eqp: Sequelize.STRING,
                dirgraficohexa: Sequelize.STRING,
                tp_arqinter_eqp: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Eqp',
                tableName: 'eqp',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Eqpexa, {
            foreignKey: 'eqp_id',
            as: 'eqpexa',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
