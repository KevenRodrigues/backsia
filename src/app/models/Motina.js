import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Motina extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                    incluir: Sequelize.VIRTUAL,
                    alterar: Sequelize.VIRTUAL,
                    deletar: Sequelize.VIRTUAL,
                    consultar: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    tableName: 'motina',
                    timestamps: false,
                }
            );
            return this;
        }
    };
