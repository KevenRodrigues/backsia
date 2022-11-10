import { QueryTypes } from 'sequelize';
import Database from '../../database';
import { format, parseISO, max } from 'date-fns';
import { gerarRelatorioHtml } from './functions/functions';
import { calcularDiferencaEmHoras } from './functions/functions'

import { convertDate, PegaData, PegaHora, DataEnt, geraId, procSQL } from '../controllers/functions/functions';

class ColetaMaterialController {
    async listarExamesColeta(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { posto, etq_fu, exibePacientesColeta, bposto_col, bamostra_col, brecip } = req.query;

            let instrucaosql = '';

            instrucaosql = `
                SELECT
                false AS MARCA,
                CAST(TRIM(T.POSTO) AS CHAR(3)) AS POSTO,
                CAST(TRIM(T.AMOSTRA) AS CHAR(6)) AS AMOSTRA,
                MOVPAC.SENHA_ATEND,
                MOVPAC.DATAENTRA,
                MOVPAC.HORAENTRA,
                CAST((CASE COALESCE(MOVPAC.URGENTE,0) WHEN 1 THEN 'SIM' ELSE 'NÃO' END) AS CHAR(3)),
                CAST(
                (
                    CASE COALESCE(PARAM2.CHAR_ETQ,0) WHEN 2 THEN
                    CASE length((Cast(coalesce(MOVEXA.codexmapoiob2b,'') AS CHAR))) WHEN 0 THEN T.POSTO||T.AMOSTRA||LPAD(CAST(COALESCE(T.RECIPTRI_ID,0) AS TEXT),3,'0')  ELSE COALESCE(MOVEXA.codexmapoiob2b,'') END
                    ELSE
                    CASE length((Cast(coalesce(MOVEXA.codexmapoiob2b,'') AS CHAR))) WHEN 0 THEN SUBSTR(T.POSTO,2)||T.AMOSTRA||SUBSTR(LPAD(CAST(COALESCE(T.RECIPTRI_ID,0) AS TEXT),3,'0'),2) ELSE COALESCE(MOVEXA.codexmapoiob2b,'') END
                    END
                )
                AS CHAR(15)) AS TUBO,
                PRONTUARIO.NOME,
                CAST(REPLACE(REPLACE(REPLACE(REPLACE(CAST(
                    (SELECT array_agg(SUBSTR(CODIGO,1,5)||' ')
                    FROM TRIAGEM
                    LEFT JOIN MOVEXA M ON M.ID = TRIAGEM.MOVEXA_ID
                    LEFT JOIN EXAME    ON EXAME.ID = TRIAGEM.EXAME_ID
                    LEFT JOIN RECIP B  ON B.ID = TRIAGEM.RECIPTRI_ID
                    LEFT JOIN MOVPAC D ON D.ID = TRIAGEM.MOVPAC_ID
                    WHERE (TRIAGEM.RECIPTRI_ID = T.RECIPTRI_ID AND TRIAGEM.MOVPAC_ID = T.MOVPAC_ID AND M.STATUSEXM = 'FU' AND M.COLETAR = 1 AND COALESCE(M.ETIQUETAWS_ID,0) = COALESCE(MOVEXA.ETIQUETAWS_ID,0) )) AS TEXT)
                    ,',','-'),'"',''),'{',''),'}','') AS CHAR(250)) AS EXAMES,
                CAST(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(CAST(
                    (SELECT array_agg(DISTINCT(TRIM(SUBSTR(COALESCE(MATERIAL.DESCRICAO,''),1,10)))||' ')
                    FROM MOVEXA
                    LEFT JOIN TRIAGEM    ON TRIAGEM.MOVEXA_ID = MOVEXA.ID
                    LEFT JOIN MATERIAL   ON MATERIAL.ID = MOVEXA.MATERIAL_ID
                    WHERE (MOVEXA.MOVPAC_ID = T.MOVPAC_ID) AND TRIAGEM.RECIPTRI_ID = T.RECIPTRI_ID) AS TEXT)
                    ,',',' '),'"',''),'{',''),'}','')) AS CHAR(250)) AS DESCMAT,
                A.DESCRICAO AS DESCRECIPTRI,
                CAST(CASE CAST(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(CAST(
                    (SELECT array_agg(DISTINCT(TRIM(SUBSTR(CAST(COALESCE(MOVEXA.IMPETQTRI,0) AS CHAR(1)),1,10)))||' ')
                    FROM MOVEXA
                    LEFT JOIN TRIAGEM    ON TRIAGEM.MOVEXA_ID = MOVEXA.ID
                    LEFT JOIN MATERIAL   ON MATERIAL.ID = MOVEXA.MATERIAL_ID
                    WHERE (MOVEXA.MOVPAC_ID = T.MOVPAC_ID) AND TRIAGEM.RECIPTRI_ID = T.RECIPTRI_ID AND MOVEXA.IMPETQTRI = 1) AS TEXT)
                    ,',',' '),'"',''),'{',''),'}','')) AS CHAR(250)) ~ '1' WHEN 'T' THEN 'SIM' ELSE 'NÃO' END AS CHAR(3)) AS IMPRIMIUETQ,
                MOVPAC.DT_HR_ULTALT,
                T.MOVPAC_ID,
                T.RECIPTRI_ID,
                COUNT(*) AS QTDEXA,
                MOVPAC.PRONTUARIO_ID,
                MOVEXA.ETIQUETAWS_ID
                FROM TRIAGEM T
                LEFT JOIN MOVEXA     ON MOVEXA.ID = T.MOVEXA_ID
                LEFT JOIN MOVPAC     ON MOVPAC.ID = T.MOVPAC_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                LEFT JOIN RECIP A    ON A.ID = T.RECIPTRI_ID
                LEFT JOIN PARAM      ON PARAM.ID = 1
                LEFT JOIN PARAM2     ON PARAM2.ID = 1
                LEFT JOIN POSTO      ON POSTO.CODIGO = T.POSTO
                WHERE
            `;

            if(etq_fu === '1' && exibePacientesColeta === '0'){
                instrucaosql+= ` MOVEXA.STATUSEXM = 'FU' AND MOVEXA.POSTO = '${posto}' AND MOVEXA.COLETAR = 1 AND COALESCE(T.RECIPTRI_ID,0) > 0 AND `;
                instrucaosql+= ` MOVEXA.POSTO = '${bposto_col}' AND MOVEXA.AMOSTRA = '${bamostra_col}' AND T.RECIPTRI_ID = ${brecip} `;
            } else {
                instrucaosql+= ` MOVEXA.STATUSEXM = 'FU' AND MOVEXA.POSTO = '${posto}' AND MOVEXA.COLETAR = 1 AND COALESCE(T.RECIPTRI_ID,0) > 0 `;
            }

            instrucaosql+= `
                GROUP BY T.POSTO, T.AMOSTRA, T.MOVPAC_ID, MOVEXA.CODEXMAPOIOB2B, MOVPAC.SENHA_ATEND, MOVPAC.DT_HR_ULTALT, MOVPAC.DATAENTRA, MOVPAC.HORAENTRA, MOVPAC.URGENTE, PARAM2.CHAR_ETQ, PRONTUARIO.NOME, T.RECIPTRI_ID, A.DESCRICAO, MOVPAC.PRONTUARIO_ID, MOVEXA.ETIQUETAWS_ID
                ORDER BY MOVPAC.DT_HR_ULTALT, T.POSTO, T.AMOSTRA, T.MOVPAC_ID, T.RECIPTRI_ID
            `;

            let selectsql = await sequelize
                .query(instrucaosql, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            selectsql.map(item => {
                item.tubo = item.tubo ? item.tubo.trim() : item.tubo
                item.nome = item.nome ? item.nome.trim() : item.nome
                item.exames = item.exames ? item.exames.trim() : item.exames;
                item.descmat = item.descmat ? item.descmat.trim() : item.descmat
                item.descreciptri = item.descreciptri ? item.descreciptri.trim() : item.descreciptri
                item.selected = false
                item.postoamostra = `${item.posto}${item.amostra}`
                return item;
            })

            return res.status(200).json(selectsql);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async findTube(req, res) {
        try {
            const sequelize = Database.instances[req.database];

            let instrucaosql = `
                SELECT MOVEXA.POSTO, MOVEXA.AMOSTRA, EXAME.RECIPTRI_ID, EXAME.RECIPCOL_ID
                FROM ETIQUETAWS
                LEFT JOIN MOVEXA ON ETIQUETAWS.ID = MOVEXA.ETIQUETAWS_ID
                LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                WHERE TRIM(COALESCE(ETIQUETAWS.CODBARRAS,'')) = '${req.query.value}'
            `;

            const etiquetaws = await sequelize
                .query(instrucaosql, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            return res.status(200).json(etiquetaws);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async gerarEtiquetas(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { Movexa } = Database.getModels(req.database);

            const { impetqrec, etq_fu, exibePacientesColeta, operador_id } = req.body.params;

            let criou_lote_coleta = false;
            let atual_movpac_id = 0;
            let coleta_id = null;

            const errosBanco = [];
            const naoColetado = [];
            const orientacaoColeta = [];
            const etiquetasWs = [];
            const etiquetas = [];

            for (const curcoleta of req.body.selecionados) {
                if(atual_movpac_id = 0){
                    atual_movpac_id = curcoleta.movpac_id;
                }

                let instrucaosql_curtria = `
                    SELECT
                    TRIAGEM.ID,
                    TRIAGEM.POSTO,
                    TRIAGEM.AMOSTRA,
                    TRIAGEM.MOVPAC_ID,
                    TRIAGEM.PRONTUARIO_ID,
                    TRIAGEM.MOVEXA_ID,
                    MOVEXA.STATUSEXM,
                    TRIAGEM.RECIPTRI_ID
                    FROM TRIAGEM
                    LEFT JOIN MOVEXA   ON MOVEXA.ID = TRIAGEM.MOVEXA_ID
                    LEFT JOIN EXAME    ON EXAME.ID = TRIAGEM.EXAME_ID
                    LEFT JOIN RECIP B  ON B.ID = TRIAGEM.RECIPTRI_ID
                    LEFT JOIN MOVPAC D ON D.ID = TRIAGEM.MOVPAC_ID
                    WHERE (TRIAGEM.MOVPAC_ID = ${curcoleta.movpac_id} AND MOVEXA.STATUSEXM = 'FU' AND MOVEXA.COLETAR = 1 AND TRIAGEM.RECIPTRI_ID = ${curcoleta.reciptri_id})
                `;

                const curtria = await sequelize
                    .query(instrucaosql_curtria, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                const movpac_id = curtria[0].movpac_id;

                if(curtria.length > 0){

                    if(!criou_lote_coleta){
                        coleta_id = await geraId(req,"coleta_id_seq");
                        criou_lote_coleta = true;
                    }

                    let crmovpacm_sql = `
                        select
                        movpac.acresperc,
                        movpac.acresval,
                        movpac.amostra,
                        movpac.chassi,
                        movpac.cid_id,
                        cid.codigo as codigo_cid,
                        movpac.clinico,
                        movpac.codigoctrl,
                        movpac.codigopost,
                        movpac.conferidof,
                        movpac.criou,
                        movpac.dataentra,
                        movpac.descperc,
                        movpac.descval,
                        movpac.dia,
                        movpac.diaseque,
                        movpac.diferenca,
                        movpac.dtentrega,
                        movpac.dtfatura,
                        movpac.dtmodifica,
                        movpac.dum,
                        movpac.entrega_id,
                        movpac.entreguepor,
                        movpac.envio_id,
                        movpac.estacaoatu,
                        movpac.exm,
                        movpac.horacol,
                        movpac.horaentra,
                        movpac.hrentrega,
                        movpac.id,
                        movpac.idade,
                        movpac.leito,
                        movpac.medicament,
                        movpac.medico_id,
                        movpac.mes,
                        movpac.net,
                        movpac.obs,
                        movpac.obsfat,
                        movpac.operador_id,
                        movpac.posto,
                        movpac.pronto,
                        movpac.prontom,
                        movpac.prontuario_id,
                        movpac.quarto,
                        movpac.saldopaci,
                        movpac.situacao_id,
                        situacao.codigo as codigo_situacao,
                        movpac.status,
                        movpac.statusate,
                        movpac.totalconv,
                        movpac.totalmatp,
                        movpac.totalpaci,
                        movpac.totamatc,
                        movpac.totcli,
                        movpac.totpag,
                        movpac.totrec,
                        movpac.urgente,
                        movpac.valorpago,
                        movpac.valtot,
                        prontuario.nome,
                        prontuario.data_nasc,
                        operador.nome as nome_ope,
                        envio.descricao as desc_env,
                        entrega.descricao as desc_ent,
                        posto.descricao as desc_pos,
                        envio.codigo as codigo_env,
                        entrega.codigo as codigo_ent,
                        movpac.seqatu,
                        situacao.descricao as desc_situacao,
                        cid.descricao as desc_cid,
                        movpac.amoapo,
                        movpac.naofatura,
                        movpac.coletado,
                        movpac.horacoleta,
                        movpac.empresa_id,
                        empresa.fantasia as fanemp,
                        movpac.horaini,
                        movpac.horafim,
                        movpac.operador_id_descrs,
                        movpac.data_descrs,
                        movpac.operador_id_acrescrs,
                        movpac.data_acresrs,
                        movpac.operador_id_descpor,
                        movpac.data_descpor,
                        movpac.operador_id_acrespor,
                        movpac.data_acrespor,
                        movpac.custopac,
                        movpac.id_pac_lab,
                        movpac.pos_apoiado,
                        movpac.medicorea_id,
                        medicorea.crm as crmrea,
                        medicorea.nome_medrea,
                        movpac.dt_hr_ultalt,
                        movpac.senha_atend,
                        posto.endereco as endereco_posto,
                        posto.bairro as bairro_posto,
                        posto.cidade as cidade_posto,
                        posto.uf as uf_posto,
                        posto.cep as cep_posto,
                        posto.ddd as ddd_posto,
                        posto.fone as fone_posto,
                        movpac.peso_atend,
                        movpac.altura_atend,
                        movpac.urg_prio_pac,
                        movpac.jejum,
                        movpac.iniciosintomas,
                        movpac.municipio,
                        movpac.sintoma,
                        movpac.coletaext,
                        movpac.AGHUSEINT,
                        movpac.texto_ind_clinica,
                        prontuario.cpf,
                        movpac.ENV_EMAIL_AUT_PAC_COMPLETO,
                        movpac.DATA_ENV_EMAIL_COMPLETO,
                        movpac.HORA_ENV_EMAIL_COMPLETO
                        from
                        movpac
                        left join prontuario on prontuario.id = movpac.prontuario_id
                        left join operador on operador.id = movpac.operador_id
                        left join envio on envio.id = movpac.envio_id
                        left join entrega on entrega.id = movpac.entrega_id
                        left join posto on posto.codigo = movpac.posto
                        left join cid on cid.id = movpac.cid_id
                        left join situacao on situacao.id = movpac.situacao_id
                        left join empresa on empresa.id = movpac.empresa_id
                        left join medicorea on medicorea.id = movpac.medicorea_id
                    `;

                    crmovpacm_sql+= ` where movpac.id = ${movpac_id}`;

                    const crmovpacm = await sequelize
                    .query(crmovpacm_sql, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                    let camovexa_sql = `
                        select
                        exame.codigo,
                        exame.descricao,
                        material.descricao as descmat,
                        convenio.fantasia,
                        plano.descricao as descplano,
                        medico.nome_med,
                        movexa.dtcoleta,
                        movexa.hrcoleta,
                        movexa.dtentrega,
                        movexa.hentrega,
                        movexa.matpac,
                        movexa.valpac,
                        movexa.veio,
                        movexa.matricula,
                        convenio.codigo as cod_conv,
                        plano.codigo as cod_plano,
                        movexa.amb,
                        movexa.amostra,
                        movexa.apoio_id,
                        movexa.assina_ope,
                        movexa.autoriza,
                        movexa.coduncp,
                        movexa.conffat,
                        movexa.dtfatura,
                        movexa.valguia,
                        movexa.convenio_id,
                        movexa.dataentra,
                        movexa.descrs,
                        movexa.dtgrava,
                        movexa.dtinterfa,
                        movexa.entregap,
                        movexa.exame_id,
                        movexa.examedpto_id,
                        movexa.exameinc,
                        movexa.extra,
                        movexa.fatura,
                        movexa.faturado,
                        movexa.id,
                        movexa.impapoio,
                        movexa.impetq,
                        movexa.impgra,
                        movexa.impgrade,
                        movexa.imppaci,
                        movexa.isento,
                        movexa.labapoio,
                        movexa.layout_id,
                        movexa.matconv,
                        movexa.material_id,
                        movexa.medico_id,
                        movexa.medicoreal,
                        movexa.motivo,
                        movexa.motivob,
                        movexa.movpac_id,
                        movexa.naofatura,
                        movexa.obscoleta,
                        movexa.operador_id,
                        movexa.plano_id,
                        movexa.posto,
                        movexa.recebeu,
                        movexa.recip_id,
                        movexa.requisicao,
                        movexa.resultado,
                        movexa.sequencia,
                        movexa.statusexm,
                        movexa.statusfat,
                        movexa.urgenteexm,
                        movexa.valbruto,
                        movexa.valconv,
                        movexa.impetqtri,
                        movexa.exportado,
                        movexa.amoapo,
                        exame.recipcol_id,
                        exame.reciptri_id,
                        movexa.dtautoriza,
                        movexa.dtautorizae,
                        movexa.dtsolic,
                        movexa.tipocsm,
                        movexa.tipocrm as crmtipo,
                        movexa.empcrm_id,
                        movexa.leuc,
                        movexa.linf,
                        movexa.obsapo,
                        movexa.dtapoio,
                        movexa.guiaprincipal,
                        medico.crm,
                        0 as marca,
                        convenio.usatiss,
                        movexa.dt_interface,
                        movexa.valcopartic,
                        movexa.atb,
                        movexa.mascaralan,
                        movexa.formulalan,
                        movexa.rangerlan,
                        movexa.usarangerlan,
                        movexa.usarangertextolan,
                        movexa.statusresultado,
                        movexa.datalib,
                        movexa.volume,
                        movexa.peso,
                        movexa.idadegest,
                        movexa.altura,
                        movexa.custounit,
                        movexa.totdescpac,
                        movexa.internome,
                        movexa.labap_id,
                        movexa.pos_apoiado,
                        movexa.horalib,
                        movexa.motivoer,
                        movexa.resultado_antes_er,
                        movexa.forca_inter,
                        nao_inter_posexa,
                        exame.enviawww as enviawwwexa,
                        movexa.requi_pg,
                        movexa.temgrafico,
                        movexa.graflau,
                        movexa.amo_apoiado,
                        movexa.resultadortf,
                        movexa.resrtf,
                        movexa.malote_id,
                        movexa.coleta_id,
                        movexa.tubo,
                        movexa.coletar,
                        movexa.entregue,
                        movexa.motivo_descoleta,
                        movexa.anuencia,
                        movexa.data_lanres,
                        movexa.hora_lanres,
                        movexa.operador_id_lanres,
                        b.nome as nomeope_lanres,
                        exame.ori_coleta,
                        materialb2b,
                        codexmlabb2b,
                        datacoletab2b,
                        horacoletab2b,
                        tpdiurese,
                        codexmapoiob2b,
                        seqreg,
                        exame.consulta,
                        espmed.cbos3,
                        lotefat_id,
                        lotefat_status,
                        consultaexa,
                        descexafat,
                        depara3fat,
                        justanuencia,
                        exame.setor_id,
                        movexa.reducaoacrescimo,
                        movexa.lotexml_id,
                        movexa.resultadotxt,
                        movexa.resultadohash,
                        movexa.urg_prio_exa,
                        movexa.medicorea_id2,
                        movexa.rascunho,
                        movexa.qtdexame,
                        movexa.posto_ger_int,
                        movexa.retorno_ws,
                        movexa.etiqueta_ws,
                        plano.percconv,
                        plano.valor_pacote,
                        plano.limite,
                        movexa.etiquetaws_id,
                        movexa.codpedapoio,
                        etiquetaws.etiqueta,
                        movpac.jejum,
                        c.descricao as desccol,
                        d.descricao as desctri,
                        movexa.ausenciaCodValidacao,
                        movexa.CodValidacao,
                        movexa.responsaveltecnico,
                        movexa.responsaveltecnicodoc,
                        movexa.loteguia_id,
                        movexa.EnviadoRNDS,
                        exame.exm_covid19,
                        movexa.curva_semTAT,
                        movexa.AGHUSEINT,
                        movexa.CODIGOBARRA,
                        movexa.AGHUSEID,
                        movexa.AgHuse_codigoSolicitacao,
                        movexa.AgHuse_codigoEmpresa,
                        movexa.AgHuse_resultado_enviado,
                        urgenciaprioritaria,
                        desc_anterior,
                        movexa.formulalanweb,
                        movexa.DTCONFOP,
                        movexa.HRCONFOP,
                        movexa.OPER_ID_CONFOP
                        from
                        movexa
                        left join exame on exame.id = movexa.exame_id
                        left join recip c on c.id = exame.recipcol_id
                        left join recip d on d.id = exame.reciptri_id
                        left join material on material.id = movexa.material_id
                        left join convenio on convenio.id = movexa.convenio_id
                        left join plano on plano.id = movexa.plano_id
                        left join medico on medico.id = movexa.medico_id
                        left join operador b on b.id = movexa.operador_id_lanres
                        left join espmed on espmed.id = medico.espmed_id
                        left join etiquetaws on etiquetaws.id = movexa.etiquetaws_id
                        left join movpac on movpac.id = movexa.movpac_id
                    `;

                    camovexa_sql+= ` where (`;

                    for (let index = 0; index < curtria.length; index++) {
                        const element = curtria[index];
                        if((index + 1) === (curtria.length)){
                            camovexa_sql += `movexa.id = ${element.movexa_id}`;
                        } else {
                            camovexa_sql += ` movexa.id = ${element.movexa_id} OR `;
                        }
                    }

                    camovexa_sql+= `)`;

                    const crmovexa = await sequelize
                    .query(camovexa_sql, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                    await sequelize
                    .transaction(async transaction => {

                        for (const exm of crmovexa) {
                            exm.marca = 1;
                            exm.impetqtri = 1;
                            exm.idopera_ultacao = operador_id;

                            // TODO : GRAVAR O CRMOVEXA
                            await Movexa.update(exm, {
                                where: { id: exm.id },
                                transaction,
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }

                        let curetqws_sql = `
                            SELECT
                            APOIO.LAYOUT_WS,
                            ETIQUETAWS.ETIQUETA,
                            ETIQUETAWS.ETIQUETA2,
                            ETIQUETAWS.ETIQUETA3,
                            ETIQUETAWS.ETIQUETA4,
                            ETIQUETAWS.ETIQUETA5,
                            ETIQUETAWS.ETIQUETA6
                            FROM
                            MOVEXA
                            LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                            LEFT JOIN ETIQUETAWS ON ETIQUETAWS.ID = MOVEXA.ETIQUETAWS_ID
                            LEFT JOIN APOIO ON APOIO.ID = ETIQUETAWS.APOIO_ID
                            WHERE
                            MOVEXA.MOVPAC_ID = ${movpac_id}
                            AND COALESCE(MOVEXA.ETIQUETAWS_ID, 0) <> 0
                            GROUP BY
                            APOIO.LAYOUT_WS,
                            ETIQUETAWS.ETIQUETA,
                            ETIQUETAWS.ETIQUETA2,
                            ETIQUETAWS.ETIQUETA3,
                            ETIQUETAWS.ETIQUETA4,
                            ETIQUETAWS.ETIQUETA5,
                            ETIQUETAWS.ETIQUETA6
                            ORDER BY
                            APOIO.LAYOUT_WS,
                            ETIQUETAWS.ETIQUETA
                        `;

                        const curetqws = await sequelize
                        .query(curetqws_sql, {
                            type: QueryTypes.SELECT,
                        })
                        .catch(sequelize, err => {
                            return err.message;
                        });


                        // ORIENTAÇÃO DE COLETA
                        for (const exm of crmovexa) {
                            if(exm.ori_coleta){
                                orientacaoColeta.push({
                                    ori_coleta: exm.ori_coleta,
                                    codigo: exm.codigo,
                                    descricao: exm.descricao
                                });
                            }
                        }

                        if(impetqrec === '1' && etq_fu === '1'){

                            // CHAMA O METODO IMPETQ
                            // thisform.metodo_pad.impetq(CRMOVPACM.ID,.T.,.T.,0,.F.,0,M.oEASYLAB.IMPETQTRI)

                            for (const etqws of curetqws) {
                                if(etqws.layout_ws === 5){
                                    if(!etqws.etiqueta2){
                                        etiquetasWs.push(etqws.etiqueta2)
                                        if(!etqws.etiqueta3){
                                            etiquetasWs.push(etqws.etiqueta3)
                                            if(!etqws.etiqueta4){
                                                etiquetasWs.push(etqws.etiqueta4)
                                                if(!etqws.etiqueta5){
                                                    etiquetasWs.push(etqws.etiqueta5)
                                                    if(!etqws.etiqueta6){
                                                        etiquetasWs.push(etqws.etiqueta6)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                        } else {
                            if(etq_fu === '1' && exibePacientesColeta === '1' &&  impetqrec === '1'){

                                // CHAMA O METODO IMPETQ
                                // thisform.metodo_pad.impetq(CRMOVPACM.ID,.T.,.T.,0,.F.,0,M.oEASYLAB.IMPETQTRI)

                                for (const etqws of curetqws) {
                                    if(etqws.layout_ws === 5){
                                        if(!etqws.etiqueta2){
                                            etiquetasWs.push(etqws.etiqueta2)
                                            if(!etqws.etiqueta3){
                                                etiquetasWs.push(etqws.etiqueta3)
                                                if(!etqws.etiqueta4){
                                                    etiquetasWs.push(etqws.etiqueta4)
                                                    if(!etqws.etiqueta5){
                                                        etiquetasWs.push(etqws.etiqueta5)
                                                        if(!etqws.etiqueta6){
                                                            etiquetasWs.push(etqws.etiqueta6)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    })
                    .error(err => {
                        errosBanco.push({error: 'Erro ao salvar, no banco de dados, ação não finalizada.'})
                    });

                    etiquetas.push(
                        {
                            etiqueta:
                                `N
                                R30,10
                                D8
                                A210,0,0,1,1,1,N,"BERIVALDO FERREIRA DOS SANTOS"
                                B285,65,0,2,2,4,70,N,"59376647601"
                                A210,20,0,1,1,1,N,"59-3766476-01  26/03/21 10:40"
                                A210,35,0,1,1,1,N,"CONV: 969"
                                A330,35,0,1,1,1,N,"PED.CONV: 005004363"
                                A210,50,0,1,1,1,N,"LINHA VERDE"
                                A420,50,0,1,1,1,N,"DN 18/01/65"
                                A195,220,3,1,1,1,R,"   NTO"
                                A210,143,0,1,1,1,N,"SORO"
                                A210,158,0,1,1,1,N,""
                                A210,173,0,1,1,1,N,"VOL: 350ul"
                                A450,173,0,1,1,1,N,"(CONGELADO)"
                                A210,188,0,1,1,1,N,"PTH"
                                A210,206,0,1,1,1,N,""
                                P1
                                N`
                        }
                    );

                } else {
                   naoColetado.push({error: `Tubo ${curcoleta.tubo} não esta mais em condições de ser coletado.`});
                }
            }

            return res.status(200).json({ errosBanco, naoColetado, orientacaoColeta, etiquetasWs, etiquetas });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async coletarMaterial(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { Movexa, Movpac, Triagem, Coleta } = Database.getModels(req.database);

            const { selecionados } = req.body;
            const { dt_banco, operador_id, impetqrec, naodtentgeralfm, usaleitubo, etq_fu, exibePacientesColeta } = req.body.params;

            if (etq_fu === '1' && exibePacientesColeta === '1'){
                const semetq = selecionados.filter(o => o.imprimiuetq !== 'SIM');
                if(semetq.length > 0){
                    return res.status(400).json({error: 'Existem exames marcados sem etiqueta impressa, não sera possível realizar a coleta.'})
                }
            }

            let criou_lote_coleta = false;
            let qtdtubos = 0;
            let atual_movpac_id = 0;
            let coleta_id = '';
            let hentrega = '';
            let hora_fin = '';
            let dtentrega = '';
            let dtatual = '';
            let hratual = '';

            dtatual = await PegaData(req, dt_banco);
            hratual = await PegaHora(req, dt_banco);

            const erros = [];
            const errosBanco = [];
            const orientacaoColeta = [];
            const etiquetas = [];

            for (const curcoleta of selecionados) {

                if(atual_movpac_id === 0){
                    atual_movpac_id = curcoleta.movpac_id;
                }

                let instrucaosql_curtria = `
                    SELECT
                    TRIAGEM.ID,
                    TRIAGEM.POSTO,
                    TRIAGEM.AMOSTRA,
                    TRIAGEM.MOVPAC_ID,
                    TRIAGEM.PRONTUARIO_ID,
                    TRIAGEM.MOVEXA_ID,
                    MOVEXA.STATUSEXM,
                    TRIAGEM.RECIPTRI_ID
                    FROM TRIAGEM
                    LEFT JOIN MOVEXA   ON MOVEXA.ID = TRIAGEM.MOVEXA_ID
                    LEFT JOIN EXAME    ON EXAME.ID = TRIAGEM.EXAME_ID
                    LEFT JOIN RECIP B  ON B.ID = TRIAGEM.RECIPTRI_ID
                    LEFT JOIN MOVPAC D ON D.ID = TRIAGEM.MOVPAC_ID
                    WHERE (TRIAGEM.MOVPAC_ID = ${curcoleta.movpac_id} AND MOVEXA.STATUSEXM = 'FU' AND MOVEXA.COLETAR = 1 AND TRIAGEM.RECIPTRI_ID = ${curcoleta.reciptri_id})
                `;

                const curtria = await sequelize
                    .query(instrucaosql_curtria, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                const movpac_id = curtria[0].movpac_id;

                if(curtria.length > 0){

                    await sequelize
                    .transaction(async transaction => {

                    if(!criou_lote_coleta){
                        coleta_id = await geraId(req,"coleta_id_seq");
                        criou_lote_coleta = true;
                    }

                    let crmovpacm_sql = `
                        select
                        movpac.acresperc,
                        movpac.acresval,
                        movpac.amostra,
                        movpac.chassi,
                        movpac.cid_id,
                        cid.codigo as codigo_cid,
                        movpac.clinico,
                        movpac.codigoctrl,
                        movpac.codigopost,
                        movpac.conferidof,
                        movpac.criou,
                        movpac.dataentra,
                        movpac.descperc,
                        movpac.descval,
                        movpac.dia,
                        movpac.diaseque,
                        movpac.diferenca,
                        movpac.dtentrega,
                        movpac.dtfatura,
                        movpac.dtmodifica,
                        movpac.dum,
                        movpac.entrega_id,
                        movpac.entreguepor,
                        movpac.envio_id,
                        movpac.estacaoatu,
                        movpac.exm,
                        movpac.horacol,
                        movpac.horaentra,
                        movpac.hrentrega,
                        movpac.id,
                        movpac.idade,
                        movpac.leito,
                        movpac.medicament,
                        movpac.medico_id,
                        movpac.mes,
                        movpac.net,
                        movpac.obs,
                        movpac.obsfat,
                        movpac.operador_id,
                        movpac.posto,
                        movpac.pronto,
                        movpac.prontom,
                        movpac.prontuario_id,
                        movpac.quarto,
                        movpac.saldopaci,
                        movpac.situacao_id,
                        situacao.codigo as codigo_situacao,
                        movpac.status,
                        movpac.statusate,
                        movpac.totalconv,
                        movpac.totalmatp,
                        movpac.totalpaci,
                        movpac.totamatc,
                        movpac.totcli,
                        movpac.totpag,
                        movpac.totrec,
                        movpac.urgente,
                        movpac.valorpago,
                        movpac.valtot,
                        prontuario.nome,
                        prontuario.data_nasc,
                        operador.nome as nome_ope,
                        envio.descricao as desc_env,
                        entrega.descricao as desc_ent,
                        posto.descricao as desc_pos,
                        envio.codigo as codigo_env,
                        entrega.codigo as codigo_ent,
                        movpac.seqatu,
                        situacao.descricao as desc_situacao,
                        cid.descricao as desc_cid,
                        movpac.amoapo,
                        movpac.naofatura,
                        movpac.coletado,
                        movpac.horacoleta,
                        movpac.empresa_id,
                        empresa.fantasia as fanemp,
                        movpac.horaini,
                        movpac.horafim,
                        movpac.operador_id_descrs,
                        movpac.data_descrs,
                        movpac.operador_id_acrescrs,
                        movpac.data_acresrs,
                        movpac.operador_id_descpor,
                        movpac.data_descpor,
                        movpac.operador_id_acrespor,
                        movpac.data_acrespor,
                        movpac.custopac,
                        movpac.id_pac_lab,
                        movpac.pos_apoiado,
                        movpac.medicorea_id,
                        medicorea.crm as crmrea,
                        medicorea.nome_medrea,
                        movpac.dt_hr_ultalt,
                        movpac.senha_atend,
                        posto.endereco as endereco_posto,
                        posto.bairro as bairro_posto,
                        posto.cidade as cidade_posto,
                        posto.uf as uf_posto,
                        posto.cep as cep_posto,
                        posto.ddd as ddd_posto,
                        posto.fone as fone_posto,
                        movpac.peso_atend,
                        movpac.altura_atend,
                        movpac.urg_prio_pac,
                        movpac.jejum,
                        movpac.iniciosintomas,
                        movpac.municipio,
                        movpac.sintoma,
                        movpac.coletaext,
                        movpac.AGHUSEINT,
                        movpac.texto_ind_clinica,
                        prontuario.cpf,
                        movpac.ENV_EMAIL_AUT_PAC_COMPLETO,
                        movpac.DATA_ENV_EMAIL_COMPLETO,
                        movpac.HORA_ENV_EMAIL_COMPLETO
                        from
                        movpac
                        left join prontuario on prontuario.id = movpac.prontuario_id
                        left join operador on operador.id = movpac.operador_id
                        left join envio on envio.id = movpac.envio_id
                        left join entrega on entrega.id = movpac.entrega_id
                        left join posto on posto.codigo = movpac.posto
                        left join cid on cid.id = movpac.cid_id
                        left join situacao on situacao.id = movpac.situacao_id
                        left join empresa on empresa.id = movpac.empresa_id
                        left join medicorea on medicorea.id = movpac.medicorea_id
                    `;

                    crmovpacm_sql+= ` where movpac.id = ${movpac_id}`;

                    const getCrmovpacm = await sequelize
                    .query(crmovpacm_sql, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                    let crmovpacm = getCrmovpacm[0];

                    let camovexa_sql = `
                        select
                        exame.codigo,
                        exame.descricao,
                        material.descricao as descmat,
                        convenio.fantasia,
                        plano.descricao as descplano,
                        medico.nome_med,
                        movexa.dtcoleta,
                        movexa.hrcoleta,
                        movexa.dtentrega,
                        movexa.hentrega,
                        movexa.matpac,
                        movexa.valpac,
                        movexa.veio,
                        movexa.matricula,
                        convenio.codigo as cod_conv,
                        plano.codigo as cod_plano,
                        movexa.amb,
                        movexa.amostra,
                        movexa.apoio_id,
                        movexa.assina_ope,
                        movexa.autoriza,
                        movexa.coduncp,
                        movexa.conffat,
                        movexa.dtfatura,
                        movexa.valguia,
                        movexa.convenio_id,
                        movexa.dataentra,
                        movexa.descrs,
                        movexa.dtgrava,
                        movexa.dtinterfa,
                        movexa.entregap,
                        movexa.exame_id,
                        movexa.examedpto_id,
                        movexa.exameinc,
                        movexa.extra,
                        movexa.fatura,
                        movexa.faturado,
                        movexa.id,
                        movexa.impapoio,
                        movexa.impetq,
                        movexa.impgra,
                        movexa.impgrade,
                        movexa.imppaci,
                        movexa.isento,
                        movexa.labapoio,
                        movexa.layout_id,
                        movexa.matconv,
                        movexa.material_id,
                        movexa.medico_id,
                        movexa.medicoreal,
                        movexa.motivo,
                        movexa.motivob,
                        movexa.movpac_id,
                        movexa.naofatura,
                        movexa.obscoleta,
                        movexa.operador_id,
                        movexa.plano_id,
                        movexa.posto,
                        movexa.recebeu,
                        movexa.recip_id,
                        movexa.requisicao,
                        movexa.resultado,
                        movexa.sequencia,
                        movexa.statusexm,
                        movexa.statusfat,
                        movexa.urgenteexm,
                        movexa.valbruto,
                        movexa.valconv,
                        movexa.impetqtri,
                        movexa.exportado,
                        movexa.amoapo,
                        exame.recipcol_id,
                        exame.reciptri_id,
                        movexa.dtautoriza,
                        movexa.dtautorizae,
                        movexa.dtsolic,
                        movexa.tipocsm,
                        movexa.tipocrm as crmtipo,
                        movexa.empcrm_id,
                        movexa.leuc,
                        movexa.linf,
                        movexa.obsapo,
                        movexa.dtapoio,
                        movexa.guiaprincipal,
                        medico.crm,
                        0 as marca,
                        convenio.usatiss,
                        movexa.dt_interface,
                        movexa.valcopartic,
                        movexa.atb,
                        movexa.mascaralan,
                        movexa.formulalan,
                        movexa.rangerlan,
                        movexa.usarangerlan,
                        movexa.usarangertextolan,
                        movexa.statusresultado,
                        movexa.datalib,
                        movexa.volume,
                        movexa.peso,
                        movexa.idadegest,
                        movexa.altura,
                        movexa.custounit,
                        movexa.totdescpac,
                        movexa.internome,
                        movexa.labap_id,
                        movexa.pos_apoiado,
                        movexa.horalib,
                        movexa.motivoer,
                        movexa.resultado_antes_er,
                        movexa.forca_inter,
                        nao_inter_posexa,
                        exame.enviawww as enviawwwexa,
                        movexa.requi_pg,
                        movexa.temgrafico,
                        movexa.graflau,
                        movexa.amo_apoiado,
                        movexa.resultadortf,
                        movexa.resrtf,
                        movexa.malote_id,
                        movexa.coleta_id,
                        movexa.tubo,
                        movexa.coletar,
                        movexa.entregue,
                        movexa.motivo_descoleta,
                        movexa.anuencia,
                        movexa.data_lanres,
                        movexa.hora_lanres,
                        movexa.operador_id_lanres,
                        b.nome as nomeope_lanres,
                        exame.ori_coleta,
                        materialb2b,
                        codexmlabb2b,
                        datacoletab2b,
                        horacoletab2b,
                        tpdiurese,
                        codexmapoiob2b,
                        seqreg,
                        exame.consulta,
                        espmed.cbos3,
                        lotefat_id,
                        lotefat_status,
                        consultaexa,
                        descexafat,
                        depara3fat,
                        justanuencia,
                        exame.setor_id,
                        movexa.reducaoacrescimo,
                        movexa.lotexml_id,
                        movexa.resultadotxt,
                        movexa.resultadohash,
                        movexa.urg_prio_exa,
                        movexa.medicorea_id2,
                        movexa.rascunho,
                        movexa.qtdexame,
                        movexa.posto_ger_int,
                        movexa.retorno_ws,
                        movexa.etiqueta_ws,
                        plano.percconv,
                        plano.valor_pacote,
                        plano.limite,
                        movexa.etiquetaws_id,
                        movexa.codpedapoio,
                        etiquetaws.etiqueta,
                        movpac.jejum,
                        c.descricao as desccol,
                        d.descricao as desctri,
                        movexa.ausenciaCodValidacao,
                        movexa.CodValidacao,
                        movexa.responsaveltecnico,
                        movexa.responsaveltecnicodoc,
                        movexa.loteguia_id,
                        movexa.EnviadoRNDS,
                        exame.exm_covid19,
                        movexa.curva_semTAT,
                        movexa.AGHUSEINT,
                        movexa.CODIGOBARRA,
                        movexa.AGHUSEID,
                        movexa.AgHuse_codigoSolicitacao,
                        movexa.AgHuse_codigoEmpresa,
                        movexa.AgHuse_resultado_enviado,
                        urgenciaprioritaria,
                        desc_anterior,
                        movexa.formulalanweb,
                        movexa.DTCONFOP,
                        movexa.HRCONFOP,
                        movexa.OPER_ID_CONFOP
                        from
                        movexa
                        left join exame on exame.id = movexa.exame_id
                        left join recip c on c.id = exame.recipcol_id
                        left join recip d on d.id = exame.reciptri_id
                        left join material on material.id = movexa.material_id
                        left join convenio on convenio.id = movexa.convenio_id
                        left join plano on plano.id = movexa.plano_id
                        left join medico on medico.id = movexa.medico_id
                        left join operador b on b.id = movexa.operador_id_lanres
                        left join espmed on espmed.id = medico.espmed_id
                        left join etiquetaws on etiquetaws.id = movexa.etiquetaws_id
                        left join movpac on movpac.id = movexa.movpac_id
                    `;

                    let camovexa_sql_where = camovexa_sql +` where (`;

                    for (let index = 0; index < curtria.length; index++) {
                        const element = curtria[index];
                        if((index + 1) === (curtria.length)){
                            camovexa_sql_where += `movexa.id = ${element.movexa_id}`;
                        } else {
                            camovexa_sql_where += ` movexa.id = ${element.movexa_id} OR `;
                        }
                    }

                    camovexa_sql_where += `)`;

                    let crmovexa = await sequelize
                    .query(camovexa_sql_where, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });


                    hora_fin = crmovexa[0].hentrega;

                    for (const exm of crmovexa) {
                        const pegaData = convertDate(dtatual);
                        if (exm.urg_prio_exa === '1' && pegaData === exm.dataentra){
                            dtentrega = dtatual;
                            hentrega = hora_fin;
                        } else {
                            dtentrega = await DataEnt(dtatual,exm.exame_id,hratual,exm.urgenteexm === '1' ? true : false, req);
                            hentrega = exm.hentrega
                        }

                        exm.statusexm = 'FM';
                        exm.exportado = 0;
                        exm.impgra    = 0;
                        exm.veio      = 0;
                        exm.marca     = 1;
                        exm.dtcoleta  = dtatual;
                        exm.hrcoleta  = hratual;
                        exm.dtentrega = dtentrega;
                        exm.hentrega  = hentrega;
                        exm.coleta_id = coleta_id;
                        exm.motivo_descoleta = null;
                        exm.tubo = curcoleta.tubo;
                        exm.idopera_ultacao = operador_id;

                        //GRAVAR O CRMOVEXA
                        await Movexa.update(exm, {
                            where: { id: exm.id },
                            transaction,
                        }).catch(err => {
                            return res
                                .status(400)
                                .json({ error: err.message });
                        });

                        await Movexa.sequelize.query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                exm.id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                operador_id
                            },'MATERIAL COLETADO STATUS:: ${exm.statusexm}','${
                                req.headers.host
                            }')`
                        );
                    }

                    let crtriagem_sql = `
                        select
                        triagem.id,
                        triagem.posto,
                        triagem.amostra,
                        triagem.datatri,
                        triagem.horatri,
                        triagem.triado,
                        triagem.exame_id,
                        exame.codigo,
                        triagem.movexa_id,
                        movexa.statusexm,
                        triagem.movpac_id,
                        triagem.operador_id,
                        triagem.prontuario_id,
                        triagem.recipcol_id,
                        triagem.reciptri_id,
                        triado as marca,
                        exame.depara,
                        triagem.coletado,
                        triagem.malote_id,
                        triagem.datamalote,
                        triagem.horamalote,
                        triagem.coleta_id,
                        triagem.tubo,
                        movexa.codexmapoiob2b
                        from
                        triagem
                        left join exame on exame.id = triagem.exame_id
                        left join movexa on movexa.id = triagem.movexa_id
                    `;

                    crtriagem_sql+= ` where (`;

                    for (let index = 0; index < curtria.length; index++) {
                        const element = curtria[index];
                        if((index + 1) === (curtria.length)){
                            crtriagem_sql += `triagem.id = ${element.id}`;
                        } else {
                            crtriagem_sql += ` triagem.id = ${element.id} OR `;
                        }
                    }

                    crtriagem_sql+= `)`;

                    let crtriagem = await sequelize
                    .query(crtriagem_sql, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                    for (const item of crtriagem) {
                        item.coletado = 1;
                        item.coleta_id = coleta_id;
                        item.tubo = curcoleta.tubo;
                        item.idopera_ultacao = operador_id;

                        // ATUALIZAR TRIAGEM
                        await Triagem.update(item, {
                           where: { id: item.id },
                            transaction,
                        }).catch(err => {
                            return res
                                .status(400)
                                .json({ error: err.message });
                        });
                    }

                    const crcoleta = await Coleta.findOne({
                        where: { id: coleta_id}
                    })

                    if(criou_lote_coleta === true) {
                        qtdtubos = qtdtubos + 1;
                        if(crcoleta){
                            crcoleta.id = coleta_id,
                            crcoleta.data = dtatual,
                            crcoleta.hora = hratual,
                            crcoleta.qtdtubos = qtdtubos,
                            crcoleta.operador_id = operador_id,
                            crcoleta.idopera_ultacao = operador_id

                            await Coleta.update(crcoleta, {
                                where: { id: crcoleta.id },
                                transaction,
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });

                        } else {
                            await Coleta.create({
                                id: coleta_id,
                                data: dtatual,
                                hora: hratual,
                                qtdtubos: qtdtubos,
                                operador_id,
                                idopera_ultacao: operador_id
                            }, {
                                transaction,
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }
                    }

                    // ORIENTAÇÃO DE COLETA
                    for (const exm of crmovexa) {
                        if(exm.ori_coleta){
                            orientacaoColeta.push({
                                ori_coleta: exm.ori_coleta,
                                codigo: exm.codigo,
                                descricao: exm.descricao.trim()
                            });
                        }
                    }

                    // IMPRIMIR ETIQUETA
                    if (impetqrec === '1' && etq_fu === '0'  && usaleitubo === '0'){
                        // thisform.metodo_pad.impetq(crmovpacm.id,.t.,.t.,0,.f.,0,m.oeasylab.impetqtri)
                    }

                    const maxDtEntrega = [];

                    const getDtEntrega = await Movexa.findAll({
                        where: {movpac_id: atual_movpac_id},
                        attributes: [
                            'id',
                            'dtentrega',
                            'statusexm',
                        ],
                    });

                    getDtEntrega.map( o => {
                        o.dtentrega = o.dtentrega ? parseISO(o.dtentrega) : null;
                        return o;
                    })

                    for (const item of getDtEntrega) {
                        for (const exa of crmovexa) {
                            if(item.id === exa.id){
                                item.dtentrega = parseISO(exa.dtentrega);
                                item.statusexm = exa.statusexm;
                            }
                        }

                        maxDtEntrega.push(item);
                    }

                    const arrayDtEntrega = [];

                    maxDtEntrega.map(item => {
                        if (item.dtentrega) {
                            arrayDtEntrega.push(item.dtentrega);
                        }
                        return item;
                    });

                    const newDtEntrega = arrayDtEntrega.length > 0 ? max(arrayDtEntrega) : null;

                    let curstatusexm;

                    if(naodtentgeralfm === '1'){
                        if(usaleitubo === '1') {
                            curstatusexm = crmovexa.filter( o => o.statusexm === 'FU');
                        } else {
                            curstatusexm = crmovexa.filter( o => o.statusexm === 'FM');
                        }
                        if(curstatusexm.length > 0) {
                            crmovpacm.dtentrega = null;
                        } else {
                            crmovpacm.dtentrega = format(newDtEntrega, 'yyyy-MM-dd');
                        }
                    } else {
                        crmovpacm.dtentrega = format(newDtEntrega, 'yyyy-MM-dd');
                    }

                        if (crmovpacm.urg_prio_pac === '1' && dtatual === crmovpacm.dataentra){

                        const hrentrega = await procSQL(
                            req,
                            'movpac',
                            'hrentrega',
                            {id: crmovpacm.id}
                        );
                        hrentrega = hrentrega ? hora_fin : hrentrega;
                        dtentrega = dtatual;
                        crmovpacm.dtentrega = dtentrega;
                        crmovpacm.hrentrega = hrentrega;
                    }

                    crmovpacm.idopera_ultacao = operador_id;

                    // ATUALIZAR MOVPAC
                    await Movpac.update(crmovpacm, {
                        where: { id: crmovpacm.id },
                        transaction,
                    }).catch(err => {
                        return res
                            .status(400)
                            .json({ error: err.message });
                    });

                    }).error(err => {
                        errosBanco.push({
                            paciente: curcoleta.nome,
                            msg: 'Erro ao salvar, no banco de dados, ação não finalizada.',
                            err
                        })
                    });

                } else {
                   erros.push({error: `Tubo ${curcoleta.tubo} não esta mais em condições de ser coletado.`});
                }
            }

            etiquetas.push(
                {
                    etiqueta:
                        `N
                        R30,10
                        D8
                        A210,0,0,1,1,1,N,"BERIVALDO FERREIRA DOS SANTOS"
                        B285,65,0,2,2,4,70,N,"59376647601"
                        A210,20,0,1,1,1,N,"59-3766476-01  26/03/21 10:40"
                        A210,35,0,1,1,1,N,"CONV: 969"
                        A330,35,0,1,1,1,N,"PED.CONV: 005004363"
                        A210,50,0,1,1,1,N,"LINHA VERDE"
                        A420,50,0,1,1,1,N,"DN 18/01/65"
                        A195,220,3,1,1,1,R,"   NTO"
                        A210,143,0,1,1,1,N,"SORO"
                        A210,158,0,1,1,1,N,""
                        A210,173,0,1,1,1,N,"VOL: 350ul"
                        A450,173,0,1,1,1,N,"(CONGELADO)"
                        A210,188,0,1,1,1,N,"PTH"
                        A210,206,0,1,1,1,N,""
                        P1
                        N`
                }
            );

            return res.status(200).json({orientacaoColeta, erros, errosBanco, etiquetas});
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async validarLogin(req,res) {
        const { Operador } = Database.getModels(req.database);
        const { login, senha } = req.body;

        const operadorRes = await Operador.findOne({
                where: Operador.sequelize.where(
                    Operador.sequelize.fn(
                        'upper',
                        Operador.sequelize.col('nome')
                    ),
                    Operador.sequelize.fn('upper', login)
                ),
                attributes: ['id', 'nome', 'senope', 'status'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

        if(!operadorRes){
            return res.status(400).json({ error: 'Usuário ou senha inválido.' });
        }

        const senope = operadorRes.senope.trim();

        if(senha !== senope) {
            return res.status(400).json({ error: 'Usuário ou senha inválido.' });
        }

        const status = operadorRes.status;

        if(status !== 0){
            return res.status(400).json({ error: 'Usúario não consta como ativo.' });
        }

        const {id, nome} = operadorRes;

        // Faz validação dos parametros
        const campo = ['coleta_material','env_malote_material','descoleta_material'];
        const param = await Operador.sequelize
            .query(
                `select ${campo} from operador, operador2, operador3 where operador.id = ${id} AND operador2.operador_id = ${id} AND operador3.operador_id = ${id}`,
                {
                    type: QueryTypes.SELECT,
                }
            )
            .catch(err => {
                return res.status(400).json({ error: err.message });
            });

        const {coleta_material,env_malote_material,descoleta_material} = param[0];

        return res.status(200).json({id, nome: nome.trim(),coleta_material,env_malote_material,descoleta_material});

    }

    async validarLoginEtiqueta(req,res) {
        const { Operador } = Database.getModels(req.database);
        const { l_senope } = req.body;

        const operadores = await Operador.findAll({
                where: { status: '0'},
                attributes: ['id', 'nome', 'senope', 'status'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });


        if(operadores.length === 0){
            return res.status(400).json({ error: 'Nenhum usuário ativo no momento.' });
        }

        const operador = operadores.find( item => {
            let etq_ope_col = '';

            const {id, senope} = item;

            etq_ope_col += id.toString().padStart(5, '0');
            etq_ope_col += senope ? senope.trim() : '';
            etq_ope_col +=  id.toString().padStart(15, '0');
            etq_ope_col = etq_ope_col.substr(0, 15);

            if(etq_ope_col === l_senope) {
                return item;
            }
        })

        if(!operador) {
            return res.status(400).json({ error: 'Código de Identificação do Usuário inválido..' });
        }

        const {id, nome} = operador;

        // Faz validação dos parametros
        const campo = ['coleta_material','env_malote_material','descoleta_material'];
        const param = await Operador.sequelize
            .query(
                `select ${campo} from operador, operador2, operador3 where operador.id = ${id} AND operador2.operador_id = ${id} AND operador3.operador_id = ${id}`,
                {
                    type: QueryTypes.SELECT,
                }
            )
            .catch(err => {
                return res.status(400).json({ error: err.message });
            });

        const {coleta_material,env_malote_material,descoleta_material} = param[0];

        return res.status(200).json({id, nome: nome.trim(), coleta_material,env_malote_material,descoleta_material});

    }

    async estatistica(req, res) {
        const { Movexa } = Database.getModels(req.database);
            const {
                postos,
                operadores,
                dataInicial,
                dataFinal,
                horaInicial,
                horaFinal,
                modelo
            } = req.body;

        try {

            let select = `
                SELECT
                COLETA.DATA,
                COLETA.HORA,
                COLETA.ID,
                MOVPAC.POSTO,
                MOVPAC.AMOSTRA,
                MOVPAC.HORAINI,
                MOVPAC.HORAFIM,
                MOVPAC.DATAENTRA,
                MOVPAC.HORAENTRA,
                PRONTUARIO.NOME,
                CONVENIO.CODIGO,
                CONVENIO.FANTASIA,
                CAST(SUM(COALESCE(MOVEXA.QTDEXAME, 1)) as bigint) AS TOTEXA,
                CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                OPERADOR.NOME AS NOMOPE,
                OPERADOR.ID as OPERADOR_ID
            FROM
                MOVEXA
                LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                LEFT JOIN COLETA ON COLETA.ID = MOVEXA.COLETA_ID
                LEFT JOIN OPERADOR ON OPERADOR.ID = COLETA.OPERADOR_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                LEFT JOIN CONVENIO ON CONVENIO.ID = PRONTUARIO.CONVENIO_ID
            `


            const periodo = `
                ${format(new Date(dataInicial), 'yyyy-MM-dd')}'
                AND '${format(new Date(dataFinal), 'yyyy-MM-dd')}`;

            let where = `
                WHERE OPERADOR.NOME IS NOT NULL AND
                MOVPAC.POSTO IN (${postos}) AND
                COLETA.OPERADOR_ID IN (${operadores}) AND
                COLETA.DATA BETWEEN '${periodo}' `

            let validacaoDeHoras = '';

            if (horaInicial && horaFinal) {
                validacaoDeHoras = `
                    AND CAST(REPLACE(COLETA.HORA, ':', '') as integer)
                    BETWEEN ${horaInicial.replace(":", "")} AND
                    ${horaFinal.replace(":", "")} `;
            }

            where += validacaoDeHoras;
            select += where;

            let groupBy = `
                group by
                    movexa.qtdexame,
                    movpac.id,
                    coleta.data,
                    COLETA.HORA,
                    COLETA.ID,
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA,
                    MOVPAC.HORAINI,
                    MOVPAC.HORAFIM,
                    MOVPAC.DATAENTRA,
                    MOVPAC.HORAENTRA,
                    PRONTUARIO.NOME,
                    CONVENIO.CODIGO,
                    CONVENIO.FANTASIA,
                    OPERADOR.NOME,
                    OPERADOR.ID `;

            let orderBy = '';

            if (modelo === 'data')
                orderBy = 'ORDER BY COLETA.DATA, OPERADOR.NOME, COLETA.HORA, MOVPAC.POSTO, MOVPAC.AMOSTRA ';
            else if (modelo === 'geral')
                orderBy = ' ORDER BY OPERADOR.NOME, MOVPAC.POSTO, MOVPAC.AMOSTRA ';
            else orderBy = ' ORDER BY MOVPAC.POSTO, COLETA.DATA, COLETA.HORA, MOVPAC.AMOSTRA '

            let limit = ' LIMIT 100001';

            select += groupBy;
            select += orderBy;
            select += limit;

            const dados = await Movexa.sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                });

            if (dados.length > 100000) {
                throw new RangeError('Quantidade acima do limite')
            }

            return res.status(200).json(dados);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

    }

    async gerarRelatorio(req, res) {
        const { dados, dataini, datafim, color, logo, profile } = req.body;

        const { modelo } = dados;
        let dadosParaRelatorio = [];
        const length = dados.exames.length;
        if (modelo === 'data') {
            for (let i = 0; i < length; i++) {
                const element = dados.exames[i];
                element.duracao = calcularDiferencaEmHoras(element.dataentra, element.data, element.horaentra, element.hora)
                element.data = format(parseISO(element.data), 'dd/MM/yyyy');
                element.dataentra = format(parseISO(element.dataentra), 'dd/MM/yyyy');
                const temExameNaMesmaData = dadosParaRelatorio.find(ex => ex.data === element.data);
                if (temExameNaMesmaData) {
                    const temOmesmoOperador = temExameNaMesmaData.operadores.find(op => op.id === element.operador_id);
                    if (temOmesmoOperador) {
                        temOmesmoOperador.exames.push(element);
                        temOmesmoOperador.totalDeExames += parseInt(element.totexa);
                        temOmesmoOperador.totalDePacientes += parseInt(element.totpac);
                    }else {
                        temExameNaMesmaData.operadores.push({
                            id: element.id,
                            nome: element.nomope,
                            totalDeExames: parseInt(element.totexa),
                            totalDePacientes: parseInt(element.totpac),
                            exames: [
                                element
                            ]
                        });
                    }
                    temExameNaMesmaData.totalDePacientes += parseInt(element.totpac);
                    temExameNaMesmaData.totalDeExames += parseInt(element.totexa);
                }else {
                    dadosParaRelatorio.push({
                        data: element.data,
                        totalDePacientes: parseInt(element.totpac),
                        totalDeExames: parseInt(element.totexa),
                        operadores: [
                            {
                                id: element.id,
                                nome: element.nomope,
                                totalDeExames: parseInt(element.totexa),
                                totalDePacientes: parseInt(element.totpac),
                                exames: [
                                    element
                                ]
                            }
                        ]
                    });
                }
            }
        }else if (modelo === 'posto') {
            //relatório por posto
                for (let i = 0; i < length; i++) {
                    const element = dados.exames[i];
                    element.duracao = calcularDiferencaEmHoras(element.dataentra, element.data, element.horaentra, element.hora)
                    element.data = format(parseISO(element.data), 'dd/MM/yyyy');
                    element.dataentra = format(parseISO(element.dataentra), 'dd/MM/yyyy');
                    const temExameDoMesmoPosto = dadosParaRelatorio.find(ex => ex.posto === element.posto);
                    if (temExameDoMesmoPosto) {
                        temExameDoMesmoPosto.coletas.push(element);
                        temExameDoMesmoPosto.totalDePacientes += parseInt(element.totpac);
                        temExameDoMesmoPosto.totalDeExames += parseInt(element.totexa);
                    }else {
                        dadosParaRelatorio.push({
                            posto: element.posto,
                            totalDePacientes: parseInt(element.totpac),
                            totalDeExames: parseInt(element.totexa),
                            coletas: [element]
                        });
                    }
                }
        }else {
            //relatório por geral
            for (let i = 0; i < length; i++) {
                const element = dados.exames[i];
                element.duracao = calcularDiferencaEmHoras(element.dataentra, element.data, element.horaentra, element.hora)
                element.data = format(parseISO(element.data), 'dd/MM/yyyy');
                element.dataentra = format(parseISO(element.dataentra), 'dd/MM/yyyy');
                const temExameDoMesmoOperador = dadosParaRelatorio.find(ex => ex.id === element.operador_id);
                if (temExameDoMesmoOperador) {
                    temExameDoMesmoOperador.coletas.push(element);
                    temExameDoMesmoOperador.totalDePacientes += parseInt(element.totpac);
                    temExameDoMesmoOperador.totalDeExames += parseInt(element.totexa);
                }else {
                    dadosParaRelatorio.push({
                        id: element.operador_id,
                        nome: element.nomope,
                        totalDePacientes: parseInt(element.totpac),
                        totalDeExames: parseInt(element.totexa),
                        coletas: [element]
                    });
                }
            }
        }

        const totais = dadosParaRelatorio.reduce(
            (acc, curr) => {
                return {
                    exames: acc.exames + curr.totalDeExames,
                    pacientes: acc.pacientes + curr.totalDePacientes,
                };
            },
            { exames: 0, pacientes: 0 }
        );

        try {
            const html = await gerarRelatorioHtml({
                model: `/estatisticas/coleta/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    totais,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte,
                    modelo,
                },
                startDate: dataini,
                endDate: datafim,
                profile,
                logo,
                color: `#${color}`,
            })

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

}

export default new ColetaMaterialController();
