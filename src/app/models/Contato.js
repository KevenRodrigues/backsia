import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Contato extends Model {
    static init() {
        super.init(
            {
                nome: Sequelize.STRING,
                fone: Sequelize.STRING,
                fax: Sequelize.STRING,
                email: Sequelize.STRING,
                funcao: Sequelize.STRING,
                ramal: Sequelize.STRING,
                cel: Sequelize.STRING,
                ddd: Sequelize.STRING,
                datanasc: Sequelize.DATE,
                convenio_id: Sequelize.INTEGER,
                obs: Sequelize.STRING,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'contato',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
