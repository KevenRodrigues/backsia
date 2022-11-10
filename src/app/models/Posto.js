import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Posto extends Model {
        static init() {
            super.init(
                {
                    envio_id: Sequelize.INTEGER,
                    entrega_id: Sequelize.INTEGER,
                    convenio_id: Sequelize.INTEGER,
                    descricao: Sequelize.STRING,
                    responsavel: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    codigo: Sequelize.STRING,
                    num_aut: Sequelize.NUMBER,
                    usa_cor_fundo: Sequelize.NUMBER,
                    cor_fundo: Sequelize.NUMBER,
                    seq: Sequelize.STRING,
                    rsexo: Sequelize.NUMBER,
                    rdata_nasc: Sequelize.NUMBER,
                    restadociv: Sequelize.NUMBER,
                    rgruposang: Sequelize.NUMBER,
                    rfatorrh: Sequelize.NUMBER,
                    rrg: Sequelize.NUMBER,
                    rcpf: Sequelize.NUMBER,
                    rcor: Sequelize.NUMBER,
                    remail: Sequelize.NUMBER,
                    rprofissao: Sequelize.NUMBER,
                    rcep: Sequelize.NUMBER,
                    rrua: Sequelize.NUMBER,
                    rbairro: Sequelize.NUMBER,
                    rcidade: Sequelize.NUMBER,
                    ruf: Sequelize.NUMBER,
                    rfone1: Sequelize.NUMBER,
                    rfone2: Sequelize.NUMBER,
                    rmatric: Sequelize.NUMBER,
                    rvalplano: Sequelize.NUMBER,
                    seqinter: Sequelize.INTEGER,
                    bpacnes: Sequelize.STRING,
                    rempresa: Sequelize.NUMBER,
                    rbpaibge: Sequelize.NUMBER,
                    rtitular: Sequelize.NUMBER,
                    bpaibge: Sequelize.STRING,
                    rcns: Sequelize.NUMBER,
                    rcid: Sequelize.NUMBER,
                    alerta_dias: Sequelize.NUMBER,
                    rnumero: Sequelize.NUMBER,
                    rcompl: Sequelize.NUMBER,
                    pasta_inter_pos: Sequelize.STRING,
                    pasta_backup_pos: Sequelize.STRING,
                    controla_coleta_entrega: Sequelize.NUMBER,
                    exige_senha_atend: Sequelize.NUMBER,
                    endereco: Sequelize.STRING,
                    bairro: Sequelize.STRING,
                    cidade: Sequelize.STRING,
                    uf: Sequelize.STRING,
                    cep: Sequelize.STRING,
                    ddd: Sequelize.STRING,
                    fone: Sequelize.STRING,
                    cor_hexa: Sequelize.STRING,
                    urg_prio_ativa: Sequelize.NUMBER,
                    usa_fundo_posto: Sequelize.NUMBER,
                    fundo_bmp_pos: Sequelize.TEXT,
                    fundo_bmp_url: Sequelize.TEXT,
                    fundo_bmp_key: Sequelize.TEXT,
                    rrg_dtexp: Sequelize.NUMBER,
                    rnis_pis: Sequelize.NUMBER,
                    rnome_social: Sequelize.NUMBER,
                    etq_ws: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    exibe_pacientes_coleta: Sequelize.NUMBER,
                    origem_inter: Sequelize.STRING,
                    email: Sequelize.STRING,
                },
                {
                    sequelize,
                    tableName: 'posto',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
            this.belongsTo(models.Envio, {
                foreignKey: 'envio_id',
                as: 'envio',
            });
            this.belongsTo(models.Entrega, {
                foreignKey: 'entrega_id',
                as: 'entrega',
            });
            this.belongsTo(models.Convenio, {
                foreignKey: 'convenio_id',
                as: 'convenio',
            });
        }
    };
