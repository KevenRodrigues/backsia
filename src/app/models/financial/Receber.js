import Sequelize, { Model } from 'sequelize';

class Receber extends Model {
    static init(sequelize) {
        super.init(
            {
                numerodoc: Sequelize.STRING,
                parcela: Sequelize.STRING,
                vencimento: Sequelize.DATE,
                datent: Sequelize.DATE,
                totpago: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                sacado_id: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Receber',
                tableName: 'receber',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Sacado, {
            foreignKey: 'sacado_id',
            as: 'sacado',
        });
    }
}

export default Receber;
