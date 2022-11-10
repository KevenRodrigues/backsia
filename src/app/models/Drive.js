import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Drive extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                sigla: Sequelize.STRING,
                final: Sequelize.STRING,
                espaco: Sequelize.NUMBER,
                insercao: Sequelize.NUMBER,
                fonte: Sequelize.STRING,
                estilo: Sequelize.STRING,
                tamanho: Sequelize.NUMBER,
                fontema: Sequelize.STRING,
                estiloma: Sequelize.STRING,
                tamanhoma: Sequelize.NUMBER,
                char_resul: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                char_fonte: Sequelize.NUMBER,
                inter_sigla: Sequelize.STRING,
                inter_final: Sequelize.STRING,
                cor: Sequelize.STRING,
                insercaofim: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
                drivetextframe: Sequelize.NUMBER,
                widthtextam_11: Sequelize.NUMBER,
                widthtexlenmenor_15: Sequelize.NUMBER,
                widthtexlenmaior_15: Sequelize.NUMBER,
                heightex: Sequelize.NUMBER,
                borderwidthtex: Sequelize.NUMBER,
                corbk: Sequelize.STRING,
                sia_sigla: Sequelize.STRING,
                sia_final: Sequelize.STRING,
            },
            {
                sequelize,
                tableName: 'drive',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
