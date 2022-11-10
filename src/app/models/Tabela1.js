import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Tabela1 extends Model {
    static init() {
        super.init(
            {
                tabela_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                valorexa: Sequelize.NUMBER,
                codamb: Sequelize.STRING,
                valorfilme: Sequelize.NUMBER,
                peso_porte: Sequelize.NUMBER,
                peso_uco: Sequelize.NUMBER,
                depara3exame: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
                codproc: Sequelize.STRING,
                descproc: Sequelize.STRING,
            },
            {
                sequelize,
                tableName: 'tabela1',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });
        this.belongsTo(models.Tabela, {
            foreignKey: 'tabela_id',
            as: 'tabela',
        });
    }
}
