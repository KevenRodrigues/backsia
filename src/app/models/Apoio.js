import Sequelize, { Model } from 'sequelize';

export default (sequelize, count) =>
    class Apoio extends Model {
        static init() {
            super.init(
                {
                    razao: Sequelize.STRING,
                    endereco: Sequelize.STRING,
                    bairro: Sequelize.STRING,
                    cidade: Sequelize.STRING,
                    cep: Sequelize.STRING,
                    uf: Sequelize.STRING,
                    fone: Sequelize.STRING,
                    fax: Sequelize.STRING,
                    email: Sequelize.STRING,
                    codlab: Sequelize.STRING,
                    obs: Sequelize.STRING,
                    arqrotina: Sequelize.STRING,
                    arqrotinaweb: Sequelize.STRING,
                    pathapo: Sequelize.STRING,
                    senhalab: Sequelize.STRING,
                    ws_lote: Sequelize.NUMBER,
                    ws_endweb: Sequelize.STRING,
                    ws_senha: Sequelize.STRING,
                    ws_idagente: Sequelize.STRING,
                    ws_versao: Sequelize.STRING,
                    amostra_envio: Sequelize.STRING,
                    amostra_retorno: Sequelize.STRING,
                    layout_ws: Sequelize.NUMBER,
                    import_param_xml: Sequelize.NUMBER,
                    status: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                    dadosconst: Sequelize.NUMBER,
                    graficos: Sequelize.NUMBER,
                    unicomvalor: Sequelize.NUMBER,
                    ws_resultado: Sequelize.NUMBER,
                    termo_cons_apoio: Sequelize.NUMBER,
                },
                {
                    sequelize,
                    modelName: 'Apoio',
                    tableName: 'apoio',
                    timestamps: false,
                }
            );
            this.count = count;
            return this;
        }

        static associate(models) {
            this.hasMany(models.Apoioexa, {
                foreignKey: 'apoio_id',
                as: 'apoioexa',
            });
            this.hasMany(models.Apoiopos, {
                foreignKey: 'apoio_id',
                as: 'apoiopos',
            });
            this.hasMany(models.Examealt, {
                foreignKey: 'apoio_id',
                as: 'apoio',
            });
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
        }
    };
