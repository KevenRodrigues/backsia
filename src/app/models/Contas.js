import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Contas extends Model {
        static init() {
            super.init(
                {
                    abertura: Sequelize.DATE,
                    fluxo: Sequelize.NUMBER,
                    banco_id: Sequelize.INTEGER,
                    codban: Sequelize.CHAR,
                    agencia: Sequelize.CHAR,
                    conta: Sequelize.CHAR,
                    limite: Sequelize.NUMBER,
                    caixa: Sequelize.NUMBER,
                    cartao_id: Sequelize.INTEGER,
                    limitecc: Sequelize.NUMBER,
                    seq: Sequelize.NUMBER,
                    nossonumero: Sequelize.CHAR,
                    arqlicenca: Sequelize.STRING,
                    arqlogo: Sequelize.STRING,
                    codigocedente: Sequelize.CHAR,
                    banco: Sequelize.CHAR,
                    inicionn: Sequelize.CHAR,
                    fimnn: Sequelize.CHAR,
                    layout: Sequelize.CHAR,
                    percmulta: Sequelize.NUMBER,
                    percdia: Sequelize.NUMBER,
                    demonstrativo: Sequelize.STRING,
                    instrucai: Sequelize.STRING,
                    arqlogod: Sequelize.STRING,
                    demonstrativo1: Sequelize.STRING,
                    urlimages: Sequelize.STRING,
                    urllogo: Sequelize.STRING,
                    assunto: Sequelize.STRING,
                    assuntoec: Sequelize.STRING,
                    copec: Sequelize.NUMBER,
                    emailc: Sequelize.STRING,
                    nomec: Sequelize.STRING,
                    porta: Sequelize.STRING,
                    senha: Sequelize.STRING,
                    usuario: Sequelize.STRING,
                    servidor: Sequelize.STRING,
                    protes: Sequelize.NUMBER,
                    demonstrativo2: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    invest: Sequelize.NUMBER,
                    saldo: Sequelize.NUMBER,
                    protesto: Sequelize.NUMBER,
                    baixa: Sequelize.NUMBER,
                    baixad: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    arquivo_licenca_key: Sequelize.TEXT,
                    arquivo_licenca_url: Sequelize.TEXT,
                    arquivo_logotipo_key: Sequelize.TEXT,
                    arquivo_logotipo_url: Sequelize.TEXT,
                    figura_demonstrativa_key: Sequelize.TEXT,
                    figura_demonstrativa_url: Sequelize.TEXT,
                },
                {
                    sequelize,
                    tableName: 'contas',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Banco, {
                foreignKey: 'banco_id',
                as: 'bancos',
            });

            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });

            this.belongsTo(models.Cartao, {
                foreignKey: 'cartao_id',
                as: 'cartao',
            });
        }
    };
