import Sequelize, { Model } from 'sequelize';

class Preagendado extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: Sequelize.INTEGER,
                laboratorio_id: Sequelize.INTEGER,
                unidade_id: Sequelize.INTEGER,
                prontuario_id: Sequelize.INTEGER,
                tipoatendimento: Sequelize.STRING,
                status: Sequelize.STRING,
                canceled_at: Sequelize.DATE,
                orcamento_id: Sequelize.INTEGER,
                ebanx_hash: Sequelize.INTEGER,
                ebanx_valor: Sequelize.NUMBER,
                ebanx_datapag: Sequelize.DATE,
                ebanx_cartao: Sequelize.INTEGER,
                ebanx_parcelas: Sequelize.INTEGER,
                ebanx_codigo: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Preagendado',
                tableName: 'preagendados',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasOne(models.PedidosMedico, {
            foreignKey: 'preagendado_id',
            as: 'pedidosmedico',
        });
        this.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
        });
        this.belongsTo(models.Laboratorio, {
            foreignKey: 'laboratorio_id',
            as: 'laboratorio',
        });
        this.belongsTo(models.Unidade, {
            foreignKey: 'unidade_id',
            as: 'unidade',
        });
    }
}

export default Preagendado;
