import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Rotina extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
                qtdias: Sequelize.NUMBER,
                qthoras: Sequelize.STRING,
                segunda: Sequelize.NUMBER,
                terca: Sequelize.NUMBER,
                quarta: Sequelize.NUMBER,
                quinta: Sequelize.NUMBER,
                sexta: Sequelize.NUMBER,
                sabado: Sequelize.NUMBER,
                domingo: Sequelize.NUMBER,
                dias: Sequelize.NUMBER,
            },
            {
                sequelize,
                tableName: 'rotina',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
