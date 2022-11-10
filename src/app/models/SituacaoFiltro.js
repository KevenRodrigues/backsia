import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class SituacaoFiltro extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                comando: Sequelize.TEXT,
                tipo_filtro: Sequelize.INTEGER,
                status: Sequelize.INTEGER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'filtro_situacao',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}