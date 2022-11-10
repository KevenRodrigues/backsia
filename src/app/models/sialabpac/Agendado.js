import Sequelize, { Model } from 'sequelize';

class Agendado extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: Sequelize.INTEGER,
                laboratorio_id: Sequelize.INTEGER,
                unidade_id: Sequelize.INTEGER,
                orcamento_id: Sequelize.STRING,
                datacoleta: Sequelize.DATE,
                preagendado_id: Sequelize.INTEGER,
                motivo_cancela: Sequelize.STRING,
            },
            {
                sequelize,
                modelName: 'Agendado',
                tableName: 'agendados',
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Agendadoexm, {
            foreignKey: 'agendado_id',
            as: 'agendadoexm',
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

export default Agendado;
