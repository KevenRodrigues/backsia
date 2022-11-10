import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Linhacusto extends Model {
    static init() {
        super.init(
            {
                linha_id: Sequelize.INTEGER,
                valor: Sequelize.NUMBER,
                descricao: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Linhacusto',
                tableName: 'linhacusto',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Linha, {
            foreignKey: 'id',
            as: 'linha',
        });
    }
}
