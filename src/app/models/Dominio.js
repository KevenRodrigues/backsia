import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Dominio extends Model {
    static init() {
        super.init(
            {
                dominio: Sequelize.STRING,
                stringcmd: Sequelize.STRING,
                status: Sequelize.INTEGER,
                stringcon: Sequelize.STRING,
                laboratorio_sia_id: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'dominio',
                timestamps: false,
            }
        );

        return this;
    }
}
