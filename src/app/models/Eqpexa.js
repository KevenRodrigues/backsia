import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Eqpexa extends Model {
    static init() {
        super.init(
            {
                eqp_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                status: Sequelize.INTEGER,
                layout_id: Sequelize.INTEGER,
                envant: Sequelize.NUMBER,
                ishemog: Sequelize.NUMBER,
                isatb: Sequelize.NUMBER,
                nomeexaeqp: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Eqpexa',
                tableName: 'eqpexa',
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

        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });

        this.belongsTo(models.Eqp, {
            foreignKey: 'id',
            as: 'eqp',
        });
    }
}
