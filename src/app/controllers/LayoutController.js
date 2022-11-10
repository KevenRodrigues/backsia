import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class LayoutController {
    async index(req, res) {
        try {
            const { Layout, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Layout"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Layout"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += LayoutController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = LayoutController.handleFilters(filter, filtervalue);
                }
            }

            const layouts = await Layout.findAll({
                order: Layout.sequelize.literal(`${order} ${orderdesc}`),
                where: Layout.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Layout.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const layouts_trim = layouts.map(layout => {
                layout.descricao = layout.descricao
                    ? layout.descricao.trim()
                    : '';
                return layout;
            });

            return res.status(200).json(layouts_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Layout,
                LayoutExame,
                Layoutparam,
                Layoutparamenv,
                Layoutparamsia,
                Motina,
                Material,
                Metodo,
                Exame,
            } = Database.getModels(req.database);
            const layouts = await Layout.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Metodo,
                        as: 'metodo',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Metodo,
                        as: 'metodo_env',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'codigo', 'descricao'],
                    },
                    {
                        model: LayoutExame,
                        as: 'layout_exame',
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['id', 'codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Layoutparam,
                        as: 'layout_param',
                    },
                    {
                        model: Layoutparamenv,
                        as: 'layout_param_env',
                    },
                    {
                        model: Layoutparamsia,
                        as: 'layout_param_sia',
                        include: [
                            {
                                model: Material,
                                as: 'material',
                                attributes: ['id', 'descricao'],
                            },
                            {
                                model: Metodo,
                                as: 'metodo',
                                attributes: ['id', 'descricao'],
                            },
                        ]
                    },
                ],
            });

            if (!layouts) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            layouts.descricao = layouts.descricao.trim();
            return res.status(200).json(layouts);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexLayoutsByExame(req, res) {
        try {
            const where = `( "Layout"."exame_id" = '${req.params.id}' OR "layout_exame"."exame_id" = '${req.params.id}' ) AND "Layout"."status" = 0`;
            const { Layout, LayoutExame, Metodo, Exame } = Database.getModels(
                req.database
            );
            const layouts = await Layout.findAll({
                where: Layout.sequelize.literal(where),
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'codigo', 'descricao', 'status'],
                    },
                    {
                        model: LayoutExame,
                        as: 'layout_exame',
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'id',
                                    'codigo',
                                    'descricao',
                                    'status',
                                ],
                            },
                        ],
                    },
                    {
                        model: Metodo,
                        as: 'metodo',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Metodo,
                        as: 'metodo_env',
                        attributes: ['id', 'descricao'],
                    },
                ],
            });

            if (!layouts) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            return res.status(200).json(layouts);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexLayoutsAlternativosByExame(req, res) {
        try {
            const where = ` "Examealt"."exame_id" = ${req.params.id}`;

            const {
                Examealt,
                Apoio,
                Layout,
                Exame,
                Material,
            } = Database.getModels(req.database);

            const layouts = await Examealt.findAll({
                where: Layout.sequelize.literal(where),
                attributes: {include:[['id', 'examealt_id']]},
                include: [
                    {
                        model: Apoio,
                        as: 'apoio',
                        attributes: ['razao'],
                    },
                    {
                        model: Layout,
                        as: 'layout',
                        attributes: [
                            'id',
                            'mascara',
                            'formula',
                            'ranger',
                            'usaranger',
                            'usarangertexto',
                            'formulaweb',
                            'usarangertexto',
                            ['descricao', 'desclayout'],
                        ],
                    },
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: [
                            ['id', 'exame_id'],
                            'codigo',
                            'descricao',
                            'status',
                        ],
                    },
                    {
                        model: Material,
                        as: 'material',
                        attributes: [['descricao', 'descmaterial']],
                    },
                ],
            });

            if (!layouts) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            return res.status(200).json(layouts);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const {
                Layout,
                LayoutExame,
                Layoutparam,
                Layoutparamenv,
                Layoutparamsia,
            } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                // razao: Yup.string()
                //     .transform(v => (v === null ? '' : v))
                //     .required('Campo razao obrigatorio'),
                // apoioexa: Yup.array().of(
                //     Yup.object().shape({
                //         exame_id: Yup.number()
                //             .transform(value =>
                //                 Number.isNaN(value) ? undefined : value
                //             )
                //             .required('Obrigatorio informar o exame.'),
                //     })
                // ),
                // apoiopos: Yup.array().of(
                //     Yup.object().shape({
                //         posto_id: Yup.number()
                //             .transform(value =>
                //                 Number.isNaN(value) ? undefined : value
                //             )
                //             .required('Obrigatorio informar o posto.'),
                //     })
                // ),
            });
            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            if (req.body.id) {
                const exame = await Layout.findByPk(req.body.id, {
                    include: [
                        { model: LayoutExame, as: 'layout_exame' },
                        { model: Layoutparam, as: 'layout_param' },
                        { model: Layoutparamenv, as: 'layout_param_env' },
                        { model: Layoutparamsia, as: 'layout_param_sia' },
                    ],
                });
                if (!exame) {
                    return res.status(400).json({
                        error: `Nenhum exame encontrado com este id ${req.body.id}`,
                    });
                }
                const layoutexameDelta = getDelta(
                    exame.layout_exame,
                    req.body.layout_exame
                );
                const layoutparamDelta = getDelta(
                    exame.layout_param,
                    req.body.layout_param
                );
                const layoutparamenvDelta = getDelta(
                    exame.layout_param_env,
                    req.body.layout_param_env
                );
                const layoutparamsiaDelta = getDelta(
                    exame.layout_param_sia,
                    req.body.layout_param_sia
                );
                await Layout.sequelize
                    .transaction(async transaction => {
                        // Update
                        await Promise.all([
                            layoutexameDelta.added.map(async examatmedD => {
                                await LayoutExame.create(examatmedD, {
                                    transaction,
                                }).catch(LayoutExame.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            layoutparamDelta.added.map(async examealtD => {
                                await Layoutparam.create(examealtD, {
                                    transaction,
                                }).catch(Layoutparam.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            layoutparamenvDelta.added.map(async exameincD => {
                                await Layoutparamenv.create(exameincD, {
                                    transaction,
                                }).catch(Layoutparamenv.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            layoutexameDelta.changed.map(
                                async layoutexameData => {
                                    const layoutexame = req.body.layout_exame.find(
                                        _layoutexame =>
                                            _layoutexame.id ===
                                            layoutexameData.id
                                    );
                                    await LayoutExame.update(layoutexame, {
                                        where: { id: layoutexame.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            layoutparamDelta.changed.map(
                                async layoutparamData => {
                                    const layoutparam = req.body.layout_param.find(
                                        _layoutparam =>
                                            _layoutparam.id ===
                                            layoutparamData.id
                                    );
                                    await Layoutparam.update(layoutparam, {
                                        where: { id: layoutparam.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            layoutparamenvDelta.changed.map(
                                async layoutparamenvData => {
                                    const layoutparamenv = req.body.layout_param_env.find(
                                        _layoutparamenv =>
                                            _layoutparamenv.id ===
                                            layoutparamenvData.id
                                    );
                                    await Layoutparamenv.update(
                                        layoutparamenv,
                                        {
                                            where: { id: layoutparamenv.id },
                                            transaction,
                                        }
                                    ).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            layoutexameDelta.deleted.map(
                                async layoutexameDel => {
                                    await layoutexameDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            layoutparamDelta.deleted.map(
                                async layoutparamDel => {
                                    await layoutparamDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            layoutparamenvDelta.deleted.map(
                                async layoutparamenvDel => {
                                    await layoutparamenvDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),

                            // LAYOUT SIA DELTA
                            layoutparamsiaDelta.added.map(async layoutSiaAdd => {
                                await Layoutparamsia.create(layoutSiaAdd, {
                                    transaction,
                                }).catch(Layoutparamsia.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            layoutparamsiaDelta.changed.map(
                                async layoutSiaChange => {
                                    const layoutparamsia = req.body.layout_param_sia.find(
                                        _layoutSiaChange =>
                                            _layoutSiaChange.id ===
                                            layoutSiaChange.id
                                    );
                                    await Layoutparamsia.update(
                                        layoutparamsia,
                                        {
                                            where: { id: layoutparamsia.id },
                                            transaction,
                                        }
                                    ).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            layoutparamsiaDelta.deleted.map(
                                async layoutSiaDel => {
                                    await layoutSiaDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                        ]);

                        await Layout.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                // Finally update apoio
                const { descricao, status } = req.body;
                return res.status(200).json({
                    descricao,
                    status,
                });
            }
            const { id, descricao, status } = await Layout.create(req.body, {
                include: [
                    { model: LayoutExame, as: 'layout_exame' },
                    { model: Layoutparam, as: 'layout_param' },
                    { model: Layoutparamenv, as: 'layout_param_env' },
                    { model: Layoutparamsia, as: 'layout_param_sia' },
                ],
            })
                .then(x => {
                    return Layout.findByPk(x.get('id'), {
                        include: [
                            { model: LayoutExame, as: 'layout_exame' },
                            { model: Layoutparam, as: 'layout_param' },
                            {
                                model: Layoutparamenv,
                                as: 'layout_param_env',
                            },
                            {
                                model: Layoutparamsia,
                                as: 'layout_param_sia',
                            },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            return res.status(200).json({
                id,
                descricao,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Layout } = Database.getModels(req.database);
            await Layout.destroy({
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
                filter = ` CAST("Layout"."id" AS TEXT) ILIKE '${filterValue}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Layout"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Layout"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new LayoutController();
