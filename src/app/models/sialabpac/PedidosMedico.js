import Sequelize, { Model } from 'sequelize';

class Pedidosmedico extends Model {
    static init(sequelize) {
        super.init(
            {
                name: Sequelize.STRING,
                key: Sequelize.STRING,
                url: Sequelize.STRING,
                preagendado_id: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'PedidosMedico',
                tableName: 'pedidosmedicos',
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Preagendado, {
            foreignKey: 'id',
            as: 'preagendado',
        });
    }
}

export default Pedidosmedico;
