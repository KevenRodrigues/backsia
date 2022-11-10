import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Tabela extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                status: Sequelize.INTEGER,
                depara: Sequelize.STRING,
                depara3: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
                inc_tabela1: Sequelize.NUMBER,
            },
            {
                sequelize,
                tableName: 'tabela',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.hasMany(models.Tabela1, {
            foreignKey: 'tabela_id',
            as: 'tabela1',
        });
    }
}
