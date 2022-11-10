import Sequelize, { Model } from 'sequelize';

class Pagarme extends Model {
    static init(sequelize) {
        super.init(
            {
                codigo: Sequelize.STRING,
                titulo: Sequelize.STRING,
                descricao: Sequelize.TEXT,
            },
            {
                sequelize,
                modelName: 'Pagarme',
                tableName: 'pagarme',
                timestamps: false,
            }
        );
        return this;
    }
}

export default Pagarme;
