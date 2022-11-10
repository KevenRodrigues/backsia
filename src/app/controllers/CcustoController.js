import Database from '../../database';
import getDelta from '../utils/getDelta';

class CcustoController {
    async index(req, res) {
        const { Ccusto, Motina } = Database.getModels(req.database);
        try {
            const { page = 1, limit = 10 } = req.query;

            const order =
                req.query.sortby !== '' && req.query.sortby !== undefined
                    ? req.query.sortby
                    : 'id';
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
                where = ` (Unaccent(upper(trim(coalesce("Ccusto"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Ccusto"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += CcustoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = CcustoController.handleFilters(filter, filtervalue);
                }
            }

            const pagar = await Ccusto.findAll({
                order: Ccusto.sequelize.literal(`${order} ${orderdesc}`),
                where: Ccusto.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    [Ccusto.sequelize.literal('count(*) OVER ()'), 'total'],
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

            return res.status(200).json(pagar);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Ccusto, Motina, Plcontas, Ccusto1 } = Database.getModels(
                req.database
            );
            const centroCusto = await Ccusto.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'descricao',
                    'ordem',
                    'status',
                    'pl_contas_id',
                    'novabusca',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontas',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                    {
                        model: Ccusto1,
                        as: 'ccusto1',
                        attributes: [
                            'id',
                            'ccusto_id',
                            'pl_contas_id',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Plcontas,
                                as: 'plcontas',
                                attributes: [
                                    'id',
                                    'fx1',
                                    'fx2',
                                    'fx3',
                                    'fx4',
                                    'descricao',
                                ],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!centroCusto) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum plano de contas encontrado ' });
            }

            return res.status(200).json(centroCusto);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createOrUpdate(req, res) {
        try {
            const { Ccusto, Ccusto1 } = Database.getModels(req.database);
            const data = req.body;
            const novaBusca = data.novabusca ? 1 : 0;

            if (data.id) {
                const centroCustoExists = await Ccusto.findByPk(data.id, {
                    include: [{ model: Ccusto1, as: 'ccusto1' }],
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (!centroCustoExists) {
                    return res.status(400).json({
                        error: `Conta Bancária com código ${data.id} não existe`,
                    });
                }

                const centroCustoDelta = getDelta(
                    centroCustoExists.ccusto1,
                    data.planoContas
                );

                const centroCustoData = {
                    descricao: data.descricao ? data.descricao : null,
                    ordem: data.ordem ? data.ordem : null,
                    pl_contas_id: data.pl_contas_id ? data.pl_contas_id : null,
                    novabusca: novaBusca,
                    status: data.status,
                    idopera_ultacao: data.idopera_ultacao
                        ? data.idopera_ultacao
                        : null,
                    ccusto1: data.planoContas ? data.planoContas : null,
                };

                await Ccusto.sequelize
                    .transaction(async transaction => {
                        // Update ccusto1
                        await Promise.all([
                            centroCustoDelta.added.map(async ccustoDelta => {
                                await Ccusto1.create(ccustoDelta, {
                                    transaction,
                                }).catch(Ccusto.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            centroCustoDelta.changed.map(async ccustoData => {
                                const ccusto1 = data.planoContas.find(
                                    centroCusto =>
                                        centroCusto.id === ccustoData.id
                                );
                                await Ccusto1.update(ccusto1, {
                                    where: { id: ccusto1.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            centroCustoDelta.deleted.map(async ccustoDelete => {
                                await ccustoDelete
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Ccusto.update(centroCustoData, {
                            where: { id: data.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(centroCustoData);
            }

            const centroCusto = {
                descricao: data.descricao ? data.descricao : null,
                ordem: data.ordem ? data.ordem : null,
                pl_contas_id: data.pl_contas_id ? data.pl_contas_id : null,
                novabusca: novaBusca,
                status: data.status,
                idopera_ultacao: data.idopera_ultacao
                    ? data.idopera_ultacao
                    : null,
                ccusto1: data.planoContas ? data.planoContas : null,
            };

            await Ccusto.create(centroCusto, {
                include: [{ model: Ccusto1, as: 'ccusto1' }],
            })
                .then(x => {
                    return Ccusto.findByPk(x.get('id'), {
                        include: [{ model: Ccusto1, as: 'ccusto1' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(centroCusto);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Ccusto } = Database.getModels(req.database);

            await Ccusto.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res.status(200).json({
                            message: 'Centro de Custo deletado com sucesso.',
                        });
                    }
                    return res.status(400).json({
                        error: `Não foi possível deletar o Centro de Custo ${req.params.id}`,
                    });
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
            case 'id':
                filter += ` CAST("Ccusto"."id" AS TEXT) ILIKE '${filterValue}%'`;
                break;
            case 'descricao':
                filter += ` (Unaccent(upper(trim(coalesce("Ccusto"."descricao",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Ccusto"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new CcustoController();
