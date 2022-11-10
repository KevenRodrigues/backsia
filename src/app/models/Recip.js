import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Recip extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                tubo: Sequelize.NUMBER,
                naoimpetq: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                isolado: Sequelize.NUMBER,
                caminhoimg: Sequelize.STRING,
                caminhoimg_key: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'recip',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
