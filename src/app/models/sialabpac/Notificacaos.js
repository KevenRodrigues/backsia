import Sequelize, { Model } from 'sequelize';

class Notificacao extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: Sequelize.INTEGER,
                laboratorio_id: Sequelize.INTEGER,
                mensagem: Sequelize.STRING,
                lida: Sequelize.BOOLEAN,
                preagendado_id: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Notificacao',
                tableName: 'notificacaos',
            }
        );
        return this;
    }
}

export default Notificacao;
