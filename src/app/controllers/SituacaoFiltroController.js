import { QueryTypes } from 'sequelize';
import * as Yup from 'yup';
import _ from 'lodash';
import Database from '../../database';
import { format, parseISO } from 'date-fns';
import { gerarRelatorioHtml } from './functions/functions';

class SituacaoFiltroController {
    async index(req, res) {
        try {
            const { SituacaoFiltro, Motina } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Matriz"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Matriz"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += SituacaoFiltroController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = SituacaoFiltroController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const Situacaos = await SituacaoFiltro.findAll({
                order: SituacaoFiltro.sequelize.literal(
                    `${order} ${orderdesc}`
                ),
                where: SituacaoFiltro.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'comando',
                    'tipo_filtro',
                    'idopera_ultacao',
                    [
                        SituacaoFiltro.sequelize.literal('count(*) OVER ()'),
                        'total',
                    ],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const Situacaos_trim = Situacaos.map(Situacao => {
                    Situacao.descricao = Situacao.descricao.trim();
                    Situacao.motina.descricao = Situacao.motina.descricao.trim();
                    return Situacao;
                });
                return res.status(200).json(Situacaos_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { SituacaoFiltro, Motina } = Database.getModels(req.database);
            const Situacaos = await SituacaoFiltro.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'comando',
                    'tipo_filtro',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!Situacaos) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                Situacaos.descricao = Situacaos.descricao
                    ? Situacaos.descricao.trim()
                    : '';
                Situacaos.motina.descricao = Situacaos.motina.descricao
                    ? Situacaos.motina.descricao.trim()
                    : '';

                return res.status(200).json(Situacaos);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { SituacaoFiltro } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                comando: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const {
                id,
                descricao,
                status,
                comando,
                tipo_filtro,
            } = await SituacaoFiltro.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                comando,
                tipo_filtro,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { SituacaoFiltro } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                comando: Yup.string(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            await SituacaoFiltro.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        comando: data[1].comando,
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { SituacaoFiltro } = Database.getModels(req.database);
            await SituacaoFiltro.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res
                            .status(200)
                            .json({ message: 'Deletado com sucesso.' });
                    }
                    return res
                        .status(400)
                        .json({ error: 'Nenhum registro encontrado' });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexExames(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            const {
                dataini,
                datafim,
                filtro,
                ordem,
                posto,
                amostra,
                postos,
                setores,
                convenios,
                exames,
                medicos,
                medicosrea,
                status,
                envios,
                entregas,
                apoios,
                operadores,
                prontuario,
                guia,
                nautorizacao,
                nmalote,
                nlotefat,
                ntubo,
                urgente,
                naofatura,
                impressopaciente,
                impressograde,
                statusresultado,
                faturado,
                coletar,
                receber,
                emmalote,
                urgenteprioritaria,
                modelo,
                limit = 10,
                page = 1,
            } = req.query;

            const datainicial = new Date(dataini);
            const dia =
                datainicial.getDate() >= 10
                    ? datainicial.getDate()
                    : `0${datainicial.getDate()}`;
            const mes =
                datainicial.getMonth() + 1 >= 10
                    ? datainicial.getMonth() + 1
                    : `0${datainicial.getMonth() + 1}`;
            const ano = datainicial.getFullYear();

            const datafinal = new Date(datafim);
            const diaf =
                datafinal.getDate() >= 10
                    ? datafinal.getDate()
                    : `0${datafinal.getDate()}`;
            const mesf =
                datafinal.getMonth() + 1 >= 10
                    ? datafinal.getMonth() + 1
                    : `0${datafinal.getMonth() + 1}`;
            const anof = datafinal.getFullYear();

            const dataf = `'${dia}/${mes}/${ano}' and '${diaf}/${mesf}/${anof}'`;

            let select = '';
            let selectorder = '';

            const selectcolunas = `
                SELECT
                varchar '' AS total,
                MOVEXA.POSTO,
                MOVEXA.AMOSTRA,
                MOVEXA.STATUSEXM,
                MOVEXA.NAOFATURA,
                MOVEXA.STATUSRESULTADO,
                --MOVEXA.RESULTADO,
                MOVEXA.REQUISICAO,
                MOVEXA.EXAME_ID,
                MOVEXA.URGENTEEXM,
                MOVEXA.DTCOLETA,
                MOVEXA.HRCOLETA,
                MOVEXA.CONVENIO_ID,
                MOVEXA.VALBRUTO,
                MOVEXA.AMB,
                MOVEXA.VALCONV,
                MOVEXA.VALPAC,
                MOVEXA.MATPAC,
                MOVEXA.MATCONV,
                MOVEXA.MATRICULA,
                MOVEXA.VALFILMEC,
                MOVEXA.VALFILMEP,
                MOVEXA.MEDCONV,
                MOVEXA.MEDPAC,
                MOVEXA.TAXACONV,
                MOVEXA.TAXAPAC,
                MOVEXA.TOTDESCPAC,
                MOVEXA.VALCOPARTIC,
                MOVEXA.TUBO,
                MOVEXA.DATA_LANRES,
                MOVEXA.HORA_LANRES,
                MOVEXA.DATALIB,
                MOVEXA.HORALIB,
                MOVEXA.MOVPAC_ID,
                MOVEXA.MEDICO_ID,
                MOVEXA.IMPPACI,
                MOVEXA.AUTORIZA,
                MOVEXA.CONFFAT,
                MOVEXA.LOTEFAT_STATUS,
                MOVEXA.LOTEFAT_ID,
                MOVEXA.MALOTE_ID,
                MOVEXA.OPERADOR_ID,
                MOVEXA.ID AS IDMOVEXA,
                MOVEXA.DTENTREGA AS DTENTREGAEXA,
                COALESCE(MOVEXA.QTDEXAME,1) AS QTDEXAME,
                TEXT '' AS STATUSEXM_DESCRICAO,
                TEXT '' AS STATUSEXM_COR,
                TEXT '' AS STATUSRESULTADO_DESCRICAO,
                --descstatus(MOVEXA.STATUSEXM) AS STATUSEXM_DESCRICAO,
                --desccorstatus(MOVEXA.STATUSEXM) AS STATUSEXM_COR,
                --descresul(MOVEXA.STATUSRESULTADO) AS STATUSRESULTADO_DESCRICAO,
                MOVPAC.DATAENTRA,
                MOVPAC.DTENTREGA,
                MOVPAC.HORAENTRA,
                MOVPAC.PRONTUARIO_ID,
                MOVPAC.ID AS IDMOVPAC,
                MOVPAC.ENVIO_ID,
                MOVPAC.ENTREGA_ID,
                MOVPAC.HRENTREGA,
                MOVPAC.CODIGOCTRL,
                MOVPAC.OBS,
                MOVPAC.QUARTO,
                MOVPAC.IDADE,
                EXAME.CODIGO,
                EXAME.SETOR_ID,
                EXAME.CODIGO,
                EXAME.DESCRICAO,
                CONVENIO.FANTASIA,
                SETOR.DESCRICAO AS DESCSETOR,
                ENVIO.CODIGO AS CODENVIO,
                ENVIO.DESCRICAO AS DESCENVIO,
                ENTREGA.CODIGO AS CODENTREGA,
                ENTREGA.DESCRICAO AS DESCENTREGA,
                OPERADOR.NOME AS NOMEOPE,
                OPERADOR.NOMECOMP AS NOMECOMPOPE,
                POSTO.ID AS POSID,
                POSTO.DESCRICAO AS DESCPOS,
                PRONTUARIO.NOME,
                PRONTUARIO.SEXO,
                PRONTUARIO.PRONTUARIO,
                PRONTUARIO.POSTO AS POSTO_PRONTU,
                MEDICO.CRM,
                MEDICO.NOME_MED,
                CAST('' AS VARCHAR(2000)) AS EXAMES,
                CAST('' AS VARCHAR(2000)) AS LEGENDA,
                MATERIAL.DESCRICAO as desc_material
            `;

            const selectleft = ` FROM MOVEXA
                INNER JOIN MOVPAC    ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                LEFT JOIN CONVENIO   ON CONVENIO.ID = MOVEXA.CONVENIO_ID
                LEFT JOIN EXAME      ON EXAME.ID = MOVEXA.EXAME_ID
                LEFT JOIN MATERIAL   ON MATERIAL.ID = EXAME.MATERIAL_ID
                LEFT JOIN POSTO      ON POSTO.CODIGO = MOVEXA.POSTO
                LEFT JOIN SETOR      ON SETOR.ID = EXAME.SETOR_ID
                LEFT JOIN ENVIO      ON ENVIO.ID = MOVPAC.ENVIO_ID
                LEFT JOIN ENTREGA    ON ENTREGA.ID = MOVPAC.ENTREGA_ID
                LEFT JOIN OPERADOR   ON OPERADOR.ID = MOVEXA.OPERADOR_ID
                LEFT JOIN MEDICO     ON MEDICO.ID = MOVEXA.MEDICO_ID
            `;

            if (posto === '' && amostra === '') {
                switch (filtro) {
                    case '2':
                        select += ` WHERE MOVPAC.DTENTREGA BETWEEN ${dataf} `;
                        break;
                    case '3':
                        select += ` WHERE MOVEXA.DTCOLETA BETWEEN ${dataf} `;
                        break;
                    case '4':
                        select += ` WHERE MOVEXA.DTENTREGA BETWEEN ${dataf} `;
                        break;
                    case '5':
                        select += ` WHERE MOVEXA.DTFATURA BETWEEN ${dataf} `;
                        break;
                    default:
                        select += ` WHERE MOVPAC.DATAENTRA BETWEEN ${dataf} `;
                        break;
                }

                // Inputs
                if (guia !== undefined && guia !== '') {
                    select += ` AND MOVEXA.REQUISICAO = '${guia}'`;
                }

                if (nautorizacao !== undefined && nautorizacao !== '') {
                    select += ` AND MOVEXA.AUTORIZA = '${nautorizacao}' `;
                }

                if (nmalote !== undefined && nmalote !== '') {
                    select += ` AND MOVEXA.MALOTE_ID = '${nmalote}' `;
                }

                if (nlotefat !== undefined && nlotefat !== '') {
                    select += ` AND MOVEXA.LOTEFAT_ID = '${nlotefat}' `;
                }

                if (ntubo !== undefined && ntubo !== '') {
                    select += ` AND MOVEXA.TUBO = '${ntubo}' `;
                }

                // AsyncSelectMulti
                if (postos !== undefined && postos !== '') {
                    select += ` AND MOVEXA.POSTO IN (${postos}) `;
                }

                if (setores !== undefined && setores !== '') {
                    select += ` AND EXAME.SETOR_ID IN (${setores}) `;
                }

                if (convenios !== undefined && convenios !== '') {
                    select += ` AND MOVEXA.CONVENIO_ID IN (${convenios}) `;
                }

                if (exames !== undefined && exames !== '') {
                    select += ` AND MOVEXA.EXAME_ID IN (${exames}) `;
                }

                if (medicos !== undefined && medicos !== '') {
                    select += ` AND MOVEXA.MEDICO_ID IN (${medicos}) `;
                }

                if (medicosrea !== undefined && medicosrea !== '') {
                    select += ` AND MOVEXA.MEDICOREA_ID IN (${medicosrea}) `;
                }

                if (envios !== undefined && envios !== '') {
                    select += ` AND MOVPAC.ENVIO_ID IN (${envios}) `;
                }

                if (entregas !== undefined && entregas !== '') {
                    select += ` AND MOVPAC.ENTREGA_ID IN  (${entregas}) `;
                }

                if (apoios !== undefined && apoios !== '') {
                    select += ` AND MOVEXA.APOIO_ID IN (${apoios}) `;
                }

                if (operadores !== undefined && operadores !== '') {
                    select += ` AND MOVEXA.OPERADOR_ID IN (${operadores}) `;
                }

                if (prontuario !== undefined && prontuario !== '') {
                    select += ` AND MOVPAC.PRONTUARIO_ID = ${prontuario} `;
                }

                if (status !== undefined && status !== '') {
                    select += ` AND MOVEXA.STATUSEXM IN (${status}) `;
                }

                // Combobox
                switch (urgente) {
                    case 'sim':
                        select += ' AND MOVEXA.URGENTEEXM = 1';
                        break;
                    case 'nao':
                        select += ' AND MOVEXA.URGENTEEXM = 0';
                        break;
                    default:
                        break;
                }

                switch (naofatura) {
                    case 'sim':
                        select += ' AND MOVEXA.NAOFATURA = 1';
                        break;
                    case 'nao':
                        select += ' AND MOVEXA.NAOFATURA = 0';
                        break;
                    default:
                        break;
                }

                switch (impressopaciente) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.IMPPACI,0) = 1';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.IMPPACI,0) = 0';
                        break;
                    default:
                        break;
                }

                switch (impressograde) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.IMPGRA,0) = 1';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.IMPGRA,0) = 0';
                        break;
                    default:
                        break;
                }

                switch (statusresultado) {
                    case 'normal':
                        select +=
                            " AND COALESCE(MOVEXA.STATUSRESULTADO,'') = 'NO' ";
                        break;
                    case 'alterado':
                        select +=
                            " AND COALESCE(MOVEXA.STATUSRESULTADO,'') = 'AL' ";
                        break;
                    case 'naochecado':
                        select +=
                            " AND (COALESCE(MOVEXA.STATUSRESULTADO,'') = 'NC' OR TRIM(COALESCE(MOVEXA.STATUSRESULTADO,'')) = '')";
                        break;
                    default:
                        break;
                }

                switch (faturado) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.CONFFAT,0) = 1';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.CONFFAT,0) = 0';
                        break;
                    default:
                        break;
                }

