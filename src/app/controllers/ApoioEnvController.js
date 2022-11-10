import { QueryTypes } from 'sequelize';
import { format } from 'date-fns';
import Database from '../../database';
import {
    EnvioAlvaro,
    EnvioAlvaroWs,
    EnvioPardini,
    EnvioPardiniWs,
    EnvioDb,
    EnvioDbWs,
    EnvioMaricondi,
    EnvioMaricondiWs,
    EnvioWs,
} from './functions/apoioenv';
import { gerarRelatorioHtml, calculaDiasMovpacPorParametro } from './functions/functions';

class ApoioEnvController {
    async filtrar(req, res) {
        const sequelize = Database.instances[req.database];
        try {
            const date = await calculaDiasMovpacPorParametro(req);

            let { leituradetubo } = req.query;
            leituradetubo = leituradetubo === 'true';

            let caarqapoio = `
                select movpac.posto, movpac.amostra, prontuario.nome, apoio.razao, exame.codigo, exame.descricao, movexa.statusexm, movexa.dtcoleta, movexa.dtentrega, 0 as marca,  movexa.leuc, movexa.linf, movexa.obsapo, movexa.volume, movexa.peso, movexa.idadegest, movexa.altura, movpac.obs, movexa.tpdiurese, movexa.hrcoleta, prontuario.sexo, movpac.id as idmovpac, movexa.id as idmovexa, prontuario.data_nasc, apoio.codlab, apoioexm.codlab as codlabexm, apoioexm.conservante, apoioexm.materiala, apoioexm.materialdi, apoio.arqrotina, apoio.arqrotinaweb, apoio.pathapo, movexa.exame_id, movexa.id, movexa.labapoio, movpac.horaentra, movexa.material_id, material.descricao as descmat, movexa.dtapoio, movexa.apoio_id, apoio.id as id_apoio, movexa.movpac_id, exame.recipcol_id, exame.reciptri_id, apoioexm.descamo, apoio.senhalab, apoioexm.obrigavol, apoioexm.obrigapeso, apoioexm.obrigaidade, apoioexm.obrigaalt, apoioexm.obrigaleuco, apoioexm.obrigalinfo, movexa.apoioresu, movpac.pos_apoiado, movpac.id_pac_lab, movpac.codigoctrl, movexa.datalib, operador.nomecomp, material.deparamat, movexa.resultado, convenio.caminho_arqapoiado, movexa.layout_id, movexa.convenio_id, movpac.dataentra, movpac.idade, movexa.medico_id, medico.crm, medico.nome_med, medico.ufcrm, exame.depara as de_para, exame.enviawww as enviawwwexa, apoioexm.tempodiurese, apoioexm.horadecoleta, movexa.urgenteexm, movpac.medicament, movpac.dum, movexa.amo_apoiado, convenio.codigo as codconv, materialb2b, codexmlabb2b, datacoletab2b, horacoletab2b, codexmapoiob2b, metodo.descricao as descmetodo, prontuario.posto as posprontu, prontuario.prontuario, apoio.ws_lote, movpac.prontuario_id, loteapoiob2b, apoio.ws_endweb, movexa.cadeiab2b, prontuario.rg, prontuario.cpf, movexa.codpedapoio, apoio.ws_senha, apoio.ws_idagente, apoio.ws_versao, apoio.amostra_envio, apoio.amostra_retorno, apoio.layout_ws, movexa.retorno_ws, movexa.etiqueta_ws, movpac.altura_atend, movexa.etiquetaws_id, etiquetaws.etiqueta, etiquetaws.etiqueta2, etiquetaws.etiqueta3, etiquetaws.etiqueta4, etiquetaws.etiqueta5, etiquetaws.etiqueta6, apoiopos.codlab as codlabpos, apoiopos.senhalab as senhalabpos, movpac.sintoma, movpac.iniciosintomas, movpac.municipio, apoioexm.teste_covid, exame.envio_rnds, exame.exm_covid19, apoio.url_envio_rnds, apoio.envio_res_rnds, apoio.idlabrnds, movexa.data_lanres, movexa.hora_lanres, prontuario.cns, movexa.id_rnds, movexa.APOIORES,movexa.APOIOCRES, '' AS TIPO, '' AS CODERRO, '' AS RETWS, apoioexm.OBGLOCCOL, movexa.LOCAL_COLETA  from movexa left join movpac on movpac.id = movexa.movpac_id left join prontuario on prontuario.id = movpac.prontuario_id left join exame on exame.id = movexa.exame_id left join apoio on apoio.id = exame.apoio_id left join apoioexm on apoioexm.exame_id = exame.id and apoioexm.apoio_id = apoio.id left join material on material.id = movexa.material_id left join convenio on convenio.id = movexa.convenio_id left join operador on operador.id = movexa.assina_ope left join medico on medico.id = movexa.medico_id left join metodo on metodo.id = exame.metodo_id left join etiquetaws on etiquetaws.id = movexa.etiquetaws_id left join apoiopos on apoiopos.posto = movpac.posto and apoiopos.apoio_id = apoio.id
            `;

            let instrucaosql = '';

            if (!leituradetubo) {
                instrucaosql += `
                    WHERE (MOVEXA.DTCOLETA BETWEEN '${req.query.datainicial}' AND '${req.query.datafinal}')
                    AND EXAME.APOIO_ID = ${req.query.apoio_id}
                    AND APOIOEXM.APOIO_ID = ${req.query.apoio_id}
                `;
            } else {
                instrucaosql += `
                    WHERE
                    APOIOEXM.APOIO_ID = ${req.query.apoio_id}
                    AND EXAME.APOIO_ID = ${req.query.apoio_id}
                    AND MOVEXA.POSTO = '${req.query.posto}'
                    AND MOVEXA.AMOSTRA = '${req.query.amostra}'
                    AND (EXAME.RECIPCOL_ID = '${req.query.tubo}' OR EXAME.RECIPTRI_ID = '${req.query.tubo}' )
                `;
            }

            switch (req.query.status) {
                case 'enviados':
                    instrucaosql +=
                        " AND (MOVEXA.STATUSEXM = 'TR' OR MOVEXA.STATUSEXM = 'AP') AND MOVEXA.LABAPOIO = 1 AND COALESCE(APOIOEXM.STATUS,0) = 0 ";
                    break;
                case 'naoenviado':
                    instrucaosql +=
                        " AND MOVEXA.STATUSEXM = 'TR' AND COALESCE(MOVEXA.LABAPOIO,0) = 0 AND COALESCE(APOIOEXM.STATUS,0) = 0 ";
                    break;
                case 'ambos':
                    instrucaosql +=
                        " AND (MOVEXA.STATUSEXM = 'TR' OR MOVEXA.STATUSEXM = 'AP') AND COALESCE(APOIOEXM.STATUS,0) = 0 ";
                    break;
                default:
                    break;
            }

            if (req.query.postoperm && req.query.postoperm.trim()) {
                instrucaosql += ` AND (MOVPAC.POSTO IN ('" + STRTRAN(ALLTRIM(NVL(${req.query.postoperm},"")),",","','") + "')) `;
            }

            if (req.query.convperm && req.query.convperm.trim()) {
                instrucaosql += ` AND(CONVENIO.CODIGO IN ('" + STRTRAN(ALLTRIM(NVL(${req.query.convperm},"")),",","','") + "')) `;
            }

            if (req.query.posto_id) {
                instrucaosql += ` AND MOVEXA.POSTO = ${req.query.posto_id} `;
            }

            // FILTRA ENTREGA - ARCADIO - 25/10/2016
            if (req.query.entrega_id) {
                instrucaosql += ` AND MOVPAC.ENTREGA_ID = ${req.query.entrega_id} `;
            }

            if (date) {
                instrucaosql += ` AND (MOVPAC.dataentra >= '${date}')`;
            }

            instrucaosql +=
                ' ORDER BY POSTO, AMOSTRA, RECIPCOL_ID, RECIPTRI_ID, DTCOLETA ';

            caarqapoio += instrucaosql;

            if (req.query.variosapoios === '1') {
                const newstr = caarqapoio.replace(
                    'exame.apoio_id',
                    `${req.query.apoio_id}`
                );
                const change = `AND EXAME.APOIO_ID = ${req.query.apoio_id}`;
                const newstr2 = newstr.replace(change, '');
                caarqapoio = newstr2;
            }

            const selectsql = await sequelize
                .query(caarqapoio, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            const exames = [];

            if (selectsql.length > 0) {
                for (const exame of selectsql) {
                    let error = false;
                    const validations = [
                        { campo: exame.obrigaleuco, valor: exame.leuc },
                        { campo: exame.obrigalinfo, valor: exame.linf },
                        { campo: exame.obrigavol, valor: exame.volume },
                        { campo: exame.obrigaidade, valor: exame.idadegest },
                        { campo: exame.obrigapeso, valor: exame.peso },
                        { campo: exame.horadecoleta, valor: exame.hrcoleta },
                        { campo: exame.tempodiurese, valor: exame.tpdiurese },
                        { campo: exame.obgloccol, valor: exame.local_coleta },
                    ];
                    for (const validate of validations) {
                        if (
                            validate.campo === '1' &&
                            (validate.valor === '' ||
                                validate.valor === null ||
                                validate.valor === undefined)
                        ) {
                            error = true;
                        }
                    }
                    if (
                        exame.obrigaalt === '1' &&
                        (exame.altura === '' ||
                            exame.altura === null ||
                            exame.altura === undefined) &&
                        (exame.altura_atend === '' ||
                            exame.altura_atend === null ||
                            exame.altura_atend === undefined)
                    ) {
                        error = true;
                    }
                    exames.push({ ...exame, error });
                }
            }

            return res.status(200).json(exames);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async filtrarWs(req, res) {
        const sequelize = Database.instances[req.database];
        try {
            const { posto, amostra } = req.query;

            const instrucaosql = `select id from movexa where movexa.posto = '${posto}' and movexa.amostra = '${amostra}'`;

            const selectsql = await sequelize
                .query(instrucaosql, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            return res.status(200).json(selectsql);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async enviar(req, res) {
        const { Movexa, Movapoio, TabLogReg } = Database.getModels(
            req.database
        );
        const { webservice, leituradetubo, dataReport } = req.body;
        let { curarqapoio } = req.body;
        let html = '';
        try {
            if (!webservice) {
                const dataenvapo = new Date();
                const hh = dataenvapo.getHours();
                const mm = dataenvapo.getMinutes();
                const horaenvapo = `${hh}:${mm}`;
                const crmovapoio = [];
                const crs_tab_logreg = [];
                let envioRetorno = '';
                let xml = '';
                const modelo = curarqapoio[0].arqrotinaweb;

                switch (modelo) {
                    case 'alvaro':
                        envioRetorno = await EnvioAlvaro(curarqapoio);
                        break;
                    case 'pardini':
                        envioRetorno = await EnvioPardini(req, curarqapoio);
                        break;
                    case 'db':
                        envioRetorno = await EnvioDb(req, curarqapoio);
                        break;
                    case 'maricondi':
                        envioRetorno = await EnvioMaricondi(req, curarqapoio);
                        break;
                    default:
                        envioRetorno = {
                            xml: {
                                error: `Arquivo de rotina ${modelo}, não encontrado.`,
                            },
                        };
                        break;
                }

                if (envioRetorno && envioRetorno.xml.error) {
                    throw new Error(envioRetorno.xml.error);
                }

                const arquivo = `${modelo}_${format(
                    dataenvapo,
                    'ddMMyyyy'
                )}.xml`;

                curarqapoio = curarqapoio.map(item => {
                    item.statusexm = 'AP';
                    item.labapoio = 1;
                    item.dtapoio = format(dataenvapo, 'yyyy-MM-dd');
                    item.apoio_id = item.id_apoio;

                    crmovapoio.push({
                        posto: item.posto,
                        amostra: item.amostra,
                        exame_id: item.exame_id,
                        movpac_id: item.idmovpac,
                        movexa_id: item.idmovexa,
                        apoio_id: item.id_apoio,
                        operador_id: req.userId,
                        data: format(dataenvapo, 'yyyy-MM-dd'),
                        hora: horaenvapo,
                        arquivo,
                    });

                    const volume =
                        item.volume !== null ? item.volume.trim() : '';

                    if (volume) {
                        crs_tab_logreg.push({
                            tabela: 'movexa',
                            idreg: item.id,
                            idopera: req.userId,
                            field: 'VOLUME',
                            oldval: '',
                            newval: volume.trim(),
                            data: format(dataenvapo, 'yyyy-MM-dd'),
                            maquina: req.headers.host,
                            hora: horaenvapo,
                        });
                    }

                    return item;
                });

                // AQUI VAI INICIAR UMA TRANSACTION
                await Movexa.sequelize.transaction(async transaction => {
                    for (const item of curarqapoio) {
                        await Movexa.sequelize
                            .query(
                                `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${item.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'ENVIO DO EXAME PARA APOIO VIA XML STATUS: ${item.statusexm}','${req.headers.host}')`
                            )
                            .catch(Movexa.sequelize, err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                    }
                    for (const item of curarqapoio) {
                        await Movexa.update(item, {
                            where: { id: item.id },
                            transaction,
                        }).catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                    for (const item of crmovapoio) {
                        await Movapoio.create(item, {
                            transaction,
                        }).catch(Movapoio.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                    for (const item of crs_tab_logreg) {
                        await TabLogReg.create(item, {
                            transaction,
                        }).catch(Movapoio.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                });

                xml = envioRetorno.xml;
                dataReport.data = envioRetorno.report;
                html = await gerarRelatorioHtml(dataReport);

                return res.status(200).json({ xml, html, arquivo });
            }
            let envioRetorno = {};
            switch (curarqapoio[0].layout_ws) {
                case '2':
                    envioRetorno = await EnvioPardiniWs(
                        req,
                        false,
                        leituradetubo,
                        curarqapoio
                    );
                    break;
                case '3':
                    envioRetorno = await EnvioAlvaroWs(
                        req,
                        false,
                        leituradetubo,
                        curarqapoio
                    );
                    break;
                case '4':
                    envioRetorno = await EnvioDbWs(
                        req,
                        false,
                        leituradetubo,
                        curarqapoio
                    );
                    break;
                case '5':
                    envioRetorno = await EnvioMaricondiWs(
                        req,
                        false,
                        leituradetubo,
                        curarqapoio
                    );
                    break;
                default:
                    break;
            }
            if (envioRetorno.retornoWS && envioRetorno.retornoWS.error) {
                throw new Error(envioRetorno.retornoWS.error.message);
            }

            if (envioRetorno.report && envioRetorno.report.length > 0) {
                dataReport.data = envioRetorno.report;
                html = await gerarRelatorioHtml(dataReport);
            }

            const { retornoTubo, imprimeEtiqueta } = envioRetorno;
            envioRetorno = envioRetorno.retornoWS;

            if (retornoTubo) {
                return res.status(200).json({
                    webservice,
                    envioRetorno,
                    retornoTubo,
                    imprimeEtiqueta,
                });
            }

            return res
                .status(200)
                .json({ webservice, envioRetorno, html, imprimeEtiqueta });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async enviarAtendimento(req, res) {
        const { posto, id, prontuario_id } = req.body;
        // const { Posto } = Database.getModels(req.database);

        // const etq_ws = await Posto.findOne({
        //     where: { id: posto },
        // })
        //     .then(response => {
        //         return response.etq_ws;
        //     })
        //     .catch(err => {
        //         return err.message;
        //     });

        // if (etq_ws === '0') {
        //     res.status(200).json('Não envia automático');
        // }

        const retorno = await EnvioWs(
            req,
            { posto, id, prontuario_id },
            false,
            true
        );

        res.status(200).json(retorno);
    }
}

export default new ApoioEnvController();
