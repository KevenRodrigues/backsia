// import * as Yup from 'yup';
import { Sequelize, QueryTypes, Op } from 'sequelize';
import * as Yup from 'yup';
import * as _ from 'lodash';
import { format, parseISO } from 'date-fns';
import {
    PegaData,
    PegaHora,
    convertDate,
    fimCaixa,
    fimCaixaPosto,
    gerarRelatorioHtml,
    calculaDiasMovpacPorParametro,
} from './functions/functions';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class CaixaController {
    async index(req, res) {
        try {
            const { Caixa, Operador } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Caixa"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Caixa"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                switch (filter) {
                    case 'caixa':
                        where = ` CAST("Caixa"."id" AS TEXT) LIKE '%${filtervalue.toUpperCase()}%'`;
                        break;
                    case 'operador.nome':
                        where = ` CAST("operador"."nome" AS TEXT) LIKE '%${filtervalue.toUpperCase()}%'`;
                        break;
                    case 'datcai':
                        where = ` "Caixa"."datcai" between '${filtervalue}'`;
                        break;
                    default:
                        filter !== ''
                            ? (where = ` (Unaccent(upper(trim(coalesce("Caixa"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`)
                            : null;
                }
            }

            const { caixaperm } = req.query;
            const parametros = JSON.parse(req.query.parametros);

            if (caixaperm.trim()) {
                if (filter && search) {
                    where += 'AND';
                }
                where += ` "Caixa"."operador_id" IN (${
                    req.userId
                },${caixaperm.trim()})`;
            } else if (parametros.acessa_propriocaixa === '1') {
                if (filter && search) {
                    where += 'AND';
                }
                where += ` "Caixa"."operador_id" IN (${req.userId})`;
            }

            const caixas = await Caixa.findAll({
                attributes: [
                    'id',
                    ['id', 'caixa'],
                    'operador_id',
                    'datcai',
                    'dt_abertura',
                    'valini',
                    'valfin',
                    'sitcai',
                    [Caixa.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                order: Caixa.sequelize.literal(`${order} ${orderdesc}`),
                where: Caixa.sequelize.literal(where),
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Operador, as: 'operador', attributes: ['nome'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json(caixas);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        const {
            Movcai,
            Movpac,
            Movexa,
            Exame,
            Prontuario,
            Caixa,
            Caixa1,
            Operador,
            Tablogcai,
        } = Database.getModels(req.database);

        const date = await calculaDiasMovpacPorParametro(req);

        const cur_caixa1 = await Caixa.findOne({
            where: { id: req.params.id },
            include: [
                { model: Operador, as: 'operador' },
                { model: Caixa1, as: 'caixa1' },
            ],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        const curpaciente = await Movpac.findAll({
            attributes: [
                'posto',
                'amostra',
                'id',
                'dataentra',
                'totpag',
                'descval',
                'acresval',
                'descperc',
                'acresperc',
                'totalpaci',
                'totrec',
                'diferenca',
            ],
            where: {
                '$movcai.caixa_id$': cur_caixa1.id,
                '$movcai.tippag$': { [Op.not]: 4 },
                '$movexa.fatura$': 0,
                '$Movpac.dataentra$': { [Op.gte]: date } ,
            },
            order: [
                ['posto', 'ASC'],
                ['amostra', 'ASC'],
            ],
            include: [
                {
                    model: Movcai,
                    as: 'movcai',
                    include: [
                        {
                            model: Caixa,
                            as: 'caixa',
                        },
                        {
                            model: Operador,
                            as: 'operador',
                            attributes: ['nome'],
                        },
                    ],
                },
                {
                    model: Prontuario,
                    as: 'prontuario',
                },
                {
                    model: Movexa,
                    as: 'movexa',
                    attributes: ['id'],
                    include: [
                        { model: Exame, as: 'exame', attributes: ['codigo'] },
                    ],
                },
            ],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        const fimcai_new = [
            {
                datcai: cur_caixa1.datcai,
                dt_abertura: cur_caixa1.dt_abertura,
                dt_fechamento: cur_caixa1.dt_fechamento,
                hr_abertura: cur_caixa1.hr_abertura,
                hr_fechamento: cur_caixa1.hr_fechamento,
                id: cur_caixa1.id,
                marca: true,
                mostra: true,
                nome: cur_caixa1.operador.nome.trim(),
                operador_id: cur_caixa1.operador_id,
                sitcai: cur_caixa1.sitcai,
                valini: cur_caixa1.valini,
            },
        ];

        let fimcai = await fimCaixa(
            req,
            cur_caixa1.datcai,
            cur_caixa1.datcai,
            false,
            cur_caixa1,
            fimcai_new,
            0
        );

        fimcai = fimcai.find(x => x.caixa_id === cur_caixa1.id);

        const curfompag = await Movcai.findAll({
            where: { caixa_id: cur_caixa1.id },
            group: ['tippag'],
            raw: true,
            attributes: [
                'tippag',
                [Sequelize.fn('SUM', Sequelize.col('valpag')), 'valpag'],
            ],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        const totvalpag = parseFloat(
            curfompag.reduce((prevValue, obj) => {
                return prevValue + parseFloat(obj.valpag);
            }, 0)
        ).toFixed(2);

        const relcheques = await Movpac.findAll({
            attributes: ['posto', 'amostra', 'id'],
            where: {
                '$movcai.caixa_id$': cur_caixa1.id,
                '$movcai.tippag$': { [Op.or]: [2, 6] },
            },
            order: [
                ['posto', 'ASC'],
                ['amostra', 'ASC'],
            ],
            include: [
                {
                    model: Movcai,
                    as: 'movcai',
                    include: [
                        {
                            model: Caixa,
                            as: 'caixa',
                        },
                        {
                            model: Operador,
                            as: 'operador',
                            attributes: ['nome'],
                        },
                    ],
                },
                {
                    model: Prontuario,
                    as: 'prontuario',
                },
            ],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        const ocorrencias = await Tablogcai.findAll({
            where: { caixa_id: cur_caixa1.id },
            include: [
                {
                    model: Operador,
                    as: 'operador',
                },
            ],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        // console.log(curpaciente);
        // console.log(curfompag);
        // console.log(totvalpag);

        return res.status(200).json({
            cur_caixa1,
            curpaciente,
            fimcai,
            totvalpag,
            relcheques,
            ocorrencias,
        });
    }

    async createUpdate(req, res) {
        try {
            const { Operador, Caixa, Caixa1 } = Database.getModels(
                req.database
            );
            const schema = Yup.object().shape({});
            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            // Faz validação dos parametros
            const campo = 'dt_banco';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: Sequelize.QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const { dt_banco } = getParam[0];
            const data = await PegaData(req, dt_banco);
            const hora = await PegaHora(req, dt_banco);

            let { caixa1 } = req.body;

            const caixa = {
                id: req.body.id === '' ? null : req.body.id,
                operador_id: req.userId,
                datcai: convertDate(data),
                valini: req.body.valini,
                valfin: '0.00',
                sitcai: 'A',
                dt_abertura: convertDate(data),
                hr_abertura: hora,
                idopera_ultacao: req.userId,
            };

            if (caixa.id) {
                const getCaixa = await Caixa.findByPk(caixa.id, {
                    include: [
                        { model: Operador, as: 'operador' },
                        { model: Caixa1, as: 'caixa1' },
                    ],
                });

                if (!getCaixa) {
                    return res.status(400).json({
                        error: `Nenhum caixa encontrado com este id ${req.body.id}`,
                    });
                }

                caixa1 = caixa1.map(item => ({
                    ...item,
                    caixa_id: getCaixa.id,
                    idopera_ultacao: req.userId,
                }));

                const caixa1Delta = getDelta(getCaixa.caixa1, caixa1);
                await Caixa.sequelize
                    .transaction(async transaction => {
                        // Update caixa1
                        await Promise.all([
                            caixa1Delta.added.map(async pagar1D => {
                                await Caixa1.create(pagar1D, {
                                    transaction,
                                }).catch(Caixa.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            caixa1Delta.changed.map(async pagar1Data => {
                                const pagar1 = req.body.pagar1.find(
                                    _pagar1 => _pagar1.id === pagar1Data.id
                                );
                                await Caixa1.update(pagar1, {
                                    where: { id: pagar1.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            caixa1Delta.deleted.map(async pagar1Del => {
                                await pagar1Del
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        // Finally update
                        const caixaUpdate = await getCaixa
                            .update({
                                transaction,
                            })
                            .catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });

                        return res.status(200).json(caixaUpdate);
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
            }

            const joinCaixa = {
                ...caixa,
                caixa1: [...caixa1],
            };

            const criaCaixa = await Caixa.create(joinCaixa, {
                include: [{ model: Caixa1, as: 'caixa1' }],
            })
                .then(x => {
                    return Caixa.findByPk(x.get('id'), {
                        include: [{ model: Caixa1, as: 'caixa1' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(criaCaixa);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async aberturaCaixa(req, res) {
        const { Caixa } = Database.getModels(req.database);

        const caixa = await Caixa.findAll({
            where: { operador_id: req.userId, sitcai: 'A' },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        if (caixa.length > 0) {
            return res.status(200).json(true);
        }

        return res.status(200).json(false);
    }

    async fecharCaixa(req, res) {
        const { Operador, Caixa, Caixa1 } = Database.getModels(req.database);

        // Faz validação dos parametros
        const campo = 'fecha_caixa_opelogado, dt_banco';
        const getParam = await Operador.sequelize
            .query(`select ${campo} from param, param2`, {
                type: Sequelize.QueryTypes.SELECT,
            })
            .catch(err => {
                return res.status(400).json({ error: err.message });
            });
        const { fecha_caixa_opelogado, dt_banco } = getParam[0];

        let crcaixa = req.body;

        if (fecha_caixa_opelogado === '1') {
            if (req.userId !== crcaixa.operador_id) {
                return res.status(400).json({
                    error:
                        'Operador logado no sistema diferente do operador que abriu o caixa.',
                });
            }
        }

        let m = {};
        m = {
            ...m,
            valtot: 0,
        };

        const curcaixa1 = await Caixa1.findAll({
            where: { caixa_id: crcaixa.id },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        for (const mov of curcaixa1) {
            if (mov.tipfor === '1') {
                m = {
                    ...m,
                    valtot: parseFloat(m.valtot) + parseFloat(mov.valfor),
                };
            } else {
                m = {
                    ...m,
                    valtot: parseFloat(m.valtot) - parseFloat(mov.valfor),
                };
            }
        }

        const curmovcai = await Operador.sequelize
            .query(
                `select SUM(valpag) as totpag from movcai where movcai.caixa_id = ${crcaixa.id}`,
                {
                    type: Sequelize.QueryTypes.SELECT,
                }
            )
            .catch(err => {
                return res.status(400).json({ error: err.message });
            });

        m = {
            ...m,
            valtot: parseFloat(m.valtot) + parseFloat(curmovcai[0].totpag ?? 0),
        };

        const data = await PegaData(req, dt_banco);
        const hora = await PegaHora(req, dt_banco);

        crcaixa = {
            ...crcaixa,
            dt_fechamento: convertDate(data),
            hr_fechamento: hora,
            valfin: parseFloat(m.valtot)
                .toFixed(2)
                .toString(),
            sitcai: 'F',
            idopera_ultacao: req.userId,
        };

        const updateCaixa = await Caixa.update(crcaixa, {
            where: { id: crcaixa.id },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        return res.status(200).json(updateCaixa);
    }

    async reabrirCaixa(req, res) {
        const { Caixa } = Database.getModels(req.database);

        let crcaixa = req.body;

        const curcaixa = await Caixa.findAll({
            where: { operador_id: req.body.operador_id, sitcai: 'A' },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        if (curcaixa.length > 0) {
            return res.status(400).json({
                error:
                    'O Operador ainda possui um caixa aberto, impossível reabrir outro caixa.',
            });
        }

        crcaixa = {
            ...crcaixa,
            sitcai: 'A',
            valfin: '0.00',
            dt_fechamento: null,
            hr_fechamento: null,
            idopera_ultacao: req.userId,
        };

        const updateCaixa = await Caixa.update(crcaixa, {
            where: { id: crcaixa.id },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        return res.status(200).json(updateCaixa);
    }

    async reportOcorrencias(req, res) {
        const { Tablogcai, Operador } = Database.getModels(req.database);
        const { startDate, endDate } = req.query;

        const datainicial = new Date(startDate);
        const dia =
            datainicial.getDate() >= 10
                ? datainicial.getDate()
                : `0${datainicial.getDate()}`;
        const mes =
            datainicial.getMonth() + 1 >= 10
                ? datainicial.getMonth() + 1
                : `0${datainicial.getMonth() + 1}`;
        const ano = datainicial.getFullYear();

        const datafinal = new Date(endDate);
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

        let ocorrencias = await Tablogcai.findAll({
            where: Tablogcai.sequelize.literal(
                `"Tablogcai"."data" BETWEEN ${dataf}`
            ),
            order: [['data', 'ASC']],
            include: [
                {
                    model: Operador,
                    as: 'operador',
                },
            ],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        ocorrencias = JSON.parse(JSON.stringify(ocorrencias));

        ocorrencias.map(item => {
            item.data = format(parseISO(item.data), 'dd/MM/yyyy');
            return item;
        });

        const ocorrencias_bycaixa = _.groupBy(ocorrencias, 'caixa_id');

        ocorrencias = [];

        _.forEach(ocorrencias_bycaixa, async function(value, key) {
            ocorrencias.push({
                caixa: key,
                ocorrencias: value,
            });
        });

        const { dataReport } = req.body;

        dataReport.data = ocorrencias;

        let reportHtml = null;

        if (ocorrencias.length > 0) {
            reportHtml = await gerarRelatorioHtml(dataReport);
        }

        return res.status(200).json(reportHtml);
    }

    async reportFechamento(req, res) {
        const {
            Movcai,
            Movpac,
            Movexa,
            Exame,
            Prontuario,
            Posto,
            Caixa,
            Caixa1,
            Operador,
            Operador2,
        } = Database.getModels(req.database);

        let { startDate, endDate } = req.query;
        const { option } = req.query;

        const datainicial = new Date(startDate);
        const dia =
            datainicial.getDate() >= 10
                ? datainicial.getDate()
                : `0${datainicial.getDate()}`;
        const mes =
            datainicial.getMonth() + 1 >= 10
                ? datainicial.getMonth() + 1
                : `0${datainicial.getMonth() + 1}`;
        const ano = datainicial.getFullYear();

        const datafinal = new Date(endDate);
        const diaf =
            datafinal.getDate() >= 10
                ? datafinal.getDate()
                : `0${datafinal.getDate()}`;
        const mesf =
            datafinal.getMonth() + 1 >= 10
                ? datafinal.getMonth() + 1
                : `0${datafinal.getMonth() + 1}`;
        const anof = datafinal.getFullYear();

        startDate = `${dia}/${mes}/${ano}`;
        endDate = `${diaf}/${mesf}/${anof}`;

        const m = {};
        m.stringpos = '';
        m.filtracaixa = null;

        const getPostoPerm = await Operador.findOne({
            where: { id: req.userId },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });
        const getCaixaPerm = await Operador2.findOne({
            where: { operador_id: req.userId },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });
        let { postoperm } = getPostoPerm;
        let { caixaperm } = getCaixaPerm;

        postoperm = !postoperm ? null : postoperm.trim();
        caixaperm = !caixaperm ? null : caixaperm.trim();

        if (postoperm) {
            const lenperm = postoperm.split(',');
            m.stringpos = `(movcai.posto = `;
            for (let i = 0; i < lenperm.length; i++) {
                const element = lenperm[i].trim();
                if (i === lenperm.length - 1) {
                    m.stringpos += `'${element}')`;
                } else {
                    m.stringpos += `'${element}' OR movcai.posto = `;
                }
            }
        }

        m.stringcaixa = '';

        if (caixaperm) {
            if (m.stringpos) {
                m.stringcaixa = ' and ';
            }
            m.stringcaixa += `(CAIXA.OPERADOR_ID IN ('"${
                req.userId
            }"','${caixaperm ?? ''}'))`;
            m.stringpos += m.stringcaixa;
        }

        m.filtro = `Período de: ${startDate} a ${endDate}.`;

        switch (option) {
            case '1': {
                // 1: Sintético
                const getFimcai = await fimCaixa(
                    req,
                    startDate,
                    endDate,
                    m.stringpos,
                    null,
                    false,
                    0
                );

                const totalgeral = {
                    dinheiro: 0,
                    ch_vista: 0,
                    ct_deb: 0,
                    ct_cred: 0,
                    ch_prazo: 0,
                    outros: 0,
                };

                getFimcai.map(item => {
                    totalgeral.dinheiro += parseFloat(item.dinheiro);
                    totalgeral.ch_vista += parseFloat(item.ch_vista);
                    totalgeral.ct_deb += parseFloat(item.ct_deb);
                    totalgeral.ct_cred += parseFloat(item.ct_cred);
                    totalgeral.ch_prazo += parseFloat(item.ch_prazo);
                    totalgeral.outros += parseFloat(item.outros);
                });
                const fimcaiGrouped = _.groupBy(getFimcai, 'datcai');
                const fimcai = [];
                _.forEach(fimcaiGrouped, (values, key) => {
                    const colunas = {
                        dinheiro: 0,
                        ch_vista: 0,
                        ct_deb: 0,
                        ct_cred: 0,
                        ch_prazo: 0,
                        outros: 0,
                    };
                    values.map(item => {
                        colunas.dinheiro += parseFloat(item.dinheiro);
                        colunas.ch_vista += parseFloat(item.ch_vista);
                        colunas.ct_deb += parseFloat(item.ct_deb);
                        colunas.ct_cred += parseFloat(item.ct_cred);
                        colunas.ch_prazo += parseFloat(item.ch_prazo);
                        colunas.outros += parseFloat(item.outros);
                    });
                    fimcai.push({
                        values,
                        key,
                        ...colunas,
                        totalgeral,
                    });
                });

                const { dataReport } = req.body;

                dataReport.data = {
                    fimcai,
                };

                const reportHtml = await gerarRelatorioHtml(dataReport);

                return res.status(200).json(reportHtml);
            }
            case '3': {
                // 3: Sintético por posto e data
                const getFimcai = await fimCaixaPosto(
                    req,
                    startDate,
                    endDate,
                    m.stringpos,
                    null,
                    1
                );

                const { totentradassaidas } = getFimcai;

                const totalgeral = {
                    entrada: 0,
                    saida: 0,
                    dinheiro: 0,
                    ch_vista: 0,
                    ct_deb: 0,
                    ct_cred: 0,
                    ch_prazo: 0,
                    outros: 0,
                };

                getFimcai.curcai.map(fimcai => {
                    switch (fimcai.tippag) {
                        case '1':
                            totalgeral.dinheiro +=
                                parseFloat(fimcai.totpag) ?? 0;
                            break;
                        case '2':
                            totalgeral.ch_vista +=
                                parseFloat(fimcai.totpag) ?? 0;
                            break;
                        case '3':
                            totalgeral.ct_cred += parseFloat(fimcai.totpag);
                            break;
                        case '5':
                            totalgeral.ct_deb += parseFloat(fimcai.totpag);
                            break;
                        case '6':
                            totalgeral.ch_prazo += parseFloat(fimcai.totpag);
                            break;
                        case '7':
                            totalgeral.entrada += parseFloat(fimcai.totpag);
                            break;
                        case '8':
                            totalgeral.saida += parseFloat(fimcai.totpag);
                            break;
                        case '9':
                            totalgeral.outros += parseFloat(fimcai.totpag);
                            break;
                        default:
                    }
                });

                const result = {};
                const groupDatcai = _.groupBy(getFimcai.curcai, 'datcai');
                _.forEach(groupDatcai, (items, data) => {
                    result[data] = _.groupBy(items, 'posto');
                    _.forEach(result[data], (movs, posto) => {
                        result[data][posto] = _.groupBy(movs, 'caixa_id');
                    });
                });

                const dados = [];

                _.forEach(result, (items1, data) => {
                    const obj = [];
                    _.forEach(items1, (items2, posto) => {
                        const subtotal = {
                            entrada: 0,
                            saida: 0,
                            dinheiro: 0,
                            ch_vista: 0,
                            ct_deb: 0,
                            ct_cred: 0,
                            ch_prazo: 0,
                            outros: 0,
                        };
                        let postonome = null;
                        const caixas = [];
                        _.forEach(items2, (items3, mov) => {
                            const caixaSomado = {
                                caixa_id: items3[0].caixa_id,
                                datcai: items3[0].datcai,
                                posto: items3[0].posto,
                                descricao: items3[0].descricao,
                                nome: items3[0].nome,
                                sitcai: items3[0].sitcai,
                                entrada: 0,
                                saida: 0,
                                dinheiro: 0,
                                ch_vista: 0,
                                ct_deb: 0,
                                ct_cred: 0,
                                ch_prazo: 0,
                                outros: 0,
                            };
                            _.forEach(items3, item => {
                                switch (item.tippag) {
                                    case '1':
                                        caixaSomado.dinheiro +=
                                            parseFloat(item.totpag) ?? 0;
                                        break;
                                    case '2':
                                        caixaSomado.ch_vista +=
                                            parseFloat(item.totpag) ?? 0;
                                        break;
                                    case '3':
                                        caixaSomado.ct_cred += parseFloat(
                                            item.totpag
                                        );
                                        break;
                                    case '5':
                                        caixaSomado.ct_deb += parseFloat(
                                            item.totpag
                                        );
                                        break;
                                    case '6':
                                        caixaSomado.ch_prazo += parseFloat(
                                            item.totpag
                                        );
                                        break;
                                    case '7':
                                        caixaSomado.entrada += parseFloat(
                                            item.totpag
                                        );
                                        break;
                                    case '8':
                                        caixaSomado.saida += parseFloat(
                                            item.totpag
                                        );
                                        break;
                                    case '9':
                                        caixaSomado.outros += parseFloat(
                                            item.totpag
                                        );
                                        break;
                                    default:
                                }
                            });
                            postonome = items3[0].descricao;
                            caixaSomado.dinheiro = parseFloat(
                                parseFloat(caixaSomado.entrada) -
                                    parseFloat(caixaSomado.saida) +
                                    parseFloat(caixaSomado.dinheiro)
                            ).toFixed(2);
                            subtotal.entrada += parseFloat(caixaSomado.entrada);
                            subtotal.saida += parseFloat(caixaSomado.saida);
                            subtotal.dinheiro += parseFloat(
                                caixaSomado.dinheiro
                            );
                            subtotal.ch_vista += parseFloat(
                                caixaSomado.ch_vista
                            );
                            subtotal.ct_deb += parseFloat(caixaSomado.ct_deb);
                            subtotal.ct_cred += parseFloat(caixaSomado.ct_cred);
                            subtotal.ch_prazo += parseFloat(
                                caixaSomado.ch_prazo
                            );
                            subtotal.outros += parseFloat(caixaSomado.outros);
                            totalgeral.entrada += parseFloat(
                                caixaSomado.entrada
                            );
                            caixas.push(caixaSomado);
                        });
                        obj.push({
                            posto,
                            postonome,
                            caixas,
                            subtotal,
                        });
                    });
                    dados.push({
                        data,
                        postos: obj,
                        totalgeral,
                        totentradassaidas,
                    });
                });

                const { dataReport } = req.body;

                dataReport.data = { dados };

                const reportHtml = await gerarRelatorioHtml(dataReport);

                return res.status(200).json(reportHtml);
            }
            case '4': {
                // 4: Sintético por posto geral
                const getFimcai = await fimCaixaPosto(
                    req,
                    startDate,
                    endDate,
                    m.stringpos,
                    null,
                    2
                );

                const { totentradassaidas } = getFimcai;

                const totalgeral = {
                    entrada: 0,
                    saida: 0,
                    dinheiro: 0,
                    ch_vista: 0,
                    ct_deb: 0,
                    ct_cred: 0,
                    ch_prazo: 0,
                    outros: 0,
                };

                getFimcai.curcai.map(fimcai => {
                    switch (fimcai.tippag) {
                        case '1':
                            totalgeral.dinheiro +=
                                parseFloat(fimcai.totpag) ?? 0;
                            break;
                        case '2':
                            totalgeral.ch_vista +=
                                parseFloat(fimcai.totpag) ?? 0;
                            break;
                        case '3':
                            totalgeral.ct_cred += parseFloat(fimcai.totpag);
                            break;
                        case '5':
                            totalgeral.ct_deb += parseFloat(fimcai.totpag);
                            break;
                        case '6':
                            totalgeral.ch_prazo += parseFloat(fimcai.totpag);
                            break;
                        case '7':
                            totalgeral.entrada += parseFloat(fimcai.totpag);
                            break;
                        case '8':
                            totalgeral.saida += parseFloat(fimcai.totpag);
                            break;
                        case '9':
                            totalgeral.outros += parseFloat(fimcai.totpag);
                            break;
                        default:
                    }
                });

                const result = {};
                const groupPosto = _.groupBy(getFimcai.curcai, 'posto');
                _.forEach(groupPosto, (items, posto) => {
                    result[posto] = _.groupBy(items, 'caixa_id');
                });

                const dados = [];

                _.forEach(result, (items1, posto) => {
                    const obj = [];
                    let postonome = null;
                    const totPosto = {
                        dinheiro: 0,
                        ch_vista: 0,
                        ct_deb: 0,
                        ct_cred: 0,
                        ch_prazo: 0,
                        outros: 0,
                    };
                    _.forEach(items1, (items2, caixa) => {
                        const caixaSomado = {
                            caixa_id: items2[0].caixa_id,
                            datcai: items2[0].datcai,
                            posto: items2[0].posto,
                            descricao: items2[0].descricao,
                            nome: items2[0].nome,
                            sitcai: items2[0].sitcai,
                            dinheiro: 0,
                            ch_vista: 0,
                            ct_deb: 0,
                            ct_cred: 0,
                            ch_prazo: 0,
                            outros: 0,
                        };
                        postonome = items2[0].descricao.trim();
                        _.forEach(items2, item => {
                            switch (item.tippag) {
                                case '1':
                                    caixaSomado.dinheiro +=
                                        parseFloat(item.totpag) ?? 0;
                                    break;
                                case '2':
                                    caixaSomado.ch_vista +=
                                        parseFloat(item.totpag) ?? 0;
                                    break;
                                case '3':
                                    caixaSomado.ct_cred += parseFloat(
                                        item.totpag
                                    );
                                    break;
                                case '5':
                                    caixaSomado.ct_deb += parseFloat(
                                        item.totpag
                                    );
                                    break;
                                case '6':
                                    caixaSomado.ch_prazo += parseFloat(
                                        item.totpag
                                    );
                                    break;
                                case '9':
                                    caixaSomado.outros += parseFloat(
                                        item.totpag
                                    );
                                    break;
                                default:
                            }
                        });
                        totPosto.dinheiro += parseFloat(caixaSomado.dinheiro);
                        totPosto.ch_vista += parseFloat(caixaSomado.ch_vista);
                        totPosto.ct_deb += parseFloat(caixaSomado.ct_deb);
                        totPosto.ct_cred += parseFloat(caixaSomado.ct_cred);
                        totPosto.ch_prazo += parseFloat(caixaSomado.ch_prazo);
                        totPosto.outros += parseFloat(caixaSomado.outros);
                        obj.push(caixaSomado);
                    });

                    dados.push({
                        posto,
                        postonome,
                        caixas: obj,
                        ...totPosto,
                        totalgeral,
                        totentradassaidas,
                    });
                });

                const { dataReport } = req.body;

                dataReport.data = { dados };

                const reportHtml = await gerarRelatorioHtml(dataReport);

                return res.status(200).json(reportHtml);
            }
            case '2':
            case '5': {
                const cartao =
                    req.query.cartao === 'undefined'
                        ? 0
                        : parseFloat(req.query.cartao);

                const selectedCaixas = [];
                const cur_caixa = req.body.selectedCurCaixa;
                cur_caixa.map(item => {
                    selectedCaixas.push({
                        '$movcai.caixa_id$': item.id,
                    });
                });

                let valini = 0;

                cur_caixa.map(item => {
                    valini += parseFloat(item.valini);
                });

                let instrucaosql;

                instrucaosql = `
                SELECT TIPPAG,
                SUM(VALPAG) AS VALPAG
                FROM MOVCAI
                WHERE
                `;

                if ((cartao ?? 0) > 0) {
                    instrucaosql += ` (MOVCAI.CARTAO_ID = ${cartao}) AND `;
                }

                instrucaosql += ' (';

                instrucaosql += `movcai.caixa_id IN ( `;
                for (let i = 0; i < cur_caixa.length; i++) {
                    const element = cur_caixa[i];
                    if (i === cur_caixa.length - 1) {
                        instrucaosql += `${element.id}`;
                    } else {
                        instrucaosql += `${element.id}, `;
                    }
                }

                instrucaosql += ')';

                if (m.stringpos) {
                    instrucaosql += ` AND ${m.stringpos}, "caixa", "movcai") `;
                } else {
                    instrucaosql += ' )';
                }

                instrucaosql += ` GROUP BY TIPPAG`;

                const sequelize = Database.instances[req.database];

                const curfompag = await sequelize
                    .query(instrucaosql, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                let totvalpag = 0;

                curfompag.map(pag => {
                    totvalpag += parseFloat(pag.valpag);
                });

                let curpaciente;

                const filtracartao =
                    cartao > 0
                        ? { '$movcai.cartao_id$': parseFloat(cartao) }
                        : null;

                let getCurpaciente = await Movpac.findAll({
                    attributes: [
                        'posto',
                        'amostra',
                        'id',
                        'dataentra',
                        'totpag',
                        'descval',
                        'acresval',
                        'descperc',
                        'acresperc',
                        'totalpaci',
                        'totrec',
                        'diferenca',
                    ],
                    where: {
                        [Op.or]: selectedCaixas,
                        [Op.not]: [{ '$movcai.tippag$': 4 }],
                        [Op.and]: [{ '$movexa.fatura$': 0 }, filtracartao],
                    },
                    include: [
                        {
                            model: Movcai,
                            as: 'movcai',
                            include: [
                                {
                                    model: Caixa,
                                    as: 'caixa',
                                },
                                {
                                    model: Operador,
                                    as: 'operador',
                                    attributes: ['nome'],
                                },
                            ],
                        },
                        {
                            model: Prontuario,
                            as: 'prontuario',
                        },
                        {
                            model: Movexa,
                            as: 'movexa',
                            attributes: ['id'],
                            include: [
                                {
                                    model: Exame,
                                    as: 'exame',
                                    attributes: ['codigo'],
                                },
                            ],
                        },
                    ],
                    order: [
                        // ['posto', 'ASC'],
                        ['amostra', 'ASC'],
                        [{ model: Movcai, as: 'movcai' }, 'id', 'ASC'],
                    ],
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                getCurpaciente = JSON.parse(JSON.stringify(getCurpaciente));

                if (option === '2') {
                    curpaciente = getCurpaciente;
                } else {
                    const curpaciente_byposto = _.groupBy(
                        getCurpaciente,
                        'posto'
                    );

                    const newCurPaciente = [];

                    _.forEach(curpaciente_byposto, async function(value, key) {
                        const totalgeral = {
                            totpag: 0,
                            totalpaci: 0,
                            totrec: 0,
                            diferenca: 0,
                            dinheiro: 0,
                            ct_deb: 0,
                            ct_cred: 0,
                            tot_cart: 0,
                            outros: 0,
                        };

                        const postonome = await Posto.findOne({
                            attributes: ['descricao'],
                            where: {
                                codigo: key,
                            },
                        })
                            .then(response => response.descricao)
                            .catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });

                        const obj = {
                            posto: key,
                            postonome,
                            pacientes: value,
                            totalgeral,
                        };

                        for (const item of value) {
                            totalgeral.totpag += parseFloat(item.totpag);
                            totalgeral.totalpaci += parseFloat(item.totalpaci);
                            totalgeral.totrec += parseFloat(item.totrec);
                            totalgeral.diferenca += parseFloat(item.diferenca);

                            for (const mov of item.movcai) {
                                switch (mov.tippag) {
                                    case '1':
                                        totalgeral.dinheiro += parseFloat(
                                            mov.valpag
                                        );
                                        break;
                                    case '5':
                                        totalgeral.ct_deb += parseFloat(
                                            mov.valpag
                                        );
                                        totalgeral.tot_cart += parseFloat(
                                            mov.valpag
                                        );
                                        break;
                                    case '3':
                                        totalgeral.ct_cred += parseFloat(
                                            mov.valpag
                                        );
                                        totalgeral.tot_cart += parseFloat(
                                            mov.valpag
                                        );
                                        break;
                                    case '2':
                                    case '6':
                                    case '9':
                                        totalgeral.outros += parseFloat(
                                            mov.valpag
                                        );
                                        break;
                                    default:
                                }
                            }
                        }

                        newCurPaciente.push(obj);
                    });

                    curpaciente = newCurPaciente;
                }

                const selectedCaixasRelcheques = [];
                cur_caixa.map(item => {
                    selectedCaixasRelcheques.push({
                        caixa_id: item.id,
                    });
                });
                const filtracartaoRelcheques =
                    cartao > 0 ? { cartao_id: parseFloat(cartao) } : null;

                const relcheques = await Movcai.findAll({
                    where: {
                        [Op.or]: selectedCaixasRelcheques,
                        tippag: { [Op.or]: [2, 6] },
                        [Op.and]: [filtracartaoRelcheques],
                    },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                const selectedCaixasDespesas = [];
                cur_caixa.map(item => {
                    selectedCaixasDespesas.push({
                        caixa_id: item.id,
                    });
                });
                const reldespesas = await Caixa1.findAll({
                    where: {
                        [Op.or]: selectedCaixasDespesas,
                        [Op.and]: [{ tipfor: 2 }],
                    },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                let fimcai = await fimCaixa(
                    req,
                    startDate,
                    endDate,
                    m.stringpos,
                    null,
                    cur_caixa,
                    cartao,
                    option
                );

                fimcai = {
                    ...fimcai,
                    valini,
                    totvalpag,
                };

                const { dataReport } = req.body;

                dataReport.data = {
                    curpaciente,
                    relcheques,
                    reldespesas,
                    fimcai,
                    cur_caixa,
                };

                const reportHtml = await gerarRelatorioHtml(dataReport);

                return res.status(200).json(reportHtml);
            }
            default:
        }

        return null;
    }

    async reportFechamentoPosto(req, res) {
        const { Operador } = Database.getModels(req.database);
        let { startDate, endDate } = req.query;

        const datainicial = new Date(startDate);
        const dia =
            datainicial.getDate() >= 10
                ? datainicial.getDate()
                : `0${datainicial.getDate()}`;
        const mes =
            datainicial.getMonth() + 1 >= 10
                ? datainicial.getMonth() + 1
                : `0${datainicial.getMonth() + 1}`;
        const ano = datainicial.getFullYear();

        const datafinal = new Date(endDate);
        const diaf =
            datafinal.getDate() >= 10
                ? datafinal.getDate()
                : `0${datafinal.getDate()}`;
        const mesf =
            datafinal.getMonth() + 1 >= 10
                ? datafinal.getMonth() + 1
                : `0${datafinal.getMonth() + 1}`;
        const anof = datafinal.getFullYear();

        startDate = `${dia}/${mes}/${ano}`;
        endDate = `${diaf}/${mesf}/${anof}`;

        const m = {};
        m.stringpos = '';

        const getPostoPerm = await Operador.findOne({
            where: { id: req.userId },
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        let { postoperm } = getPostoPerm;

        postoperm = !postoperm ? null : postoperm.trim();

        if (postoperm) {
            const lenperm = postoperm.split(',');
            m.stringpos = `(movcai.posto = `;
            for (let i = 0; i < lenperm.length; i++) {
                const element = lenperm[i].trim();
                if (i === lenperm.length - 1) {
                    m.stringpos += `'${element}')`;
                } else {
                    m.stringpos += `'${element}' OR movcai.posto = `;
                }
            }
        }

        let instrucaosql;

        instrucaosql = `
            SELECT
            CAIXA.DATCAI,
            OPERADOR.NOME,
            CAIXA.SITCAI,
            CAIXA.OPERADOR_ID,
            CAIXA.VALINI,
            CAIXA.DT_ABERTURA,
            CAIXA.HR_ABERTURA,
            CAIXA.DT_FECHAMENTO,
            CAIXA.HR_FECHAMENTO,
            CAIXA.ID
            FROM CAIXA
            LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
            WHERE (CAIXA.DATCAI BETWEEN '${startDate}' AND '${endDate}')
            ORDER BY DATCAI DESC
        `;
        if (m.stringpos) {
            instrucaosql += `"LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID", "LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID LEFT JOIN MOVCAI ON MOVCAI.CAIXA_ID = CAIXA.ID "`;
            instrucaosql += `"ORDER BY DATCAI DESC"," AND " ${m.stringpos} " ORDER BY DATCAI DESC  "`;
        }

        const sequelize = Database.instances[req.database];

        const cur_caixa = await sequelize
            .query(instrucaosql, { type: QueryTypes.SELECT })
            .catch(sequelize, err => {
                return err.message;
            });

        const marca = cur_caixa.map(item => ({
            ...item,
            marca: true,
            mostra: true,
        }));

        return res.status(200).json(marca);
    }

    async reportCaixa(req, res) {
        const { dataReport } = req.body;
        const reportHtml = await gerarRelatorioHtml(dataReport);

        return res.status(200).json(reportHtml);
    }

    async getCaixaLogado(req, res) {
        try {
            const { Caixa } = Database.getModels(req.database);

            const result = await Caixa.findAll({
                    attributes: ['id', 'datcai'],
                    where: { operador_id: req.userId, sitcai: 'A' }
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new CaixaController();
