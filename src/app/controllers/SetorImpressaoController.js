import Database from '../../database';

class SetorImpressaoController {
    async index(req, res) {
        try {
            const { SetorImpressao, Motina } = Database.getModels(req.database);
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
                where += ` (Unaccent(upper(trim(coalesce("SetorImpressao"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("SetorImpressao"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += SetorImpressaoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = SetorImpressaoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const setores = await SetorImpressao.findAll({
                attributes: {
                    include: [
                        ['id', 'setor_id'],
                        ['id', 'codigo'],
                        [
                            SetorImpressao.sequelize.literal(
                                'count(*) OVER ()'
                            ),
                            'total',
                        ],
                    ],
                },
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
                order: SetorImpressao.sequelize.literal(
                    `${order} ${orderdesc}`
                ),
                where: SetorImpressao.sequelize.literal(where),
                limit,
                offset: (page - 1) * limit,
            });

            const setoresTrim = setores.map(item => {
                return item;
            });

            return res.status(200).json(setoresTrim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                SetorImpressao,
                SetorFila,
                Posto,
                Motina,
            } = Database.getModels(req.database);

            const setor = await SetorImpressao.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Posto,
                    },
                    {
                        model: SetorFila,
                    },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
            });

            setor.lptloccomp = setor.lptloccomp ? setor.lptloccomp.trim() : null;
            setor.lptcomp = setor.lptcomp ? setor.lptcomp.trim() : null;
            setor.lptlocetq = setor.lptlocetq ? setor.lptlocetq.trim() : null;
            setor.lptetqlbx = setor.lptetqlbx ? setor.lptetqlbx.trim() : null;

            return res.status(200).json(setor);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { SetorImpressao } = Database.getModels(req.database);

            const setorImpressaoData = {
                ...req.body,
                idopera_ultacao: req.userId,
            };

            // return res.status(200).json(setorImpressaoData);

            if (req.params.id) {
                const existeSetorImpressao = await SetorImpressao.findByPk(
                    req.params.id
                ).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (!existeSetorImpressao) {
                    return res.status(400).json({
                        error: `Setor de Impressão com código ${req.params.id} não encontrado`,
                    });
                }

                delete setorImpressaoData.id;

                await SetorImpressao.sequelize.transaction(
                    async transaction => {
                        await SetorImpressao.update(setorImpressaoData, {
                            where: { id: req.params.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                );

                return res.status(200).json(setorImpressaoData);
            }

            await SetorImpressao.create(setorImpressaoData).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(setorImpressaoData);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { SetorImpressao } = Database.getModels(req.database);

            await SetorImpressao.destroy({
                where: {
                    id: req.params.id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                message: 'Setor de impressão deletado com sucesso.',
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async updateSetorImpressaoOperador(req, res) {
        try {
            const { Operador3 } = Database.getModels(req.database);

            const postData = {
                setorimpressao_id: req.params.id,
                idopera_ultacao: req.userId,
            };

            await Operador3.sequelize.transaction(async transaction => {
                await Operador3.update(postData, {
                    where: { operador_id: req.userId },
                    transaction,
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            });

            return res.status(200).json(postData);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter += ` CAST("SetorImpressao"."id" AS TEXT) ILIKE '${filterValue}%' `;
                break;
            case 'setor_id':
                filter += ` CAST("SetorImpressao"."id" AS TEXT) ILIKE '${filterValue}%' `;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("SetorImpressao"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'maquina':
                if (filterValue !== null) {
                    filter += ` CAST("SetorImpressao"."maquina" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("SetorImpressao"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new SetorImpressaoController();
