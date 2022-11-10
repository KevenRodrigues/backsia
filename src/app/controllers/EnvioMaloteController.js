import { QueryTypes } from 'sequelize';
import Database from '../../database';
import { format, parseISO, max } from 'date-fns';

import { gerarRelatorioHtml, PegaData, PegaHora, geraId, procSQL } from './functions/functions';

class EnvioMaloteController {
    async listarMalotes(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { Operador } = Database.getModels(req.database);

            const { lote_todos_postos, posto } = req.query;

            let instrucaosql = '';

            instrucaosql = `
                SELECT
                MALOTE.ID,
                MALOTE.DATA,
                MALOTE.HORA,
                OPERADOR.NOME,
                (SELECT COUNT(DISTINCT(TRIAGEM.TUBO)) FROM TRIAGEM WHERE TRIAGEM.MALOTE_ID = MALOTE.ID) QTDATU,
                MALOTE.POSTO,
                MALOTE.ENVIADO,
                MALOTE.RECEBIDO,
                MALOTE.DT_ENVIADO_MALOTE,
                MALOTE.HR_ENVIADO_MALOTE,
                MALOTE.DT_RECEBIDO_MALOTE,
                MALOTE.HR_RECEBIDO_MALOTE
                FROM MALOTE
                LEFT JOIN OPERADOR ON OPERADOR.ID = MALOTE.OPERADOR_ID
                WHERE
                ((COALESCE(length((Cast(${lote_todos_postos} AS CHAR))),0) = 0) OR MALOTE.POSTO = '${posto}')
            `;

            const getPostoPerm = await Operador.findOne({
                where: { id: req.userId },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            let { postoperm } = getPostoPerm;

            postoperm = !postoperm ? null : postoperm.trim();

            if (postoperm) {
                instrucaosql += `AND (MALOTE.POSTO IN ('${postoperm}'))`
            }

            instrucaosql += `ORDER BY MALOTE.DATA DESC, MALOTE.ID DESC`

            let curmaloteant = await sequelize
                .query(instrucaosql, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            curmaloteant.map(item => {
                item.selected = false;
                item.malote_id = item.id;
                return item;
            });

            return res.status(200).json(curmaloteant);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async listarMaloteColeta(req, res) {
        const malote_id = req.params.id;

        try {
            const sequelize = Database.instances[req.database];

            let instrucaosql = '';

            instrucaosql = `
                SELECT
                CAST(TRIM(COALESCE(
                (CASE WHEN COALESCE(T.COLETADO,0) = 0 AND COALESCE(MOVEXA.ENTREGUE,0) = 1 THEN
                        (CASE COALESCE(PARAM2.CHAR_ETQ,0) WHEN 2 THEN
                            T.POSTO||T.AMOSTRA||LPAD(TRIM(CAST(COALESCE(T.RECIPTRI_ID,0) AS CHAR(3))),3,'0')
                        ELSE
                            SUBSTR(T.POSTO,2)||T.AMOSTRA||SUBSTR(LPAD(TRIM(CAST(COALESCE(T.RECIPTRI_ID,0) AS CHAR(3))),3,'0'),2,2)
                        END)
                ELSE
                    MOVEXA.TUBO
                END),'')) AS CHAR(15)) AS TUBO,
                CAST(TRIM(T.POSTO) AS CHAR(3)) AS POSTO,
                CAST(TRIM(T.AMOSTRA) AS CHAR(6)) AS AMOSTRA,
                MOVPAC.DATAENTRA,
                PRONTUARIO.NOME,
                CAST(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(CAST(
                    (SELECT array_agg(DISTINCT(TRIM(SUBSTR(COALESCE(MATERIAL.DESCRICAO,''),1,20)))||' ')
                    FROM MOVEXA
                    LEFT JOIN TRIAGEM    ON TRIAGEM.MOVEXA_ID = MOVEXA.ID
                    LEFT JOIN MATERIAL   ON MATERIAL.ID = MOVEXA.MATERIAL_ID
                    WHERE (MOVEXA.MOVPAC_ID = T.MOVPAC_ID) AND TRIAGEM.RECIPTRI_ID = T.RECIPTRI_ID) AS TEXT)
                    ,',',' '),'"',''),'{',''),'}','')) AS CHAR(240)) AS DESCMAT,
                A.DESCRICAO AS DESCRECIPTRI,
                T.MALOTE_ID,
                T.MOVPAC_ID,
                T.RECIPTRI_ID,
                T.RECIPCOL_ID,
                MOVEXA.COLETA_ID,
                T.DATAMALOTE,
                T.HORAMALOTE,
                POSTO.CONTROLA_COLETA_ENTREGA,
                MOVEXA.ENTREGUE,
                COUNT(*) AS QTDEXA
                FROM TRIAGEM T
                LEFT JOIN MOVEXA     ON MOVEXA.ID = T.MOVEXA_ID
                LEFT JOIN MOVPAC     ON MOVPAC.ID = T.MOVPAC_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                LEFT JOIN RECIP A    ON A.ID = T.RECIPTRI_ID
                LEFT JOIN POSTO      ON POSTO.CODIGO = T.POSTO
                LEFT JOIN PARAM      ON PARAM.ID = 1
                LEFT JOIN PARAM2     ON PARAM2.ID = 1
                WHERE  T.MALOTE_ID = ${malote_id} AND COALESCE(T.RECIPTRI_ID,0) > 0
                GROUP BY T.POSTO, T.AMOSTRA, MOVEXA.TUBO, T.MOVPAC_ID, MOVPAC.DATAENTRA, PARAM2.CHAR_ETQ, PRONTUARIO.NOME, A.DESCRICAO, T.RECIPTRI_ID, T.RECIPCOL_ID, T.MALOTE_ID, MOVEXA.COLETA_ID, T.DATAMALOTE, T.HORAMALOTE, POSTO.CONTROLA_COLETA_ENTREGA, MOVEXA.ENTREGUE, T.COLETADO
                ORDER BY T.POSTO, T.AMOSTRA, MOVEXA.TUBO, T.MOVPAC_ID, T.RECIPTRI_ID, T.MALOTE_ID, MOVEXA.COLETA_ID, T.DATAMALOTE, T.HORAMALOTE
            `;

            let curmalotecoletaant = await sequelize
                .query(instrucaosql, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            curmalotecoletaant.map(item => {
                item.selected = false
                item.descreciptri = item.descreciptri.trim();
                return item;
            });

            return res.status(200).json(curmalotecoletaant);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async listarColetas(req,res){
        try {
            const sequelize = Database.instances[req.database];

            const { posto } = req.query;

            let instrucaosql = '';

            instrucaosql = `
                SELECT
                CAST(TRIM(COALESCE(
                (CASE WHEN COALESCE(T.COLETADO,0) = 0 AND COALESCE(MOVEXA.ENTREGUE,0) = 1 THEN
                        (CASE COALESCE(PARAM2.CHAR_ETQ,0) WHEN 2 THEN
                            T.POSTO||T.AMOSTRA||LPAD(TRIM(CAST(COALESCE(T.RECIPTRI_ID,0) AS CHAR(3))),3,'0')
                        ELSE
                            SUBSTR(T.POSTO,2)||T.AMOSTRA||SUBSTR(LPAD(TRIM(CAST(COALESCE(T.RECIPTRI_ID,0) AS CHAR(3))),3,'0'),2,2)
                        END)
                ELSE
                    MOVEXA.TUBO
                END),'')) AS CHAR(15)) AS TUBO,
                CAST(TRIM(T.POSTO) AS CHAR(3)) AS POSTO,
                CAST(TRIM(T.AMOSTRA) AS CHAR(6)) AS AMOSTRA,
                MOVPAC.DATAENTRA,
                PRONTUARIO.NOME,
                CAST(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(CAST(
                    (SELECT array_agg(DISTINCT(TRIM(SUBSTR(COALESCE(MATERIAL.DESCRICAO,''),1,20)))||' ')
                    FROM MOVEXA
                    LEFT JOIN TRIAGEM    ON TRIAGEM.MOVEXA_ID = MOVEXA.ID
                    LEFT JOIN MATERIAL   ON MATERIAL.ID = MOVEXA.MATERIAL_ID
                    WHERE (MOVEXA.MOVPAC_ID = T.MOVPAC_ID) AND TRIAGEM.RECIPTRI_ID = T.RECIPTRI_ID) AS TEXT)
                    ,',',' '),'"',''),'{',''),'}','')) AS CHAR(240)) AS DESCMAT,
                A.DESCRICAO AS DESCRECIPTRI,
                T.MALOTE_ID,
                T.MOVPAC_ID,
                T.RECIPTRI_ID,
                T.RECIPCOL_ID,
                MOVEXA.COLETA_ID,
                T.DATAMALOTE,
                T.HORAMALOTE,
                POSTO.CONTROLA_COLETA_ENTREGA,
                MOVEXA.ENTREGUE,
                COUNT(*) AS QTDEXA
                FROM TRIAGEM T
                LEFT JOIN MOVEXA     ON MOVEXA.ID = T.MOVEXA_ID
                LEFT JOIN MOVPAC     ON MOVPAC.ID = T.MOVPAC_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                LEFT JOIN RECIP A    ON A.ID = T.RECIPTRI_ID
                LEFT JOIN POSTO      ON POSTO.CODIGO = T.POSTO
                LEFT JOIN PARAM      ON PARAM.ID = 1
                LEFT JOIN PARAM2     ON PARAM2.ID = 1
                WHERE MOVEXA.STATUSEXM = 'FM' AND (COALESCE(T.COLETADO,0) = 1 OR COALESCE(MOVEXA.ENTREGUE,0) = 1) AND COALESCE(T.MALOTE_ID,0) = 0 AND MOVEXA.POSTO = '${posto}' AND COALESCE(T.RECIPTRI_ID,0) > 0
                GROUP BY  T.POSTO, T.AMOSTRA, MOVEXA.TUBO, T.MOVPAC_ID, MOVPAC.DATAENTRA, PARAM2.CHAR_ETQ, PRONTUARIO.NOME, A.DESCRICAO, T.RECIPTRI_ID, T.RECIPCOL_ID, T.MALOTE_ID, MOVEXA.COLETA_ID, T.DATAMALOTE, T.HORAMALOTE, POSTO.CONTROLA_COLETA_ENTREGA, MOVEXA.ENTREGUE, T.COLETADO
                ORDER BY  T.POSTO, T.AMOSTRA, MOVEXA.TUBO, T.MOVPAC_ID, T.RECIPTRI_ID, T.MALOTE_ID, MOVEXA.COLETA_ID, T.DATAMALOTE, T.HORAMALOTE
            `;

            let curmalote = await sequelize
                .query(instrucaosql, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            curmalote.map(item => {
                item.marca = false;
                item.tubo = item.tubo.trim();
                item.nome = item.nome.trim();
                item.descreciptri = item.descreciptri.trim();
                item.descmat = item.descmat.trim();
                return item;
            });

            return res.status(200).json(curmalote);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async descoletar (req,res){
        const sequelize = Database.instances[req.database];
        const { Movexa, Triagem, Malote, Movpac } = Database.getModels(req.database);

        try {
            const { selecionados, motivo, naodtentgeralfm, usaleitubo, operador_id} = req.body;
            const motivo_descoleta = motivo;

            const errosBanco = [];

            for (const curmalote of selecionados) {

                await sequelize
                    .transaction(async transaction => {
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

                        if(curmalote.entregue === '1') {
                            camovexa_sql += " WHERE  ";
                            camovexa_sql += curmalote.coleta_id > 0 ? ` (MOVEXA.COLETA_ID = ${curmalote.coleta_id}` : ` (MOVEXA.MOVPAC_ID = ${curmalote.movpac_id}`
                            camovexa_sql += ` AND EXAME.RECIPTRI_ID = '${curmalote.reciptri_id}')`;
                        } else {
                            camovexa_sql += " WHERE  ";
                            camovexa_sql += curmalote.coleta_id > 0 ? ` (MOVEXA.COLETA_ID = ${curmalote.coleta_id}` : ` (MOVEXA.MOVPAC_ID = ${curmalote.movpac_id}`
                            camovexa_sql += ` AND TRIM(MOVEXA.TUBO) = '${curmalote.tubo.trim()}') `;
                        }

                        let crmovexa = await sequelize
                            .query(camovexa_sql, {
                                type: QueryTypes.SELECT,
                            })
                            .catch(sequelize, err => {
                                return err.message;
                            });

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
                        `;

                        if(curmalote.entregue === '1') {
                            instrucaosql_curtria += " WHERE  ";
                            instrucaosql_curtria += curmalote.coleta_id > 0 ? ` (TRIAGEM.COLETA_ID = ${curmalote.coleta_id}` : ` (MOVEXA.MOVPAC_ID = ${curmalote.movpac_id}`;
                            instrucaosql_curtria += ` AND TRIAGEM.RECIPTRI_ID = '${curmalote.reciptri_id}')`;
                        } else {
                            instrucaosql_curtria += " WHERE  ";
                            instrucaosql_curtria += curmalote.coleta_id > 0 ? ` (TRIAGEM.COLETA_ID = ${curmalote.coleta_id}` : ` (MOVEXA.MOVPAC_ID = ${curmalote.movpac_id}`;
                            instrucaosql_curtria += ` AND TRIM(TRIAGEM.TUBO) = '${curmalote.tubo.trim()}') `;
                        }

                        const curtria = await sequelize
                            .query(instrucaosql_curtria, {
                                type: QueryTypes.SELECT,
                            })
                            .catch(sequelize, err => {
                                return err.message;
                            });

                        const malote_id = crmovexa[0].malote_id;

                        const camalote = await Malote.findOne({
                                where:{id: malote_id}
                            })
                            .catch(sequelize, err => {
                                return err.message;
                            });


                        if(curtria.length > 0){
                        for (const obj of curtria) {
                            const statusexm = await procSQL(
                                req,
                                'movexa',
                                'statusexm',
                                {id: obj.movexa_id}
                            );

                            if(statusexm === "FU" || "FM" || "TR" || "AP" || "ER" || "NC"){
                                obj.coletado = 0;
                                obj.coleta_id = null;
                                obj.malote_id = null;
                                obj.tubo = null;
                                obj.datamalote = null;
                                obj.horamalote = null;
                                obj.idopera_ultacao = operador_id;

                                // ATUALIZAR TRIAGEM
                                await Triagem.update(obj, {
                                    where: { id: obj.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            };
                        }
                        }

                        const atual_movpac_id = crmovexa[0].movpac_id;

                        if(crmovexa.length > 0){
                            for (const obj of crmovexa) {
                                if(obj.statusexm === "FU" || "FM" || "TR" || "AP" || "ER" || "NC"){
                                    obj.malote_id = null;
                                    obj.coleta_id = null;
                                    obj.tubo = null;
                                    obj.veio = 2;
                                    obj.dtcoleta = null;
                                    obj.hrcoleta = null;
                                    obj.dtentrega = null;
                                    obj.motivo_descoleta = motivo_descoleta;
                                    obj.statusexm = "FU";
                                    obj.idopera_ultacao = operador_id;

                                    //GRAVAR O CRMOVEXA
                                    await Movexa.update(obj, {
                                        where: { id: obj.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });

                                    await Movexa.sequelize.query(
                                        `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                            obj.id
                                        },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                            operador_id
                                        },'MATERIAL MARCADO COMO NÃO COLETADO STATUS: ${obj.statusexm}','${
                                            req.headers.host
                                        }')`
                                    );
                                }
                            }
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

                        crmovpacm_sql+= ` where movpac.id = ${atual_movpac_id}`;

                        const getCrmovpacm = await sequelize
                        .query(crmovpacm_sql, {
                            type: QueryTypes.SELECT,
                        })
                        .catch(sequelize, err => {
                            return err.message;
                        });

                        let crmovpacm = getCrmovpacm[0];

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
                                    item.dtentrega = exa.dtentrega ? parseISO(exa.dtentrega) : null;
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
                                crmovpacm.dtentrega = newDtEntrega ? format(newDtEntrega, 'yyyy-MM-dd') : null;
                            }
                        } else {
                            crmovpacm.dtentrega = newDtEntrega ? format(newDtEntrega, 'yyyy-MM-dd') : null;
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
                            paciente: curmalote.nome,
                            msg: 'Erro ao salvar, no banco de dados, ação não finalizada.',
                            err
                        })
                    });
            }

            res.status(200).json(errosBanco);
        } catch (err) {
            res.status(400).json({error: err.message});
        }
    }

    async gerarMalote (req,res){
        try {
            const sequelize = Database.instances[req.database];
            const { Movexa, Triagem, Malote } = Database.getModels(req.database);

            const { selecionados, operador_id, posto, dt_banco } = req.body;

            const datamalote = await PegaData(req, dt_banco);
            const horamalote = await PegaHora(req, dt_banco);
            let atual_movpac_id = 0;
            let criou_lote_malote = false;
            let malote_id = null;
            let geroumalote = false;
            let crmalote = null;

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
                    WHERE COALESCE(TRIAGEM.RECIPTRI_ID,0) = ${curcoleta.reciptri_id} AND TRIAGEM.MOVPAC_ID = ${curcoleta.movpac_id} AND
                    COALESCE(TRIAGEM.MALOTE_ID,0) = 0 AND (COALESCE(TRIAGEM.COLETADO,0) = 1 OR COALESCE(MOVEXA.ENTREGUE,0) = 1) AND MOVEXA.STATUSEXM = 'FM'
                `;

                const curtria = await sequelize
                    .query(instrucaosql_curtria, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                if(curtria.length > 0){
                    await sequelize
                    .transaction(async transaction => {
                        if(!criou_lote_malote){
                            malote_id = await geraId(req,"malote_id_seq");
                            crmalote = {
                                id: malote_id,
                                data: await PegaData(req, dt_banco),
                                hora: await PegaHora(req, dt_banco),
                                operador_id,
                                qtdtubos: selecionados.length,
                                posto,
                                idopera_ultacao: operador_id
                            }
                            criou_lote_malote = true;
                        }

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

                        for (const exm of crmovexa) {
                            exm.malote_id = malote_id;
                            if(exm.coleta_id === '0'){
                                exm.tubo = crmalote.tubo
                            }

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
                                },'MATERIAL ENVIADO PARA MALOTE: ${malote_id} STATUS: ${exm.statusexm}','${
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
                            item.malote_id = malote_id;
                            item.datamalote = datamalote;
                            item.horamalote = horamalote;
                            item.idopera_ultacao = operador_id;

                            if(item.coleta_id === '0'){
                                item.tubo = crmalote.tubo;
                            }

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
                        geroumalote = true;
                    });
                } else {
                    erros.push({error: `Tubo ${curcoleta.tubo} não esta mais em condições de ser coletado.`});
                }

            }

            atual_movpac_id = 0;

            if(geroumalote){
                await Malote.create(crmalote)
                .catch(err => {
                    return res
                        .status(400)
                        .json({ error: err.message });
                });
                return res.status(200).json(malote_id);
            } else {
                return res.status(400).json({error: 'Nenhum malote foi gerado'});
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async imprimirMalote (req,res){
        const { dataReport } = req.body;
        try {
            const reportHtml = await gerarRelatorioHtml(dataReport);
            return res.status(200).json(reportHtml);
        } catch (err) {
            return res.status(400).json({
                error: err.message,
            });
        }
    }
}

export default new EnvioMaloteController();
