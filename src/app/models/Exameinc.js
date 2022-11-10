import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Exameinc extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                exame_id_inc: Sequelize.INTEGER,
                fatura: Sequelize.NUMBER,
                naofatura: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'exameinc',
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
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id_inc',
            as: 'exame_inc',
        });
    }
}
