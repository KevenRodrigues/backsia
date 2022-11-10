import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Triagem extends Model {
        static init() {
            super.init(
                {
                    movpac_id: Sequelize.INTEGER,
                    movexa_id: Sequelize.INTEGER,
                    exame_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    prontuario_id: Sequelize.INTEGER,
                    recipcol_id: Sequelize.INTEGER,
                    reciptri_id: Sequelize.INTEGER,
                    datatri: Sequelize.DATE,
                    horatri: Sequelize.STRING,
                    posto: Sequelize.STRING,
                    amostra: Sequelize.STRING,
                    triado: Sequelize.NUMBER,
                    coletado: Sequelize.NUMBER,
                    malote_id: Sequelize.INTEGER,
                    datamalote: Sequelize.DATE,
                    horamalote: Sequelize.STRING,
                    coleta_id: Sequelize.INTEGER,
                    tubo: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'triagem',
                    timestamps: false,
                }
            );
            return this;
        }
    };
