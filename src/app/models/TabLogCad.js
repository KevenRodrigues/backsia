import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class TabLogCad extends Model {
    static init() {
        super.init(
            {
                tabela: Sequelize.STRING,
                idreg: Sequelize.INTEGER,
                idopera: Sequelize.INTEGER,
                acao: Sequelize.STRING,
                motivo: Sequelize.STRING,
                data: Sequelize.DATE,
                hora: Sequelize.STRING,
                maquina: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
                tabelapai: Sequelize.STRING,
                idregpai: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'tab_logcad',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Operador, {
            foreignKey: 'idopera',
            as: 'operador',
        });
    }
}