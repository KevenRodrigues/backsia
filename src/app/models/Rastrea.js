import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Rastrea extends Model {
    static init() {
        super.init(
            {
                movexa_id: Sequelize.STRING,
                data: Sequelize.DATE,
                hora: Sequelize.STRING,
                operador_id: Sequelize.INTEGER,
                acao: Sequelize.STRING,
                maquina: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'rastrea',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Operador, {
            foreignKey: 'operador_id',
            as: 'operador',
        });
        this.belongsTo(models.Movexa, {
            foreignKey: 'movexa_id',
            as: 'movexa',
        });
    }
}