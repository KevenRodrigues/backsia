import Database from '../../database';

class PlcontasController {
    async index(req, res) {
        const { Plcontas, Motina } = Database.getModels(req.database);
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

            const isSintetico = req.query.isSintetico
                ? req.query.isSintetico
                : null;

            const isAnalitico = req.query.isAnalitico
                ? req.query.isAnalitico
                : null;

            let where = '';

            if (isSintetico) {
                where += ` "Plcontas"."tp_pl" = 2`;
            } else if (isAnalitico) {
                where += ` "Plcontas"."tp_pl" = 1`;
            } else if (req.query.search && req.query.search.length > 0) {
                where += ` (Unaccent(upper(trim(coalesce("Plcontas"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Plcontas"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += PlcontasController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = PlcontasController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            let response = await Plcontas.findAll({
                attributes: [
                    'id',
                    'fx1',
                    'fx2',
                    'fx3',
                    'fx4',
                    'descricao',
                    'status',
                    'tp_mov',
                    'tp_pl',
                    'status',
                    [Plcontas.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
                where: Plcontas.sequelize.literal(where),
                order: Plcontas.sequelize.literal(`${order} ${orderdesc}`),
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const planosContas = [];
            let tipoMovimentacao = '';
            let tipoPlanoContas = '';

            response = JSON.parse(JSON.stringify(response));

            response.map(planoContas => {
                const codigoParsed = `${planoContas.fx1}.${planoContas.fx2}.${planoContas.fx3}.${planoContas.fx4}`;

                if (planoContas.tp_mov === '1') {
                    tipoMovimentacao = 'Entrada';
                } else if (planoContas.tp_mov === '2') {
                    tipoMovimentacao = 'Saída';
                }

                if (planoContas.tp_pl === '1') {
                    tipoPlanoContas = 'Analítica';
                } else if (planoContas.tp_pl === '2') {
                    tipoPlanoContas = 'Sintética';
                }

                planosContas.push({
                    ...planoContas,
                    codigoParsed,
                    tipoMovimentacao,
                    tipoPlanoContas,
                });
            });

            return res.status(200).json(planosContas);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Plcontas, Motina } = Database.getModels(req.database);
            const planoContas = await Plcontas.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'descricao',
                    'fx1',
                    'fx2',
                    'fx3',
                    'fx4',
                    'tp_mov',
                    'tp_pl',
                    'status',
                ],
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

            if (!planoContas) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum plano de contas encontrado ' });
            }

            return res.status(200).json(planoContas);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createOrUpdate(req, res) {
        try {
            const { Plcontas } = Database.getModels(req.database);

            const data = req.body;
            const codigo = data.codigo.split('.');

            const planoContas = {
                descricao: data.descricao ? data.descricao : null,
                fx1: codigo[0] ? codigo[0] : null,
                fx2: codigo[1] ? codigo[1] : null,
                fx3: codigo[2] ? codigo[2] : null,
                fx4: codigo[3] ? codigo[3] : null,
                status: data.status,
                idopera_ultacao: data.idopera_ultacao,
                tp_mov: data.tp_mov === 'entrada' ? 1 : 2,
                tp_pl: data.tp_pl === 'analitica' ? 1 : 2,
            };

            // Update the chosed chart of accounts.
            if (data.id) {
                const chartAccountsExists = await Plcontas.findByPk(
                    req.body.id
                ).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (!chartAccountsExists) {
                    return res.status(400).json({
                        error: `Plano de Contas com código ${req.body.id} não encontrado`,
                    });
                }

                await Plcontas.sequelize
                    .transaction(async transaction => {
                        await Plcontas.update(planoContas, {
                            where: { id: data.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        return res.status(200).json(planoContas);
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(planoContas);
            }

            // Create a new chart of accounts.
            await Plcontas.create(planoContas);

            return res.status(200).json(planoContas);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Plcontas } = Database.getModels(req.database);
            await Plcontas.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res.status(200).json({
                            message: 'Plano de Contas deletado com sucesso.',
                        });
                    }
                    return res.status(400).json({
                        error: `Não foi possível deletar o Plano de contas ${req.params.id}`,
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
            case 'codigoParsed':
                // eslint-disable-next-line no-case-declarations
                const fxs = filterValue
                    .split('_')
                    .join('')
                    .split('.');

                if (fxs[0])
                    filter += ` CAST("Plcontas"."fx1" AS TEXT) LIKE '${fxs[0]}'`;
                if (fxs[1])
                    filter += ` AND CAST("Plcontas"."fx2" AS TEXT) LIKE '${fxs[1]}'`;
                if (fxs[2])
                    filter += ` AND CAST("Plcontas"."fx3" AS TEXT) LIKE '${fxs[2]}'`;
                if (fxs[3])
                    filter += ` AND CAST("Plcontas"."fx4" AS TEXT) LIKE '${fxs[3]}'`;

                break;
            case 'tp_mov':
                if (filterValue !== null && filterValue !== 'todos') {
                    filter += ` CAST("Plcontas"."tp_mov" AS TEXT) = '${filterValue}'`;
                }
                break;
            case 'tp_pl':
                if (filterValue !== null && filterValue !== 'todos') {
                    filter += ` CAST("Plcontas"."tp_pl" AS TEXT) = '${filterValue}'`;
                }
                break;
            case 'id':
                filter += ` CAST("Plcontas"."id" AS TEXT) ILIKE '${filterValue}%'`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Plcontas"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new PlcontasController();
