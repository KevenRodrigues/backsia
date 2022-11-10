import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Malote extends Model {
    static init() {
        super.init(
            {
                data: Sequelize.DATE,
                hora: Sequelize.STRING,
                operador_id: Sequelize.INTEGER,
                qtdtubos: Sequelize.INTEGER,
                status: Sequelize.INTEGER,
                posto: Sequelize.STRING,
                enviado: Sequelize.NUMBER,
                recebido: Sequelize.NUMBER,
                dt_enviado_malote: Sequelize.DATE,
                dt_recebido_malote: Sequelize.DATE,
                hr_enviado_malote: Sequelize.STRING,
                hr_recebido_malote: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'malote',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
