import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Examatmed extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                matmed_id: Sequelize.INTEGER,
                valor: Sequelize.NUMBER,
                qtd: Sequelize.NUMBER,
                marca: Sequelize.STRING,
                unid: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'examatmed',
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
        this.belongsTo(models.Matmed, {
            foreignKey: 'matmed_id',
            as: 'matmed',
        });
    }
}
