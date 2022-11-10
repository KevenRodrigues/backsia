import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class TabLogReg extends Model {
    static init() {
        super.init(
            {
                tabela: Sequelize.STRING,
                idreg: Sequelize.INTEGER,
                idopera: Sequelize.INTEGER,
                field: Sequelize.STRING,
                data: Sequelize.DATE,
                hora: Sequelize.STRING,
                oldval: Sequelize.STRING,
                newval: Sequelize.STRING,
                maquina: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'tab_logreg',
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
