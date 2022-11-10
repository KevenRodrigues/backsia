import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Movapoio extends Model {
        static init() {
            super.init(
                {
                    posto: Sequelize.STRING,
                    amostra: Sequelize.STRING,
                    exame_id: Sequelize.INTEGER,
                    movpac_id: Sequelize.INTEGER,
                    movexa_id: Sequelize.INTEGER,
                    apoio_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    data: Sequelize.DATEONLY,
                    hora: Sequelize.STRING,
                    arquivo: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'movapoio',
                    timestamps: false,
                }
            );
            return this;
        }
    };
