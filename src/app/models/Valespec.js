import Sequelize, { Model } from 'sequelize';

export default (sequelize, count) => class Valespec extends Model {
    static init() {
        super.init(
            {
                exame_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                plano_id: Sequelize.INTEGER,
                valorexa: Sequelize.NUMBER,
                codamb: Sequelize.STRING,
                percpac: Sequelize.NUMBER,
                percconv: Sequelize.NUMBER,
                valfilme: Sequelize.NUMBER,
                depara: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Valespec',
                tableName: 'valespec',
                timestamps: false,
            }
        );
        this.count = count;
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });
        this.belongsTo(models.Plano, {
            foreignKey: 'plano_id',
            as: 'plano',
        });
    }
}
