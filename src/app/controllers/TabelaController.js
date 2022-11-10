import * as Yup from 'yup';
import Database from '../../database';

class TabelaController {
    async index(req, res) {
        try {
            const { Tabela, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Tabela"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Tabela"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += TabelaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = TabelaController.handleFilters(filter, filtervalue);
                }
            }

            const tabelas = await Tabela.findAll({
                order: Tabela.sequelize.literal(`${order} ${orderdesc}`),
                where: Tabela.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Tabela.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const tabelas_trim = tabelas.map(tabela => {
                    tabela.descricao = tabela.descricao
                        ? tabela.descricao.trim()
                        : null;
                    tabela.motina
                        ? (tabela.motina.descricao = tabela.motina.descricao.trim())
                        : null;
                    return tabela;
                });
                return res.status(200).json(tabelas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Tabela, Motina } = Database.getModels(req.database);
            const tabelas = await Tabela.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'depara',
                    'depara3',
                    'status',
                    'idopera_ultacao',
                    'inc_tabela1',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!tabelas) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                tabelas.descricao = tabelas.descricao
                    ? tabelas.descricao.trim()
                    : '';
                tabelas.depara = tabelas.depara ? tabelas.depara.trim() : '';
                tabelas.depara3 = tabelas.depara3 ? tabelas.depara3.trim() : '';
                tabelas.motina.descricao = tabelas.motina.descricao
                    ? tabelas.motina.descricao.trim()
                    : '';

                return res.status(200).json(tabelas);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexTable(req, res) {
        try {
            const { Tabela1, Exame } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            let where = '';

            switch (filter) {
                case 'exame_id':
                    where = `CAST("Tabela1"."exame_id" AS TEXT) LIKE '%${filtervalue}%' AND CAST("Tabela1"."tabela_id" AS TEXT) = '${req.params.tabela_id}'`;
                    break;
                case 'exame.descricao':
                    where = `(Unaccent(upper(trim(coalesce("exame"."descricao",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%') AND CAST("Tabela1"."tabela_id" AS TEXT) = '${
                        req.params.tabela_id
                    }')`;
                    break;
                default:
                    filter !== ''
                        ? (where = `(Unaccent(upper(trim(coalesce("Tabela1"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%') AND CAST("Tabela1"."tabela_id" AS TEXT) = '${
                              req.params.tabela_id
                          }')`)
                        : (where = `CAST("Tabela1"."tabela_id" AS TEXT) = '${req.params.tabela_id}'`);
            }

            const tabelas = await Tabela1.findAll({
                order: Tabela1.sequelize.literal(`${order} ${orderdesc}`),
                where: Tabela1.sequelize.literal(where),
                attributes: [
                    'id',
                    'exame_id',
                    'valorexa',
                    'codamb',
                    'peso_porte',
                    'peso_uco',
                    [Tabela1.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const tabelas_trim = tabelas.map(tabela => {
                    tabela.exame.descricao = tabela.exame.descricao
                        ? tabela.exame.descricao.trim()
                        : '';
                    tabela.codamb = tabela.codamb ? tabela.codamb.trim() : '';
                    return tabela;
                });
                return res.status(200).json(tabelas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexTableExameId(req, res) {
        try {
            const { Tabela, Tabela1, Exame } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            let where = '';

            switch (filter) {
                case 'exame_id':
                    where = `CAST("Tabela1"."exame_id" AS TEXT) LIKE '%${filtervalue}%' AND CAST("Tabela1"."tabela_id" AS TEXT) = '${req.params.tabela_id}'`;
                    break;
                case 'exame.descricao':
                    where = `(Unaccent(upper(trim(coalesce("exame"."descricao",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%') AND CAST("Tabela1"."tabela_id" AS TEXT) = '${
                        req.params.tabela_id
                    }')`;
                    break;
                default:
                    filter !== ''
                        ? (where = `(Unaccent(upper(trim(coalesce("Tabela1"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%') AND CAST("Tabela1"."tabela_id" AS TEXT) = '${
                              req.params.tabela_id
                          }')`)
                        : (where = `CAST("Tabela1"."exame_id" AS TEXT) = '${req.params.exameid}'`);
            }

            const tabelas = await Tabela1.findAll({
                order: Tabela1.sequelize.literal(`${order} ${orderdesc}`),
                where: Tabela1.sequelize.literal(where),
                attributes: [
                    'id',
                    'tabela_id',
                    'exame_id',
                    'valorexa',
                    'codamb',
                    'peso_porte',
                    'peso_uco',
                    [Tabela1.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'descricao'],
                    },
                    {
                        model: Tabela,
                        as: 'tabela',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const tabelas_trim = tabelas.map(tabela => {
                    tabela.exame.descricao = tabela.exame.descricao.trim();
                    tabela.codamb = tabela.codamb ? tabela.codamb.trim() : '';
                    return tabela;
                });
                return res.status(200).json(tabelas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexTableReport(req, res) {
        try {
            const { Tabela, Tabela1, Exame } = Database.getModels(req.database);
            const tabelas = await Tabela1.findAll({
                where: { tabela_id: req.params.tabela_id },
                order: Tabela1.sequelize.literal(
                    `trim(coalesce(exame.descricao,''))`
                ),
                attributes: [
                    'id',
                    'exame_id',
                    'valorexa',
                    'codamb',
                    'peso_porte',
                    'peso_uco',
                    [Tabela1.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: [
                            'codigo',
                            [
                                Exame.sequelize.literal(
                                    `trim(coalesce(exame.descricao,''))`
                                ),
                                'descricao',
                            ],
                        ],
                    },
                    {
                        model: Tabela,
                        as: 'tabela',
                        attributes: [
                            'id',
                            [
                                Tabela.sequelize.literal(
                                    `trim(coalesce(tabela.descricao,''))`
                                ),
                                'descricao',
                            ],
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const tabelas_trim = tabelas.map(tabela => {
                    tabela.descricao = tabela.descricao
                        ? tabela.descricao.trim()
                        : '';
                    return tabela;
                });
                return res.status(200).json(tabelas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Tabela } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const {
                id,
                descricao,
                depara,
                depara3,
                status,
            } = await Tabela.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                depara,
                depara3,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Tabela } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const tabelaExists = await Tabela.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!tabelaExists) {
                return res
                    .status(400)
                    .json({ error: 'Tabela não encontrado!' });
            }

            await Tabela.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
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
            const { Tabela } = Database.getModels(req.database);
            await Tabela.destroy({
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
                filter = ` CAST("Tabela"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Tabela"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Tabela"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new TabelaController();
