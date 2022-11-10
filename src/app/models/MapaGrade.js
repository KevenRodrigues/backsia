import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class MapaGrade extends Model {
        static init() {
            super.init(
                {
                    mapa_id: Sequelize.INTEGER,
                    movpac_id: Sequelize.INTEGER,
                    pag: Sequelize.NUMBER,
                    exa01: Sequelize.STRING,
                    exa02: Sequelize.STRING,
                    exa03: Sequelize.STRING,
                    exa04: Sequelize.STRING,
                    exa05: Sequelize.STRING,
                    exa06: Sequelize.STRING,
                    exa07: Sequelize.STRING,
                    exa08: Sequelize.STRING,
                    exa09: Sequelize.STRING,
                    exa10: Sequelize.STRING,
                    exa11: Sequelize.STRING,
                    exa12: Sequelize.STRING,
                    exa13: Sequelize.STRING,
                    exa14: Sequelize.STRING,
                    exa15: Sequelize.STRING,
                    exa16: Sequelize.STRING,
                    exa17: Sequelize.STRING,
                    exa18: Sequelize.STRING,
                    exa19: Sequelize.STRING,
                    exa20: Sequelize.STRING,
                    exa21: Sequelize.STRING,
                    exa22: Sequelize.STRING,
                    exa23: Sequelize.STRING,
                    exa24: Sequelize.STRING,
                    exa25: Sequelize.STRING,
                    exa26: Sequelize.STRING,
                    exa27: Sequelize.STRING,
                    exa28: Sequelize.STRING,
                    exa29: Sequelize.STRING,
                    exa30: Sequelize.STRING,
                    exa31: Sequelize.STRING,
                    exa32: Sequelize.STRING,
                    exa33: Sequelize.STRING,
                    exa34: Sequelize.STRING,
                    exa35: Sequelize.STRING,
                    exa36: Sequelize.STRING,
                    exa37: Sequelize.STRING,
                    exa38: Sequelize.STRING,
                    exa39: Sequelize.STRING,
                    exa40: Sequelize.STRING,
                    movexa_ids: Sequelize.TEXT,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    tableName: 'mapagrade',
                    timestamps: false,
                }
            );
            return this;
        }
    };
