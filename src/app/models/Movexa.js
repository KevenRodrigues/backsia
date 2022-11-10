import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Movexa extends Model {
        static init() {
            super.init(
                {
                    movpac_id: Sequelize.INTEGER,
                    exame_id: Sequelize.INTEGER,
                    convenio_id: Sequelize.INTEGER,
                    plano_id: Sequelize.INTEGER,
                    medico_id: Sequelize.INTEGER,
                    medicoreal: Sequelize.INTEGER,
                    material_id: Sequelize.INTEGER,
                    recip_id: Sequelize.STRING,
                    apoio_id: Sequelize.INTEGER,
                    examedpto_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    layout_id: Sequelize.INTEGER,
                    assina_ope: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    amostra: Sequelize.STRING,
                    sequencia: Sequelize.STRING,
                    statusexm: Sequelize.STRING,
                    statusfat: Sequelize.STRING,
                    isento: Sequelize.NUMBER,
                    extra: Sequelize.NUMBER,
                    descrs: Sequelize.NUMBER,
                    veio: Sequelize.NUMBER,
                    resultado: Sequelize.STRING,
                    exameinc: Sequelize.NUMBER,
                    fatura: Sequelize.NUMBER,
                    impgra: Sequelize.NUMBER,
                    valbruto: Sequelize.NUMBER,
                    dtgrava: Sequelize.DATE,
                    dataentra: Sequelize.DATE,
                    amb: Sequelize.STRING,
                    dtcoleta: Sequelize.DATE,
                    hrcoleta: Sequelize.STRING,
                    dtentrega: Sequelize.DATE,
                    hentrega: Sequelize.STRING,
                    faturado: Sequelize.STRING,
                    valconv: Sequelize.NUMBER,
                    valpac: Sequelize.NUMBER,
                    matpac: Sequelize.NUMBER,
                    matconv: Sequelize.NUMBER,
                    matricula: Sequelize.STRING,
                    requisicao: Sequelize.STRING,
                    dtinterfa: Sequelize.DATE,
                    dtfatura: Sequelize.DATE,
                    impgrade: Sequelize.NUMBER,
                    imppaci: Sequelize.NUMBER,
                    impapoio: Sequelize.NUMBER,
                    recebeu: Sequelize.STRING,
                    impetq: Sequelize.NUMBER,
                    autoriza: Sequelize.STRING,
                    entregap: Sequelize.DATE,
                    motivo: Sequelize.STRING,
                    motivob: Sequelize.STRING,
                    obscoleta: Sequelize.STRING,
                    labapoio: Sequelize.NUMBER,
                    urgenteexm: Sequelize.NUMBER,
                    conffat: Sequelize.NUMBER,
                    naofatura: Sequelize.NUMBER,
                    coduncp: Sequelize.STRING,
                    exportado: Sequelize.NUMBER,
                    impetqtri: Sequelize.NUMBER,
                    amoapo: Sequelize.STRING,
                    dtautoriza: Sequelize.DATE,
                    dtautorizae: Sequelize.DATE,
                    dtsolic: Sequelize.DATE,
                    tipocsm: Sequelize.NUMBER,
                    tipocrm: Sequelize.NUMBER,
                    empcrm_id: Sequelize.INTEGER,
                    leuc: Sequelize.STRING,
                    linf: Sequelize.STRING,
                    obsapo: Sequelize.STRING,
                    dtapoio: Sequelize.DATE,
                    guiaprincipal: Sequelize.STRING,
                    dt_interface: Sequelize.DATE,
                    medicorea_id: Sequelize.INTEGER,
                    valfilmec: Sequelize.NUMBER,
                    valfilmep: Sequelize.NUMBER,
                    medconv: Sequelize.NUMBER,
                    medpac: Sequelize.NUMBER,
                    taxaconv: Sequelize.NUMBER,
                    taxapac: Sequelize.NUMBER,
                    totdescpac: Sequelize.NUMBER,
                    valcopartic: Sequelize.NUMBER,
                    temgrafico: Sequelize.NUMBER,
                    graflau: Sequelize.TEXT,
                    atb: Sequelize.NUMBER,
                    mascaralan: Sequelize.TEXT,
                    formulalan: Sequelize.TEXT,
                    rangerlan: Sequelize.TEXT,
                    usarangerlan: Sequelize.NUMBER,
                    usarangertextolan: Sequelize.NUMBER,
                    statusresultado: Sequelize.STRING,
                    datalib: Sequelize.DATE,
                    volume: Sequelize.STRING,
                    peso: Sequelize.STRING,
                    altura: Sequelize.STRING,
                    custounit: Sequelize.NUMBER,
                    internome: Sequelize.STRING,
                    apoioresu: Sequelize.NUMBER,
                    labap_id: Sequelize.INTEGER,
                    pos_apoiado: Sequelize.STRING,
                    triagem_seq: Sequelize.NUMBER,
                    horalib: Sequelize.STRING,
                    motivoer: Sequelize.TEXT,
                    resultado_antes_er: Sequelize.TEXT,
                    seq_tria_exa: Sequelize.NUMBER,
                    forca_inter: Sequelize.NUMBER,
                    nao_inter_posexa: Sequelize.NUMBER,
                    requi_pg: Sequelize.STRING,
                    tpdiurese: Sequelize.STRING,
                    valguia: Sequelize.DATE,
                    amo_apoiado: Sequelize.STRING,
                    resultadortf: Sequelize.TEXT,
                    resrtf: Sequelize.NUMBER,
                    malote_id: Sequelize.INTEGER,
                    coleta_id: Sequelize.INTEGER,
                    tubo: Sequelize.STRING,
                    coletar: Sequelize.NUMBER,
                    entregue: Sequelize.NUMBER,
                    motivo_descoleta: Sequelize.STRING,
                    anuencia: Sequelize.NUMBER,
                    operador_id_lanres: Sequelize.INTEGER,
                    data_lanres: Sequelize.DATE,
                    hora_lanres: Sequelize.STRING,
                    materialb2b: Sequelize.STRING,
                    codexmlabb2b: Sequelize.STRING,
                    datacoletab2b: Sequelize.STRING,
                    horacoletab2b: Sequelize.STRING,
                    codexmapoiob2b: Sequelize.STRING,
                    seqreg: Sequelize.NUMBER,
                    convenio_set_id: Sequelize.INTEGER,
                    lotefat_id: Sequelize.INTEGER,
                    lotefat_status: Sequelize.STRING,
                    dtconfop: Sequelize.DATE,
                    hrconfop: Sequelize.STRING,
                    oper_id_confop: Sequelize.INTEGER,
                    consultaexa: Sequelize.NUMBER,
                    descexafat: Sequelize.STRING,
                    depara3fat: Sequelize.STRING,
                    justanuencia: Sequelize.STRING,
                    reducaoacrescimo: Sequelize.NUMBER,
                    lotexml_id: Sequelize.INTEGER,
                    resultadotxt: Sequelize.TEXT,
                    resultadohash: Sequelize.STRING,
                    urg_prio_exa: Sequelize.NUMBER,
                    medicorea_id2: Sequelize.INTEGER,
                    loteapoiob2b: Sequelize.STRING,
                    rascunho: Sequelize.NUMBER,
                    cadeiab2b: Sequelize.STRING,
                    qtdexame: Sequelize.NUMBER,
                    codpedapoio: Sequelize.STRING,
                    idadegest: Sequelize.STRING,
                    posto_ger_int: Sequelize.STRING,
                    retorno_ws: Sequelize.TEXT,
                    etiqueta_ws: Sequelize.TEXT,
                    etiquetaws_id: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                    marca: Sequelize.NUMBER,
                    ausenciacodvalidacao: Sequelize.STRING,
                    codvalidacao: Sequelize.STRING,
                    responsaveltecnico: Sequelize.STRING,
                    responsaveltecnicodoc: Sequelize.STRING,
                    loteguia_id: Sequelize.INTEGER,
                    enviadornds: Sequelize.NUMBER,
                    id_rnds: Sequelize.STRING,
                    apoiores: Sequelize.STRING,
                    apoiocres: Sequelize.NUMBER,
                    curva_semtat: Sequelize.NUMBER,
                    local_coleta: Sequelize.STRING,
                    codigobarra: Sequelize.STRING,
                    aghuselib: Sequelize.NUMBER,
                    statusorizon: Sequelize.NUMBER,
                    aghuseint: Sequelize.NUMBER,
                    aghuseid: Sequelize.STRING,
                    aghuse_codigosolicitacao: Sequelize.INTEGER,
                    aghuse_codigoempresa: Sequelize.INTEGER,
                    aghuse_resultado_enviado: Sequelize.NUMBER,
                    urgenciaprioritaria: Sequelize.NUMBER,
                    spdata: Sequelize.NUMBER,
                    desc_anterior: Sequelize.STRING,
                    formulalanweb: Sequelize.TEXT,
                    layout_sia_parametros: Sequelize.TEXT,
                    corstatusexm: Sequelize.VIRTUAL,
                    status: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    modelName: 'Movexa',
                    tableName: 'movexa',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        static associate(models) {
            this.belongsTo(models.Exame, {
                foreignKey: 'exame_id',
                as: 'exame',
            });

            this.belongsTo(models.Material, {
                foreignKey: 'material_id',
                as: 'material',
            });

            this.belongsTo(models.Convenio, {
                foreignKey: 'convenio_id',
                as: 'convenio',
            });

            this.belongsTo(models.Plano, {
                foreignKey: 'plano_id',
                as: 'plano',
            });

            this.belongsTo(models.Medico, {
                foreignKey: 'medico_id',
                as: 'medico',
            });

            this.belongsTo(models.Movpac, {
                foreignKey: 'movpac_id',
                as: 'movpac',
            });

            this.belongsTo(models.Operador, {
                foreignKey: 'assina_ope',
                as: 'operador',
            });

            this.belongsTo(models.Etiquetaws, {
                foreignKey: 'etiquetaws_id',
                as: 'etiquetaws',
            });
        }
    };
