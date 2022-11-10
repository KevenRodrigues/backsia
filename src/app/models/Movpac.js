import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Movpac extends Model {
        static init() {
            super.init(
                {
                    prontuario_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    envio_id: Sequelize.INTEGER,
                    entrega_id: Sequelize.INTEGER,
                    medico_id: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    amostra: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    dataentra: Sequelize.DATE,
                    horaentra: Sequelize.STRING,
                    dtentrega: Sequelize.DATE,
                    hrentrega: Sequelize.STRING,
                    net: Sequelize.STRING,
                    idade: Sequelize.STRING,
                    mes: Sequelize.STRING,
                    dia: Sequelize.STRING,
                    valtot: Sequelize.NUMBER,
                    totpag: Sequelize.NUMBER,
                    totrec: Sequelize.NUMBER,
                    diferenca: Sequelize.NUMBER,
                    entreguepor: Sequelize.STRING,
                    totcli: Sequelize.NUMBER,
                    statusate: Sequelize.STRING,
                    diaseque: Sequelize.STRING,
                    codigoctrl: Sequelize.STRING,
                    dtfatura: Sequelize.DATE,
                    quarto: Sequelize.STRING,
                    leito: Sequelize.STRING,
                    urgente: Sequelize.NUMBER,
                    totalmatp: Sequelize.NUMBER,
                    totamatc: Sequelize.NUMBER,
                    totalconv: Sequelize.NUMBER,
                    totalpaci: Sequelize.NUMBER,
                    saldopaci: Sequelize.NUMBER,
                    codigopost: Sequelize.STRING,
                    clinico: Sequelize.STRING,
                    obs: Sequelize.STRING,
                    obsfat: Sequelize.STRING,
                    descperc: Sequelize.NUMBER,
                    acresperc: Sequelize.NUMBER,
                    descval: Sequelize.NUMBER,
                    acresval: Sequelize.NUMBER,
                    criou: Sequelize.STRING,
                    dum: Sequelize.STRING,
                    pronto: Sequelize.NUMBER,
                    prontom: Sequelize.NUMBER,
                    dtmodifica: Sequelize.DATE,
                    valorpago: Sequelize.NUMBER,
                    medicament: Sequelize.STRING,
                    chassi: Sequelize.STRING,
                    horacol: Sequelize.STRING,
                    estacaoatu: Sequelize.STRING,
                    conferidof: Sequelize.NUMBER,
                    exm: Sequelize.STRING,
                    seqatu: Sequelize.NUMBER,
                    situacao_id: Sequelize.INTEGER,
                    cid_id: Sequelize.INTEGER,
                    amoapo: Sequelize.STRING,
                    naofatura: Sequelize.NUMBER,
                    ndoc: Sequelize.STRING,
                    coletado: Sequelize.STRING,
                    horacoleta: Sequelize.STRING,
                    empresa_id: Sequelize.INTEGER,
                    horaini: Sequelize.NUMBER,
                    horafim: Sequelize.NUMBER,
                    operador_id_descrs: Sequelize.INTEGER,
                    operador_id_acrescrs: Sequelize.INTEGER,
                    operador_id_descpor: Sequelize.INTEGER,
                    operador_id_acrespor: Sequelize.INTEGER,
                    data_descrs: Sequelize.DATE,
                    data_acresrs: Sequelize.DATE,
                    data_descpor: Sequelize.DATE,
                    data_acrespor: Sequelize.DATE,
                    custopac: Sequelize.NUMBER,
                    id_pac_lab: Sequelize.STRING,
                    gera_inter: Sequelize.NUMBER,
                    pos_apoiado: Sequelize.STRING,
                    medicorea_id: Sequelize.INTEGER,
                    dt_hr_ultalt: Sequelize.STRING,
                    senha_atend: Sequelize.STRING,
                    enviou_sms: Sequelize.NUMBER,
                    peso_atend: Sequelize.NUMBER,
                    altura_atend: Sequelize.NUMBER,
                    urg_prio_pac: Sequelize.NUMBER,
                    laudo_pdf: Sequelize.TEXT,
                    jejum: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                    iniciosintomas: Sequelize.DATE,
                    municipio: Sequelize.STRING,
                    consultou_portal_comp: Sequelize.NUMBER,
                    dt_consulta_portal_comp: Sequelize.DATE,
                    hr_consulta_portal_comp: Sequelize.STRING,
                    consultou_portal_parc: Sequelize.NUMBER,
                    dt_consulta_portal_parc: Sequelize.DATE,
                    hr_consulta_portal_parc: Sequelize.STRING,
                    gera_bi: Sequelize.NUMBER,
                    sintoma: Sequelize.NUMBER,
                    coletaext: Sequelize.NUMBER,
                    laudopdf_hash: Sequelize.STRING,
                    dt_hr_edicao: Sequelize.STRING,
                    aghuseint: Sequelize.NUMBER,
                    tpconsulta: Sequelize.NUMBER,
                    texto_ind_clinica: Sequelize.STRING,
                    spdata: Sequelize.NUMBER,
                    total: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    modelName: 'Movpac',
                    tableName: 'movpac',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.hasMany(models.Movexa, {
                foreignKey: 'movpac_id',
                as: 'movexa',
            });
            this.belongsTo(models.Prontuario, {
                foreignKey: 'prontuario_id',
                as: 'prontuario',
            });
            this.hasMany(models.Movcai, {
                foreignKey: 'movpac_id',
                as: 'movcai',
            });
            this.belongsTo(models.Operador, {
                foreignKey: 'operador_id',
                as: 'operador',
            });
            this.belongsTo(models.MedicoRea, {
                foreignKey: 'medicorea_id',
                as: 'medicorea',
            });
            this.belongsTo(models.Envio, {
                foreignKey: 'envio_id',
                as: 'envio',
            });
            this.belongsTo(models.Entrega, {
                foreignKey: 'entrega_id',
                as: 'entrega',
            });
            this.belongsTo(models.Posto, {
                foreignKey: 'posto',
                targetKey: 'codigo',
            });
            this.belongsTo(models.Cid, {
                foreignKey: 'cid_id',
                as: 'cid',
            });
            this.belongsTo(models.Situacao, {
                foreignKey: 'situacao_id',
                as: 'situacao',
            });
            this.belongsTo(models.Empresa, {
                foreignKey: 'empresa_id',
                as: 'empresa',
            });
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
        }
    };
