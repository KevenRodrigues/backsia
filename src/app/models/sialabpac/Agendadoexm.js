import Sequelize, { Model } from 'sequelize';

class Agendadoexm extends Model {
    static init(sequelize) {
        super.init(
            {
                agendado_id: Sequelize.INTEGER,
                nomeexm: Sequelize.STRING,
                preparoexm: Sequelize.STRING,
            },
            {
                sequelize,
                modelName: 'Agendadoexm',
                tableName: 'agendadosexms',
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Agendado, {
            foreignKey: 'id',
            as: 'agendado',
        });
    }
}

export default Agendadoexm;
