import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class EmailEnviadoAtendimento extends Model {
    static init() {
        super.init(
            {
                movpac_id: Sequelize.NUMBER,
                has_sent: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'EmailEnviadoAtendimento',
                tableName: 'email_enviado_atendimento',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
