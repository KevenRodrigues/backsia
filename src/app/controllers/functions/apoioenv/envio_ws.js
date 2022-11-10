// import * as _ from 'lodash';
import { Sequelize, QueryTypes } from 'sequelize';
import _ from 'lodash';
import Database from '../../../../database';
import { rastreaWS } from '../functions';
import { EnvioAlvaroWs, EnvioPardiniWs, EnvioDbWs, EnvioMaricondiWs } from '.';

const envio_ws = async (req, crmovpacm, leituradetubo, atendimento) => {
    const sequelize = Database.instances[req.database];
    const { Operador } = Database.getModels(req.database);
    const { id, prontuario_id } = crmovpacm;

    // Faz validação dos parametros
    const campo = 'etq_fu';
    const getParam = await Operador.sequelize
        .query(`select ${campo} from param, param2`, {
            type: Sequelize.QueryTypes.SELECT,
        })
        .catch(err => {
            throw new Error({ error: err.message });
        });
    const { etq_fu } = getParam[0];

    let instrucaosql = `
        SELECT movpac.posto,
        movpac.amostra,
        prontuario.nome,
        apoio.razao,
        exame.codigo,
        exame.descricao,
        movexa.statusexm,
        movexa.dtcoleta,
        movexa.dtentrega,
        0 AS marca,
        movexa.leuc,
        movexa.linf,
        movexa.obsapo,
        movexa.volume,
        movexa.peso,
        movexa.idadegest,
        movexa.altura,
        movpac.obs,
        movexa.tpdiurese,
        movexa.hrcoleta,
        prontuario.sexo,
        movpac.id AS idmovpac,
        movexa.id AS idmovexa,
        prontuario.data_nasc,
        apoio.codlab,
        apoioexm.codlab AS codlabexm,
        apoioexm.conservante,
        apoioexm.materiala,
        apoioexm.materialdi,
        apoio.arqrotina,
        apoio.arqrotinaweb,
        apoio.pathapo,
        movexa.exame_id,
        movexa.id,
        movexa.labapoio,
        movpac.horaentra,
        movexa.material_id,
        material.descricao AS descmat,
        movexa.dtapoio,
        movexa.apoio_id,
        apoio.id AS id_apoio,
        movexa.movpac_id,
        exame.recipcol_id,
        exame.reciptri_id,
        apoioexm.descamo,
        apoio.senhalab,
        apoioexm.obrigavol,
        apoioexm.obrigapeso,
        apoioexm.obrigaidade,
        apoioexm.obrigaalt,
        apoioexm.obrigaleuco,
        apoioexm.obrigalinfo,
        movexa.apoioresu,
        movpac.pos_apoiado,
        movpac.id_pac_lab,
        movpac.codigoctrl,
        movexa.datalib,
        operador.nomecomp,
        material.deparamat,
        movexa.resultado,
        convenio.caminho_arqapoiado,
        movexa.layout_id,
        movexa.convenio_id,
        movpac.dataentra,
        movpac.idade,
        movexa.medico_id,
        medico.crm,
        medico.nome_med,
        medico.ufcrm,
        exame.depara AS de_para,
        exame.enviawww AS enviawwwexa,
        apoioexm.tempodiurese,
        apoioexm.horadecoleta,
        movexa.urgenteexm,
        movpac.medicament,
        movpac.dum,
        movexa.amo_apoiado,
        convenio.codigo AS codconv,
        materialb2b,
        codexmlabb2b,
        datacoletab2b,
        horacoletab2b,
        codexmapoiob2b,
        metodo.descricao AS descmetodo,
        prontuario.posto AS posprontu,
        prontuario.prontuario,
        apoio.ws_lote,
        movpac.prontuario_id,
        loteapoiob2b,
        apoio.ws_endweb,
        movexa.cadeiab2b,
        prontuario.rg,
        prontuario.cpf,
        movexa.codpedapoio,
        apoio.ws_senha,
        apoio.ws_idagente,
        apoio.ws_versao,
        apoio.amostra_envio,
        apoio.amostra_retorno,
        apoio.layout_ws,
        movexa.retorno_ws,
        movexa.etiqueta_ws,
        movpac.altura_atend,
        movexa.etiquetaws_id,
        etiquetaws.etiqueta,
        etiquetaws.etiqueta2,
        etiquetaws.etiqueta3,
        etiquetaws.etiqueta4,
        etiquetaws.etiqueta5,
        etiquetaws.etiqueta6,
        apoiopos.codlab AS codlabpos,
        apoiopos.senhalab AS senhalabpos,
        movpac.sintoma,
        movpac.iniciosintomas,
        movpac.municipio,
        apoioexm.teste_covid,
        exame.envio_rnds,
        exame.exm_covid19,
        apoio.url_envio_rnds,
        apoio.envio_res_rnds,
        apoio.idlabrnds,
        movexa.data_lanres,
        movexa.hora_lanres,
        prontuario.cns,
        movexa.id_rnds,
        movexa.apoiores,
        movexa.apoiocres,
        '' AS TIPO,
        '' AS CODERRO,
        '' AS RETWS,
        apoioexm.obgloccol,
        movexa.local_coleta
    FROM movexa
    LEFT JOIN movpac
           ON movpac.id = movexa.movpac_id
    LEFT JOIN prontuario
           ON prontuario.id = movpac.prontuario_id
    LEFT JOIN exame
           ON exame.id = movexa.exame_id
    LEFT JOIN apoio
           ON apoio.id = exame.apoio_id
    LEFT JOIN apoioexm
           ON apoioexm.exame_id = exame.id
              AND apoioexm.apoio_id = apoio.id
    LEFT JOIN material
           ON material.id = movexa.material_id
    LEFT JOIN convenio
           ON convenio.id = movexa.convenio_id
    LEFT JOIN operador
           ON operador.id = movexa.assina_ope
    LEFT JOIN medico
           ON medico.id = movexa.medico_id
    LEFT JOIN metodo
           ON metodo.id = exame.metodo_id
    LEFT JOIN etiquetaws
           ON etiquetaws.id = movexa.etiquetaws_id
    LEFT JOIN apoiopos
           ON apoiopos.posto = movpac.posto
              AND apoiopos.apoio_id = apoio.id
    `;

    instrucaosql += ' WHERE APOIO.LAYOUT_WS IN(2,3,4,5)';

    if (etq_fu === '1') {
        instrucaosql +=
            " AND MOVEXA.STATUSEXM NOT IN('AP') AND ((COALESCE(MOVEXA.COLETAR,0) + COALESCE(MOVEXA.ENTREGUE,0)) > 0) ";
    } else {
        instrucaosql += " AND MOVEXA.STATUSEXM NOT IN('AP','FU') ";
    }
    instrucaosql += ' AND COALESCE(MOVEXA.LABAPOIO,0) = 0 ';
    instrucaosql += ' AND COALESCE(APOIOEXM.STATUS,0) = 0 ';
    instrucaosql += ` AND MOVEXA.MOVPAC_ID = ${id}`;

    let caarqapoio = await sequelize
        .query(instrucaosql, {
            type: QueryTypes.SELECT,
        })
        .catch(sequelize, err => {
            return err.message;
        });

    if (caarqapoio.length === 0) {
        return [];
    }

    caarqapoio = caarqapoio.map(item => {
        item.postoamostra = `${item.posto}${item.amostra}`;
        return item;
    });

    caarqapoio = _.groupBy(caarqapoio, 'layout_ws');

    await rastreaWS(
        req,
        'Inicio de checagem de envio de exames para ws',
        prontuario_id,
        id
    );

    const newCaarqapoio = [];

    _.forEach(caarqapoio, async (exames, apoio) => {
        newCaarqapoio.push({
            apoio,
            exames,
        });
    });

    caarqapoio = newCaarqapoio;

    const curerrapoio = [];
    const retornoWS = [];
    const retornoTubo = [];
    const imprimeEtiqueta = [];

    for (const item of caarqapoio) {
        const { apoio, exames } = item;
        const enviar = [];
        const naoenviar = [];

        for (const exame of exames) {
            let descapoio = '';
            switch (apoio) {
                case '2':
                    descapoio = 'pardini';
                    break;
                case '3':
                    descapoio = 'alvaro';
                    break;
                case '4':
                    descapoio = 'db';
                    break;
                case '5':
                    descapoio = 'maricondi';
                    break;
                default:
                    descapoio = '';
                    break;
            }

            await rastreaWS(
                req,
                `Preparando exame para envio via WS Codigo: ALLTRIM(CAST(CURARQAPOIO.CODIGO as M)) Apoio: ${descapoio}`,
                prontuario_id,
                id,
                exame.idmovexa,
                apoio,
                0
            );

            if (
                exame.obrigaleuco === '1' &&
                !exame.leuc &&
                !exame.leuc.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: LEUCÓCITOS',
                });
            } else if (
                exame.obrigalinfo === '1' &&
                !exame.linf &&
                !exame.linf.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: LINFÓCITOS',
                });
            } else if (
                exame.obrigavol === '1' &&
                !exame.volume &&
                !exame.volume.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: VOLUME',
                });
            } else if (
                exame.obrigaidade === '1' &&
                !exame.idadegest &&
                !exame.idadegest.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: IDADE GESTACIONAL',
                });
            } else if (
                exame.obrigapeso === '1' &&
                !exame.peso &&
                !exame.peso.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: PESO',
                });
            } else if (
                exame.obrigaalt === '1' &&
                !exame.altura &&
                !exame.altura.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: ALTURA',
                });
            } else if (
                exame.horadecoleta === '1' &&
                !exame.hrcoleta &&
                !exame.hrcoleta.replace(':', '').trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: HORA DE COLETA',
                });
            } else if (
                exame.tempodiurese === '1' &&
                !exame.tpdiurese &&
                !exame.tpdiurese.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: TEMPO DE DIURESE',
                });
            } else if (
                exame.obgloccol === '1' &&
                !exame.local_coleta &&
                !exame.local_coleta.trim()
            ) {
                naoenviar.push({
                    id: exame.idmovexa,
                    posto: exame.posto,
                    amostra: exame.amostra,
                    razao: exame.razao.trim(),
                    codigo: exame.codigo,
                    motivo: 'EXAME COM OBRIGATORIEDADE: LOCAL DA COLETA',
                });
            } else {
                enviar.push(exame);
            }
        }

        let envioRetorno = {};

        if (enviar.length > 0) {
            switch (enviar[0].layout_ws) {
                case '2':
                    envioRetorno = await EnvioPardiniWs(
                        req,
                        atendimento,
                        leituradetubo,
                        enviar
                    );
                    break;
                case '3':
                    envioRetorno = await EnvioAlvaroWs(
                        req,
                        atendimento,
                        leituradetubo,
                        enviar
                    );
                    break;
                case '4':
                    envioRetorno = await EnvioDbWs(
                        req,
                        atendimento,
                        leituradetubo,
                        enviar
                    );
                    break;
                case '5':
                    envioRetorno = await EnvioMaricondiWs(
                        req,
                        false,
                        leituradetubo,
                        enviar
                    );
                    break;
                default:
                    break;
            }
        }

        if (
            envioRetorno &&
            envioRetorno.retornoWS &&
            envioRetorno.retornoWS.length > 0
        ) {
            retornoWS.push([...envioRetorno.retornoWS]);
        }
        if (
            envioRetorno &&
            envioRetorno.retornoTubo &&
            envioRetorno.retornoTubo.length > 0
        ) {
            retornoTubo.push([...envioRetorno.retornoTubo]);
        }
        if (
            envioRetorno &&
            envioRetorno.imprimeEtiqueta &&
            envioRetorno.imprimeEtiqueta.length > 0
        ) {
            imprimeEtiqueta.push([...envioRetorno.imprimeEtiqueta]);
        }
        if (naoenviar.length > 0) {
            curerrapoio.push(...naoenviar);
        }
    }
    return { curerrapoio, retornoWS, retornoTubo, imprimeEtiqueta };
};

export default envio_ws;