                switch (coletar) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.COLETAR,0) = 1';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.COLETAR,0) = 0';
                        break;
                    default:
                        break;
                }

                switch (receber) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.ENTREGUE,0) = 1';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.ENTREGUE,0) = 0';
                        break;
                    default:
                        break;
                }

                switch (emmalote) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.MALOTE_ID,0) > 0 ';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.MALOTE_ID,0) = 0 ';
                        break;
                    default:
                        break;
                }

                switch (urgenteprioritaria) {
                    case 'sim':
                        select += ' AND COALESCE(MOVEXA.URG_PRIO_EXA,0) > 0 ';
                        break;
                    case 'nao':
                        select += ' AND COALESCE(MOVEXA.URG_PRIO_EXA,0) = 0 ';
                        break;
                    default:
                        break;
                }

                switch (ordem) {
                    case '2':
                        selectorder += ' ORDER BY MOVPAC.DATAENTRA ';
                        break;
                    case '3':
                        selectorder += ' ORDER BY MOVEXA.DTENTREGA ';
                        break;
                    case '4':
                        selectorder +=
                            ' ORDER BY CONVENIO.FANTASIA, MOVEXA.POSTO, MOVEXA.AMOSTRA ';
                        break;
                    case '5':
                        selectorder +=
                            ' ORDER BY PRONTUARIO.NOME, MOVEXA.POSTO, MOVEXA.AMOSTRA ';
                        break;
                    case '6':
                        selectorder +=
                            ' ORDER BY PRONTUARIO.POSTO, PRONTUARIO.PRONTUARIO, MOVEXA.POSTO,  MOVEXA.AMOSTRA ';
                        break;
                    case '7':
                        selectorder += ' ORDER BY MOVEXA.DTCOLETA ';
                        break;
                    default:
                        selectorder +=
                            ' ORDER BY MOVEXA.POSTO, MOVEXA.AMOSTRA ';
                        break;
                }
            } else {
                select += ` WHERE MOVEXA.POSTO = '${posto}' AND MOVEXA.AMOSTRA = '${amostra}' `;
            }

            const selectgeral = `${selectcolunas +
                selectleft +
                select +
                selectorder} LIMIT ${limit}
                OFFSET ${(page - 1) * limit} `;

            let movimentacoes = await Movexa.sequelize
                .query(selectgeral, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            let total_count = 0;
            if (parseInt(req.query.totalpage) === 0) {
                total_count = await Movexa.sequelize.query(
                    `SELECT count(*) AS "count" ${selectleft} ${select} LIMIT '1'`
                );
            }

            if (movimentacoes.length > 0) {
                movimentacoes.map(movimentacao => {
                    const props = Object.keys(movimentacao);
                    props.map(prop => {
                        if (typeof movimentacao[prop] === 'string') {
                            movimentacao[prop] = movimentacao[prop].trim();
                        }
                    });
                });
            }

            if (movimentacoes.length > 0) {
                movimentacoes[0].total =
                    total_count !== 0
                        ? total_count[0][0].count
                        : req.query.totalpage;
            }

            movimentacoes = movimentacoes.map(item => {
                item.postoamostra = `${item.posto}${item.amostra}`;
                item.dataentra = format(parseISO(item.dataentra), 'dd/MM/yyyy');
                item.dtcoleta = item.dtcoleta && format(parseISO(item.dtcoleta), 'dd/MM/yyyy');
                item.dtentrega = item.dtentrega && format(parseISO(item.dtentrega), 'dd/MM/yyyy');
                switch(item.statusexm){
                    case "FM":
                    item.legenda = `${item.codigo}+`;
                        break;
                    case "TR":
                        item.legenda = `${item.codigo}#`;
                        break;
                    case "LA":
                        item.legenda = `${item.codigo}*`;
                        break;
                    case "IM":
                        item.legenda = `${item.codigo}-`;
                        break;
                    case "EN":
                        item.legenda = `${item.codigo}\\`;
                        break;
                    default:
                        item.legenda = item.codigo;
                        break;
                }
                return item;
            })

            if(modelo) {
                const statusExame = JSON.parse(req.query.statusExame);
                let dataReport = JSON.parse(req.query.dataReport);
                dataReport.startDate = `${ano}-${mes}-${dia}`;
                dataReport.endDate = `${anof}-${mesf}-${diaf}`;
                dataReport.model = `relsituacaoexames${modelo}`;

                const dataGrouped = [];

                switch(modelo){
                    case '1':
                        let groupBy = _.groupBy(movimentacoes,'postoamostra');
                        _.forEach(groupBy, (exms) => {
                            let exames = '';
                            const exmLength = exms.length;

                            for (let index = 0; index < exmLength; index++) {
                                const element = exms[index];
                                if((index + 1) === (exmLength)){
                                    exames += `${element.legenda}`
                                } else {
                                    exames += `${element.legenda}, `
                                }
                            }

                            dataGrouped.push({
                                dataentra: exms[0].dataentra,
                                posto: exms[0].posto,
                                amostra: exms[0].amostra,
                                nome: exms[0].nome,
                                exames
                            });
                        });
                        dataReport.data = dataGrouped;
                        break;
                    case '2':
                        movimentacoes.map(item => {
                            const getStatusExm = statusExame.find(x => x.value === item.statusexm);
                            item.statusexm = getStatusExm ? getStatusExm.label : '';
                            let itemGrouped = false;
                            dataGrouped.map((item2, index2) => {
                            if (item.posto === item2.posto && item.amostra === item2.amostra) {
                                itemGrouped = dataGrouped[index2];
                            }
                            return item2;
                            });
                            if (itemGrouped) {
                            const obj = {
                                codigo: item.codigo,
                                descricao: item.descricao,
                                fantasia: item.fantasia,
                                dtcoleta: item.dtcoleta,
                                dtentrega: item.dtentrega,
                                statusexm: item.statusexm,
                                posto_prontu: item.posto_prontu,
                                prontuario: item.prontuario,
                                data_lanres: item.data_lanres,
                                hora_lanres: item.hora_lanres,
                                datalib: item.datalib,
                                horalib: item.horalib,
                            };
                            if (itemGrouped.exames) {
                                itemGrouped.exames.push(obj);
                            } else {
                                itemGrouped.exames = [obj];
                            }
                            } else {
                            dataGrouped.push({
                                ...item,
                                exames: [
                                {
                                    codigo: item.codigo,
                                    descricao: item.descricao,
                                    fantasia: item.fantasia,
                                    dtcoleta: item.dtcoleta,
                                    dtentrega: item.dtentrega,
                                    statusexm: item.statusexm,
                                    posto_prontu: item.posto_prontu,
                                    prontuario: item.prontuario,
                                    data_lanres: item.data_lanres,
                                    hora_lanres: item.hora_lanres,
                                    datalib: item.datalib,
                                    horalib: item.horalib,
                                },
                                ],
                            });
                            }
                            return item;
                        });
                        dataReport.data = dataGrouped;
                        break;
                    default:
                        dataReport.data = movimentacoes
                        break;
                }

                const html = await gerarRelatorioHtml(dataReport);

                return res.status(200).json(html);
            } else {
                return res.status(200).json(movimentacoes);
            }

        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("SituacaoFiltro"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("SituacaoFiltro"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("SituacaoFiltro"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new SituacaoFiltroController();
