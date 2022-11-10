import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class QuestaoController {
    async index(req, res) {
        try {
            const { Questao, Motina } = Database.getModels(req.database);
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

                        where += QuestaoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = QuestaoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const questoes = await Questao.findAll({
                order: Questao.sequelize.literal(`${order} ${orderdesc}`),
                where: Questao.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Questao.sequelize.literal('count(*) OVER ()'), 'total'],
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

            const questoes_trim = questoes.map(questao => {
                questao.descricao = questao.descricao.trim();
                questao.motina.descricao = questao.motina.descricao.trim();
                return questao;
            });

            return res.status(200).json(questoes_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Questao, Questaoexa, Exame } = Database.getModels(
                req.database
            );
            const questao = await Questao.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'descricao',
                    'obriga',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Questaoexa,
                        as: 'questaoexa',
                        attributes: ['id', 'questao_id', 'exame_id'],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!questao) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            questao.descricao = questao.descricao.trim();
            questao.questaoexa.map(questaoexa => {
                if (questaoexa.exame) {
                    questaoexa.exame.codigo = questaoexa.exame.codigo.trim();
                    questaoexa.exame.descricao = questaoexa.exame.descricao.trim();
                }
                return questaoexa;
            });
            return res.status(200).json(questao);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Questao, Questaoexa } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo descricao obrigatorio'),
                questaoexa: Yup.array().of(
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
                const questao = await Questao.findByPk(req.body.id, {
                    include: [{ model: Questaoexa, as: 'questaoexa' }],
                });

                if (!questao) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const questaoexaDelta = getDelta(
                    questao.questaoexa,
                    req.body.questaoexa
                );
                await Questao.sequelize
                    .transaction(async transaction => {
                        // Update questaoexa
                        await Promise.all([
                            questaoexaDelta.added.map(async questaoexaD => {
                                await Questaoexa.create(questaoexaD, {
                                    transaction,
                                }).catch(Questao.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            questaoexaDelta.changed.map(
                                async questaoexaData => {
                                    const questaoexa = req.body.questaoexa.find(
                                        _questaoexa =>
                                            _questaoexa.id === questaoexaData.id
                                    );
                                    await Questaoexa.update(questaoexa, {
                                        where: { id: questaoexa.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            questaoexaDelta.deleted.map(async questaoexaDel => {
                                await questaoexaDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Questao.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                // Finally update questao
                const { descricao, status, questaoexa } = req.body;

                return res.status(200).json({
                    descricao,
                    status,
                    questaoexa,
                });
            }
            const { id, descricao, status, questaoexa } = await Questao.create(
                req.body,
                {
                    include: [{ model: Questaoexa, as: 'questaoexa' }],
                }
            )
                .then(x => {
                    return Questao.findByPk(x.get('id'), {
                        include: [{ model: Questaoexa, as: 'questaoexa' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                descricao,
                status,
                questaoexa,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Questao } = Database.getModels(req.database);
            await Questao.destroy({
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
                filter = ` CAST("Questao"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Questao"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Questao"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new QuestaoController();
