import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class LinhaController {
    async index(req, res) {
        try {
            const { Linha, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Linha"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Linha"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += LinhaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = LinhaController.handleFilters(filter, filtervalue);
                }
            }

            const linhas = await Linha.findAll({
                order: Linha.sequelize.literal(`${order} ${orderdesc}`),
                where: Linha.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Linha.sequelize.literal('count(*) OVER ()'), 'total'],
                    [
                        Linha.sequelize.literal(
                            ' (select count(linha_id) AS "totalcustofixo" from linhacusto where linha_id = "Linha"."id" group by linha_id order by linha_id) '
                        ),
                        'totalcustofixo',
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

            const linhas_trim = linhas.map(linha => {
                linha.descricao = linha.descricao.trim();
                linha.motina.descricao = linha.motina.descricao.trim();
                return linha;
            });

            return res.status(200).json(linhas_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Linha, Linhacusto, Motina } = Database.getModels(
                req.database
            );
            const linha = await Linha.findOne({
                where: { id: req.params.id },
                attributes: ['id', 'descricao', 'status', 'idopera_ultacao'],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Linhacusto,
                        as: 'linhacusto',
                        attributes: ['id', 'linha_id', 'descricao', 'valor'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!linha) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            linha.descricao = linha.descricao.trim();
            linha.motina.descricao = linha.motina.descricao
                ? linha.motina.descricao.trim()
                : '';

            linha.linhacusto.map(linhacusto => {
                if (linhacusto.descricao) {
                    linhacusto.descricao = linhacusto.descricao.trim();
                }
                return linhacusto;
            });

            return res.status(200).json(linha);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Linha, Linhacusto } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo descricao obrigatorio'),
                status: Yup.number().required('Campo descricao obrigatorio'),
                // linhacusto: Yup.array().of(
                //     Yup.object().shape({
                //         exame_id: Yup.number()
                //             .transform(value =>
                //                 Number.isNaN(value) ? undefined : value
                //             )
                //             .required('Obrigatorio informar o exame.'),
                //     })
                // ),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const linha = await Linha.findByPk(req.body.id, {
                    include: [{ model: Linhacusto, as: 'linhacusto' }],
                });

                if (!linha) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const linhaDelta = getDelta(
                    linha.linhacusto,
                    req.body.linhacusto
                );
                await Linha.sequelize
                    .transaction(async transaction => {
                        // Update linhacusto
                        await Promise.all([
                            linhaDelta.added.map(async linhacustoD => {
                                await Linhacusto.create(linhacustoD, {
                                    transaction,
                                }).catch(Linha.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            linhaDelta.changed.map(async linhacustoData => {
                                const linhacusto = req.body.linhacusto.find(
                                    _linhacusto =>
                                        _linhacusto.id === linhacustoData.id
                                );
                                await Linhacusto.update(linhacusto, {
                                    where: { id: linhacusto.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            linhaDelta.deleted.map(async linhacustoDel => {
                                await linhacustoDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Linha.update(req.body, {
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
                const { descricao, status, linhacusto } = req.body;

                return res.status(200).json({
                    descricao,
                    status,
                    linhacusto,
                });
            }
            const { id, descricao, status, linhacusto } = await Linha.create(
                req.body,
                {
                    include: [{ model: Linhacusto, as: 'linhacusto' }],
                }
            )
                .then(x => {
                    return Linha.findByPk(x.get('id'), {
                        include: [{ model: Linhacusto, as: 'linhacusto' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                descricao,
                status,
                linhacusto,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Linha } = Database.getModels(req.database);
            await Linha.destroy({
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
                filter = ` CAST("Linha"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Linha"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Linha"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new LinhaController();
