import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Limite extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                plano_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                qtd: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'limite',
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
        this.belongsTo(models.Plano, {
            foreignKey: 'plano_id',
            as: 'plano',
        });
    }
}
