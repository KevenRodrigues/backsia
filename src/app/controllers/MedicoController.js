import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';
import { format, parseISO } from 'date-fns';
import { QueryTypes } from 'sequelize';
import { gerarRelatorioHtml } from './functions/functions';

class MedicoController {
    async index(req, res) {
        try {
            const { Medico, Motina } = Database.getModels(req.database);
            const { page = 1 } = req.query;
            let { limit = 10 } = req.query;

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
                req.query.search.includes('%') ? (limit = 500) : null;
                where = ` "Medico"."status" = 0 and Unaccent(upper(trim(coalesce("Medico"."nome_med",'')))) ilike Unaccent('${search.toUpperCase()}%') or   Unaccent(upper(trim(coalesce("Medico"."crm",'')))) ILIKE '${search.toUpperCase()}%'`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += MedicoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = MedicoController.handleFilters(filter, filtervalue);
                }
            }

            const medicos = await Medico.findAll({
                order: Medico.sequelize.literal(`${order} ${orderdesc}`),
                where: Medico.sequelize.literal(where),
                attributes: [
                    'id',
                    'crm',
                    'nome_med',
                    'fone1',
                    'fone2',
                    'fone3',
                    'celular',
                    'email',
                    'abrev',
                    'ufcrm',
                    'endereco',
                    'bairro',
                    'cep',
                    'cidade',
                    'uf',
                    'senha',
                    'uncp',
                    'cpf',
                    'bpacns',
                    'bpacbo',
                    'login',
                    'obs_med',
                    'chavesline',
                    'unimed',
                    'interno',
                    'enviawww',
                    'padrao',
                    'uncp_bak',
                    'status',
                    'espmed_id',
                    'datanasc',
                    'idopera_ultacao',
                    [
                        Medico.sequelize.literal(
                            `(SELECT reltuples::bigint FROM pg_catalog.pg_class WHERE relname = 'medico')`
                        ),
                        'total',
                    ],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const medicos_trim = medicos.map(medico => {
                medico.crm = medico.crm ? medico.crm.trim() : '';
                medico.nome_med = medico.nome_med ? medico.nome_med.trim() : '';
                medico.fone1 = medico.fone1 ? medico.fone1.trim() : '';
                medico.fone2 = medico.fone2 ? medico.fone2.trim() : '';
                medico.fone3 = medico.fone3 ? medico.fone3.trim() : '';
                medico.celular = medico.celular ? medico.celular.trim() : '';
                medico.celular = medico.celular ? medico.celular.trim() : '';
                medico.email = medico.email ? medico.email.trim() : '';
                medico.abrev = medico.abrev ? medico.abrev.trim() : '';
                medico.ufcrm = medico.ufcrm ? medico.ufcrm.trim() : '';
                medico.endereco = medico.endereco ? medico.endereco.trim() : '';
                medico.bairro = medico.bairro ? medico.bairro.trim() : '';
                medico.cep = medico.cep ? medico.cep.trim() : '';
                medico.cidade = medico.cidade ? medico.cidade.trim() : '';
                medico.uf = medico.uf ? medico.uf.trim() : '';
                medico.senha = medico.senha ? medico.senha.trim() : '';
                medico.uncp = medico.uncp ? medico.uncp.trim() : '';
                medico.cpf = medico.cpf ? medico.cpf.trim() : '';
                medico.bpacns = medico.bpacns ? medico.bpacns.trim() : '';
                medico.bpacbo = medico.bpacbo ? medico.bpacbo.trim() : '';
                medico.login = medico.login ? medico.login.trim() : '';
                medico.obs_med = medico.obs_med ? medico.obs_med.trim() : '';
                medico.chavesline = medico.chavesline
                    ? medico.chavesline.trim()
                    : '';
                medico.unimed = medico.unimed ? medico.unimed.trim() : '';

                if (medico.motina) {
                    medico.motina.descricao = medico.motina.descricao.trim();
                }

                return medico;
            });

            return res.status(200).json(medicos_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Medico,
                Motina,
                MedicoCod,
                Convenio,
                Espmed,
            } = Database.getModels(req.database);
            const medicos = await Medico.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'crm',
                    'nome_med',
                    'fone1',
                    'fone2',
                    'fone3',
                    'celular',
                    'email',
                    'abrev',
                    'ufcrm',
                    'endereco',
                    'bairro',
                    'cep',
                    'cidade',
                    'uf',
                    'senha',
                    'uncp',
                    'cpf',
                    'bpacns',
                    'bpacbo',
                    'login',
                    'obs_med',
                    'chavesline',
                    'unimed',
                    'interno',
                    'enviawww',
                    'padrao',
                    'uncp_bak',
                    'status',
                    'espmed_id',
                    'datanasc',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Espmed,
                        as: 'espmed',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: MedicoCod,
                        order: ['id', 'DESC'],
                        as: 'medicocod',
                        attributes: [
                            'id',
                            'medico_id',
                            'convenio_id',
                            'medicocod',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['id', 'razao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!medicos) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            medicos.crm = medicos.crm ? medicos.crm.trim() : '';
            medicos.nome_med = medicos.nome_med ? medicos.nome_med.trim() : '';
            medicos.fone1 = medicos.fone1 ? medicos.fone1.trim() : '';
            medicos.fone2 = medicos.fone2 ? medicos.fone2.trim() : '';
            medicos.fone3 = medicos.fone3 ? medicos.fone3.trim() : '';
            medicos.celular = medicos.celular ? medicos.celular.trim() : '';
            medicos.email = medicos.email ? medicos.email.trim() : '';
            medicos.abrev = medicos.abrev ? medicos.abrev.trim() : '';
            medicos.ufcrm = medicos.ufcrm ? medicos.ufcrm.trim() : '';
            medicos.endereco = medicos.endereco ? medicos.endereco.trim() : '';
            medicos.bairro = medicos.bairro ? medicos.bairro.trim() : '';
            medicos.cep = medicos.cep ? medicos.cep.trim() : '';
            medicos.cidade = medicos.cidade ? medicos.cidade.trim() : '';
            medicos.uf = medicos.uf ? medicos.uf.trim() : '';
            medicos.senha = medicos.senha ? medicos.senha.trim() : '';
            medicos.uncp = medicos.uncp ? medicos.uncp.trim() : '';
            medicos.cpf = medicos.cpf ? medicos.cpf.trim() : '';
            medicos.bpacns = medicos.bpacns ? medicos.bpacns.trim() : '';
            medicos.bpacbo = medicos.bpacbo ? medicos.bpacbo.trim() : '';
            medicos.login = medicos.login ? medicos.login.trim() : '';
            medicos.obs_med = medicos.obs_med ? medicos.obs_med.trim() : '';
            medicos.chavesline = medicos.chavesline
                ? medicos.chavesline.trim()
                : '';
            medicos.unimed = medicos.unimed ? medicos.unimed.trim() : '';

            if (medicos.status) {
                medicos.motina.descricao = medicos.motina.descricao.trim();
            }
            if (medicos.espmed_id) {
                medicos.espmed.descricao = medicos.espmed.descricao.trim();
            }

            medicos.medicocod.map(medicocod => {
                medicocod.medicocod = medicocod.medicocod
                    ? medicocod.medicocod.trim()
                    : '';
                if (medicocod.convenio) {
                    medicocod.convenio.razao = medicocod.convenio.razao
                        ? medicocod.convenio.razao.trim()
                        : '';
                }
                return medicocod;
            });
            return res.status(200).json(medicos);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Medico, MedicoCod } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                nome_med: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo nome do medico obrigatorio'),
                medicocod: Yup.array().of(
                    Yup.object().shape({
                        convenio_id: Yup.number()
                            .transform(value =>
                                Number.isNaN(value) ? undefined : value
                            )
                            .required('Campo convenio Obrigatorio'),
                    })
                ),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const medico = await Medico.findByPk(req.body.id, {
                    include: [{ model: MedicoCod, as: 'medicocod' }],
                });

                if (!medico) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const medicocodDelta = getDelta(
                    medico.medicocod,
                    req.body.medicocod
                );

                await Medico.sequelize
                    .transaction(async transaction => {
                        // Update Medicocod
                        await Promise.all([
                            medicocodDelta.added.map(async medicocodD => {
                                await MedicoCod.create(medicocodD, {
                                    transaction,
                                }).catch(Medico.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),

                            medicocodDelta.changed.map(async medicocodData => {
                                const medicocod = req.body.medicocod.find(
                                    _medicocod =>
                                        _medicocod.id === medicocodData.id
                                );
                                await MedicoCod.update(medicocod, {
                                    where: { id: medicocod.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),

                            medicocodDelta.deleted.map(async medicocodDel => {
                                await medicocodDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Medico.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                const { razao, status, medicocod, medico_id } = req.body;

                return res.status(200).json({
                    razao,
                    status,
                    medicocod,
                    medico_id,
                });
            }
            const { id, nome_med, status, medicocod } = await Medico.create(
                req.body,
                {
                    include: [{ model: MedicoCod, as: 'medicocod' }],
                }
            )
                .then(x => {
                    return Medico.findByPk(x.get('id'), {
                        include: [{ model: MedicoCod, as: 'medicocod' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                nome_med,
                status,
                medicocod,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Medico } = Database.getModels(req.database);
            await Medico.destroy({
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

    async estatistica(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const {
            medicos,
            postos,
            dataini,
            datafim,
            chkfmnc,
            consideraExamesInclusos,
            modelo,
        } = req.body;

        try {
            let select = `
                SELECT
                    ${modelo === 'data' ? 'MOVEXA.DTCOLETA,' : ''}
                    MOVEXA.MEDICO_ID,
                    MEDICO.NOME_MED,
                    MEDICO.CRM,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN MEDICO ON MEDICO.ID = MOVEXA.MEDICO_ID `;

            let where = ` WHERE`;
            if (consideraExamesInclusos === '0') {
                where += ` MOVEXA.EXAMEINC = 0 AND `;
            }

            if (chkfmnc === '1') {
                where += ` MOVEXA.STATUSEXM <> 'FM' AND
                    MOVEXA.STATUSEXM <> 'NC' AND `;
            }

            const periodo = `
                MOVEXA.DTCOLETA BETWEEN
                :dataInicial AND :dataFinal `;

            where += `
                MOVEXA.MEDICO_ID IN (:medicos) AND
                MOVEXA.POSTO IN (:postos)
                AND ${periodo}`;

            select += where;

            const groupBy = `
                GROUP BY ${modelo === 'data' ? 'MOVEXA.DTCOLETA,' : ''}
                    MOVEXA.MEDICO_ID,
                    MEDICO.NOME_MED,
                    MEDICO.CRM `;

            const orderBy = `
                ORDER BY
                ${modelo === 'data' ? 'MOVEXA.DTCOLETA,' : ''}
                    TOTPAC DESC `;

            const limit = ' LIMIT 100001';

            select += groupBy;
            select += orderBy;
            select += limit;

            const replacements = {
                postos,
                medicos,
                dataInicial: format(new Date(dataini), 'yyyy-MM-dd'),
                dataFinal: format(new Date(datafim), 'yyyy-MM-dd'),
            }

            const data = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
                replacements
            });

            if (data.length > 100000) {
                throw new RangeError('Quantidade de registros acima do limite');
            }

            let countQuery = `
                SELECT
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN MEDICO ON MEDICO.ID = MOVEXA.MEDICO_ID ${where}`

            const [total] = await Movexa.sequelize.query(countQuery, {
                type: QueryTypes.SELECT,
                replacements
            });


            return res.status(200).json({ data, total });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorio(req, res) {
        const { dados, profile, logo, color, dataini, datafim } = req.body;
        const { total } = dados.resto;

        const dadosTratados = [];

        if (dados.modelo === 'data') {
            dados.exames.forEach(dado => {
                let achou = false;
                const dataFormatada = format(
                    parseISO(dado.dtcoleta),
                    'dd/MM/yyyy'
                );
                dadosTratados.forEach(dadoTratado => {
                    if (dataFormatada === dadoTratado.dataDeColeta) {
                        achou = true;
                        dadoTratado.coletas.push({
                            nome: dado.nome_med,
                            crm: dado.crm,
                            quantidadePacientes: parseInt(dado.totpac),
                            quantidadeExames: parseInt(dado.totexa),
                        });
                        dadoTratado.totalDeExamesDia += parseInt(dado.totexa);
                        dadoTratado.totalDePacientesDia += parseInt(
                            dado.totpac
                        );
                    }
                });
                if (!achou) {
                    dadosTratados.push({
                        dataDeColeta: dataFormatada,
                        totalDeExamesDia: parseInt(dado.totexa),
                        totalDePacientesDia: parseInt(dado.totpac),
                        coletas: [
                            {
                                nome: dado.nome_med,
                                crm: dado.crm,
                                quantidadePacientes: parseInt(dado.totpac),
                                quantidadeExames: parseInt(dado.totexa),
                            },
                        ],
                    });
                }
            });
        } else {
            dadosTratados.push(...dados.exames);
        }

        const dadosTratadosMaisResumoGeral = {
            dadosTratados,
            resumoGeral: {
                totalGeralPacientes: total.totpac,
                totalGeralExames: total.totexa,
            },
        };

        try {
            const html = await gerarRelatorioHtml({
                model: `/estatisticas/medicos/${
                    dados.modelo === 'data' ? 'data' : 'geral'
                }`,
                data: {
                    registros: dadosTratadosMaisResumoGeral,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte
                },
                profile,
                logo,
                startDate: format(new Date(dataini), 'yyyy-MM-dd'),
                endDate: format(new Date(datafim), 'yyyy-MM-dd'),
                color: `#${color}`,
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Medico"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Medico"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Medico"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new MedicoController();
