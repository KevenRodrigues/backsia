import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class EqpController {
    async index(req, res) {
        try {
            const { Eqp, Motina } = Database.getModels(req.database);
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

                        where += EqpController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = EqpController.handleFilters(filter, filtervalue);
                }
            }

            const eqps = await Eqp.findAll({
                order: Eqp.sequelize.literal(`${order} ${orderdesc}`),
                where: Eqp.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Eqp.sequelize.literal('count(*) OVER ()'), 'total'],
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

            const eqps_trim = eqps.map(eqp => {
                eqp.descricao = eqp.descricao.trim();
                eqp.motina.descricao = eqp.motina.descricao.trim();
                return eqp;
            });

            return res.status(200).json(eqps_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Eqp, Eqpexa, Exame, Layout, Motina } = Database.getModels(
                req.database
            );
            const eqp = await Eqp.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'nome',
                    'dirtxt',
                    'amostrainter',
                    'dirresul',
                    'dirresulbkp',
                    'maquina',
                    'postos',
                    'extensao_mtx_eqp',
                    'dirgraficohexa',
                    'tp_arqinter_eqp',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Eqpexa,
                        as: 'eqpexa',
                        attributes: [
                            'id',
                            'eqp_id',
                            'exame_id',
                            'layout_id',
                            'status',
                            'envant',
                            'ishemog',
                            'isatb',
                            'nomeexaeqp',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                            {
                                model: Layout,
                                as: 'layout',
                                attributes: ['id', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!eqp) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            eqp.descricao = eqp.descricao.trim();
            eqp.eqpexa.map(eqpexa => {
                if (eqpexa.exame) {
                    eqpexa.exame.codigo = eqpexa.exame.codigo.trim();
                    eqpexa.exame.descricao = eqpexa.exame.descricao.trim();
                }
                return eqpexa;
            });
            return res.status(200).json(eqp);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Eqp, Eqpexa } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo descricao obrigatorio'),
                eqpexa: Yup.array().of(
                    Yup.object().shape({
                        exame_id: Yup.number()
                            .transform(value =>
                                Number.isNaN(value) ? undefined : value
                            )
                            .required('Obrigatorio informar o exame.'),
                    })
                ),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const eqp = await Eqp.findByPk(req.body.id, {
                    include: [{ model: Eqpexa, as: 'eqpexa' }],
                });

                if (!eqp) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const eqpexaDelta = getDelta(eqp.eqpexa, req.body.eqpexa);
                await Eqp.sequelize
                    .transaction(async transaction => {
                        // Update eqpexa
                        await Promise.all([
                            eqpexaDelta.added.map(async eqpexaD => {
                                await Eqpexa.create(eqpexaD, {
                                    transaction,
                                }).catch(Eqp.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            eqpexaDelta.changed.map(async eqpexaData => {
                                const eqpexa = req.body.eqpexa.find(
                                    _eqpexa => _eqpexa.id === eqpexaData.id
                                );
                                await Eqpexa.update(eqpexa, {
                                    where: { id: eqpexa.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            eqpexaDelta.deleted.map(async eqpexaDel => {
                                await eqpexaDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Eqp.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                // Finally update eqp
                const { descricao, status, eqpexa } = req.body;
                return res.status(200).json({
                    descricao,
                    status,
                    eqpexa,
                });
            }
            const { id, descricao, status, eqpexa } = await Eqp.create(
                req.body,
                {
                    include: [{ model: Eqpexa, as: 'eqpexa' }],
                }
            )
                .then(x => {
                    return Eqp.findByPk(x.get('id'), {
                        include: [{ model: Eqpexa, as: 'eqpexa' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                descricao,
                status,
                eqpexa,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Eqp } = Database.getModels(req.database);
            await Eqp.destroy({
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

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Eqp"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Eqp"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Eqp"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new EqpController();
