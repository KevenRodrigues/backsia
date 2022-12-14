import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Param2 extends Model {
        static init() {
            super.init(
                {
                    pagemarginb_rtf: Sequelize.NUMBER,
                    pagemarginl_rtf: Sequelize.NUMBER,
                    pagemarginr_rtf: Sequelize.NUMBER,
                    pagemargint_rtf: Sequelize.NUMBER,
                    pageheight_rtf: Sequelize.NUMBER,
                    pagewidth_rtf: Sequelize.NUMBER,
                    pagemarginb_txt: Sequelize.NUMBER,
                    pagemarginl_txt: Sequelize.NUMBER,
                    pagemarginr_txt: Sequelize.NUMBER,
                    pagemargint_txt: Sequelize.NUMBER,
                    pageheight_txt: Sequelize.NUMBER,
                    pagewidth_txt: Sequelize.NUMBER,
                    headerp_rtf: Sequelize.NUMBER,
                    footerp_rtf: Sequelize.NUMBER,
                    headerp_txt: Sequelize.NUMBER,
                    footerp_txt: Sequelize.NUMBER,
                    drive_id_alt: Sequelize.INTEGER,
                    nao_altera_posto_atend: Sequelize.NUMBER,
                    altura_fundo: Sequelize.NUMBER,
                    tamanho_fundo: Sequelize.NUMBER,
                    rtffundocomp: Sequelize.NUMBER,
                    rtffundolarg: Sequelize.NUMBER,
                    nao_exibe_preparo_orca: Sequelize.NUMBER,
                    exame0_cab: Sequelize.TEXT,
                    exame0_fch: Sequelize.TEXT,
                    exame0_rdp: Sequelize.TEXT,
                    cabeca_bmp: Sequelize.TEXT,
                    rodape_bmp: Sequelize.TEXT,
                    fundo_bmp: Sequelize.TEXT,
                    internet_cab: Sequelize.TEXT,
                    internet_fch: Sequelize.TEXT,
                    internet_rdp: Sequelize.TEXT,
                    usa_cfg_param: Sequelize.NUMBER,
                    examema0_cab: Sequelize.TEXT,
                    examema0_fch: Sequelize.TEXT,
                    examema0_rdp: Sequelize.TEXT,
                    usa_interface_banco: Sequelize.NUMBER,
                    char_etq: Sequelize.NUMBER,
                    nao_perm_urg_sem_roturg: Sequelize.NUMBER,
                    nao_res_dev: Sequelize.NUMBER,
                    obriga_medicamento: Sequelize.NUMBER,
                    exibe_dados_conv: Sequelize.NUMBER,
                    ativa_sms: Sequelize.NUMBER,
                    checa_cns: Sequelize.NUMBER,
                    fundo_geral: Sequelize.NUMBER,
                    tam_pad_figrtf: Sequelize.NUMBER,
                    opcao_fundo: Sequelize.NUMBER,
                    nao_protege_pdf: Sequelize.NUMBER,
                    posto_coleta_domiciliar: Sequelize.STRING,
                    redimensiona_cad_atend1: Sequelize.NUMBER,
                    zebragrid_cad_atend1: Sequelize.NUMBER,
                    arqweb_prontu: Sequelize.NUMBER,
                    cns_loginweb: Sequelize.NUMBER,
                    le_matric_automatizada: Sequelize.NUMBER,
                    nao_exibe_barra: Sequelize.NUMBER,
                    traz_2_meses_libres: Sequelize.NUMBER,
                    importa_medrea_cadagenda: Sequelize.NUMBER,
                    define_medrea_jaatendido: Sequelize.NUMBER,
                    nlc_cli: Sequelize.STRING,
                    posicao_barra: Sequelize.NUMBER,
                    ajusta_traco: Sequelize.NUMBER,
                    ajusta_traco_ajuste: Sequelize.NUMBER,
                    imprime_recibo_apos_gravar_dados: Sequelize.NUMBER,
                    so_valida_matric_atend: Sequelize.NUMBER,
                    ativa_tp_arqinter_eqp: Sequelize.NUMBER,
                    perm_alt_medrea_lan_rtf: Sequelize.NUMBER,
                    assina_medrea_lan_rtf: Sequelize.NUMBER,
                    exibe_senhaweb_prontu_atend: Sequelize.NUMBER,
                    desconecta_banco: Sequelize.NUMBER,
                    ativa_cert_dig_rt: Sequelize.NUMBER,
                    certificado_rt: Sequelize.TEXT,
                    senha_certificado_rt: Sequelize.TEXT,
                    exibe_libres_barra: Sequelize.NUMBER,
                    email: Sequelize.STRING,
                    porta: Sequelize.STRING,
                    senha: Sequelize.STRING,
                    usuario: Sequelize.STRING,
                    servidor: Sequelize.STRING,
                    sem_dados_cad_matriz: Sequelize.NUMBER,
                    exibe_prontu_inativo: Sequelize.NUMBER,
                    gera_arqinter_sf: Sequelize.NUMBER,
                    ordena_agenda_hrchegada: Sequelize.NUMBER,
                    sacado_id_portal: Sequelize.INTEGER,
                    senha_portal: Sequelize.STRING,
                    major_lab: Sequelize.NUMBER,
                    minor_lab: Sequelize.NUMBER,
                    rev_lab: Sequelize.NUMBER,
                    major_cli: Sequelize.NUMBER,
                    minor_cli: Sequelize.NUMBER,
                    rev_cli: Sequelize.NUMBER,
                    gera_hash_resultado: Sequelize.NUMBER,
                    urg_prio_tempo: Sequelize.NUMBER,
                    urg_prio_hrini: Sequelize.STRING,
                    urg_prio_hrfin: Sequelize.STRING,
                    urg_prio_seg: Sequelize.NUMBER,
                    urg_prio_ter: Sequelize.NUMBER,
                    urg_prio_qua: Sequelize.NUMBER,
                    urg_prio_qui: Sequelize.NUMBER,
                    urg_prio_sex: Sequelize.NUMBER,
                    urg_prio_sab: Sequelize.NUMBER,
                    urg_prio_dom: Sequelize.NUMBER,
                    urg_prio_exibe_aviso_atend: Sequelize.NUMBER,
                    exibe_atraso_agenda: Sequelize.NUMBER,
                    qtd_exa_internet: Sequelize.NUMBER,
                    tempo_robo: Sequelize.NUMBER,
                    dias_interf: Sequelize.NUMBER,
                    perm_inf_statusres_rtf: Sequelize.NUMBER,
                    perm_codmat_alfa: Sequelize.NUMBER,
                    perm_2medrea: Sequelize.NUMBER,
                    sugere_col_rec: Sequelize.NUMBER,
                    obriga_jejum: Sequelize.NUMBER,
                    obriga_statusres_rtf: Sequelize.NUMBER,
                    nao_lembrete_orca: Sequelize.NUMBER,
                    usa_crmrj: Sequelize.NUMBER,
                    timezone_postgresql: Sequelize.STRING,
                    inativa_viacep: Sequelize.NUMBER,
                    tempo_triagem: Sequelize.NUMBER,
                    desabilita_vfpskin: Sequelize.NUMBER,
                    desabilita_themes: Sequelize.NUMBER,
                    ativa_qtdexa: Sequelize.NUMBER,
                    msg_atend: Sequelize.STRING,
                    nao_exibe_msg_exame_enviawww: Sequelize.NUMBER,
                    lib_res_obsfat: Sequelize.NUMBER,
                    exibe_menulat: Sequelize.NUMBER,
                    usa_2dig_fila: Sequelize.NUMBER,
                    usa_senhageral_fila: Sequelize.NUMBER,
                    obriga_motivo_exame: Sequelize.NUMBER,
                    codmunibge: Sequelize.NUMBER,
                    padrao: Sequelize.STRING,
                    natope: Sequelize.NUMBER,
                    regesptrib: Sequelize.NUMBER,
                    listaserv: Sequelize.STRING,
                    codtribmun: Sequelize.STRING,
                    cnpj: Sequelize.STRING,
                    im: Sequelize.STRING,
                    aliqiss: Sequelize.NUMBER,
                    optsn: Sequelize.NUMBER,
                    inccult: Sequelize.NUMBER,
                    pasta_nfse: Sequelize.STRING,
                    ativarps: Sequelize.NUMBER,
                    perguntarps: Sequelize.STRING,
                    munnfse: Sequelize.STRING,
                    rpsatend: Sequelize.NUMBER,
                    gera_txt_interface_varios_locais: Sequelize.NUMBER,
                    vias_result: Sequelize.NUMBER,
                    nao_coletapac: Sequelize.NUMBER,
                    respretiss: Sequelize.NUMBER,
                    cnae: Sequelize.STRING,
                    processo: Sequelize.STRING,
                    tipoamb: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    dominioweb: Sequelize.STRING,
                    exandamweb: Sequelize.NUMBER,
                    usa_etq_opera: Sequelize.NUMBER,
                    url_bi: Sequelize.STRING,
                    usa_bi: Sequelize.NUMBER,
                    etq_fu: Sequelize.NUMBER,
                    controla_envrec_malote: Sequelize.NUMBER,
                    lembreteap: Sequelize.NUMBER,
                    checa_conexao_minuto: Sequelize.NUMBER,
                    msg_email_laudo: Sequelize.STRING,
                    email_automatic: Sequelize.NUMBER,
                    envio_id_mobile: Sequelize.INTEGER,
                    entrega_id_mobile: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    usa_agenda_mobile: Sequelize.NUMBER,
                    usa_ssl: Sequelize.NUMBER,
                    fundo_bmp_web: Sequelize.STRING,
                    usa_figura_web: Sequelize.NUMBER,
                    cpfobriga: Sequelize.NUMBER,
                    leftlabellanca: Sequelize.NUMBER,
                    lefttxboxlanca: Sequelize.NUMBER,
                    linespacing: Sequelize.NUMBER,
                    usamaloteguia: Sequelize.NUMBER,
                    ultimarefeicao: Sequelize.NUMBER,
                    siaweb_posto: Sequelize.STRING,
                    hora_consulta_log: Sequelize.STRING,
                    tempo_cons_log: Sequelize.NUMBER,
                    atu_bi_auto: Sequelize.NUMBER,
                    hora_atualizou_bi: Sequelize.STRING,
                    tempo_atu_bi: Sequelize.NUMBER,
                    autoriza_desconto: Sequelize.NUMBER,
                    token_rnds: Sequelize.STRING,
                    dthoratoken: Sequelize.DATE,
                    validadetoken: Sequelize.NUMBER,
                    cpf_resp: Sequelize.STRING,
                    cns_resp: Sequelize.STRING,
                    vercpfobg: Sequelize.NUMBER,
                    aghuseemp: Sequelize.STRING,
                    aghuseusu: Sequelize.STRING,
                    aghusepsw: Sequelize.STRING,
                    aghuseip: Sequelize.STRING,
                    aghuseporta: Sequelize.STRING,
                    aghuseposto: Sequelize.STRING,
                    aghuseint: Sequelize.NUMBER,
                    aghusetoken: Sequelize.STRING,
                    aghusedttoken: Sequelize.STRING,
                    aghusechave: Sequelize.STRING,
                    aghuseplano: Sequelize.INTEGER,
                    aghuseconv: Sequelize.INTEGER,
                    codenvauto: Sequelize.NUMBER,
                    site_laboratorio: Sequelize.TEXT,
                    informacoes_extras: Sequelize.TEXT,
                },
                {
                    sequelize,
                    modelName: 'Param2',
                    tableName: 'param2',
                    timestamps: false,
                }
            );
            return this;
        }
    };
