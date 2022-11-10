import * as Yup from 'yup';
import Database from '../../database';

class NivelController {
    async index(req, res) {
        try {
            const { Operador, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Operador"."nome",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Operador"."id" AS TEXT) LIKE '%${search.toUpperCase()}%') AND "Operador"."nivel" = 1`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += NivelController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = NivelController.handleFilters(filter, filtervalue);
                    if (where === '') {
                        where = `"Operador"."nivel" = 1`
                    }
                }
            }

            const operadores = await Operador.findAll({
                order: Operador.sequelize.literal(`${order} ${orderdesc}`),
                where: Operador.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'nome',
                    'status',
                    'idopera_ultacao',
                    [Operador.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const operadores_trim = operadores.map(operador => {
                    operador.nome = operador.nome.trim();
                    operador.motina.descricao = operador.motina.descricao.trim();
                    return operador;
                });
                return res.status(200).json(operadores_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Operador,
                Operador2,
                Operador3,
                Motina,
                Nivel,
            } = Database.getModels(req.database);
            const operadores = await Operador.findByPk(req.params.id, {
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    { model: Operador2, as: 'operador2' },
                    { model: Operador3, as: 'operador3' },
                    { model: Nivel, as: 'nivelope', attributes: ['nome'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!operadores) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                operadores.nome = operadores.nome ? operadores.nome.trim() : '';
                operadores.motina.descricao = operadores.motina.descricao
                    ? operadores.motina.descricao.trim()
                    : '';

                return res.status(200).json(operadores);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Operador, Operador2, Operador3 } = Database.getModels(
                req.database
            );
            const schema = Yup.object().shape({
                // descricao: Yup.string()
                //     .transform(v => (v === null ? '' : v))
                //     .required('Campo descricao obrigatorio'),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const operador = await Operador.findByPk(req.body.id, {
                    include: [
                        {
                            model: Operador2,
                            as: 'operador2',
                        },
                        {
                            model: Operador3,
                            as: 'operador3',
                        },
                    ],
                });

                if (!operador) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                await Operador.sequelize.transaction(async t => {
                    await Operador.update(
                        req.body,
                        {
                            where: { id: req.body.id },
                        },
                        { transaction: t }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await Operador2.update(
                        req.body.operador2,
                        {
                            where: { id: req.body.operador2.id },
                        },
                        { transaction: t }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await Operador3.update(
                        req.body.operador3,
                        {
                            where: { id: req.body.operador3.id },
                        },
                        { transaction: t }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
                });

                return res.status(200).json(operador);
            }
            const where = `(Unaccent(upper(trim(coalesce("Operador"."nome",'')))) = Unaccent(trim('${req.body.nome.toUpperCase()}'))) AND "Operador"."nivel" = 1`;

            const validaLogin = await Operador.findAll({
                where: Operador.sequelize.literal(where),
            });

            if (validaLogin.length > 0) {
                return res.status(400).json({
                    error: `Login jÃ¡ cadastrado, tente novamente!`,
                });
            }

            const operador = await Operador.create(req.body, {
                include: [
                    { model: Operador2, as: 'operador2' },
                    { model: Operador3, as: 'operador3' },
                ],
            })
                .then(x => {
                    return Operador.findByPk(x.get('id'), {
                        include: [
                            { model: Operador2, as: 'operador2' },
                            { model: Operador3, as: 'operador3' },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(operador);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Nivel, Operador } = Database.getModels(req.database);
            const getNivope = await Operador.findAll({
                where: { nivope: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (getNivope.length > 0) {
                return res.status(400).json({
                    error:
                        'Não foi possível excluir, existem Operadores associados a este nível.',
                });
            }

            await Nivel.destroy({
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
        return null;
    }

    async nivelOne(req, res) {
        const { id } = req.params;
        try {
            const { Operador, Operador2, Operador3 } = Database.getModels(
                req.database
            );

            const nivel = await Operador.findOne({
                where: { id },
                attributes: {
                    include: [['id', 'nivope']],
                    exclude: [
                        'id',
                        'nome',
                        'senope',
                        'nivel',
                        'nivope',
                        'status',
                    ],
                },
                include: [
                    {
                        model: Operador2,
                        as: 'operador2',
                        attributes: {
                            exclude: ['id', 'operador_id'],
                        },
                    },
                    {
                        model: Operador3,
                        as: 'operador3',
                        attributes: {
                            exclude: ['id', 'operador_id'],
                        },
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json(nivel);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = `CAST("Operador"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%' AND "Operador"."nivel" = 1`;
                break;
            case 'ativos':
                filter = `"Operador"."nivel" = 1 AND "Operador"."status" = 0`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Operador"."descricao" AS TEXT) ILIKE '%${filterValue}%' AND "Operador"."nivel" = 1`;
                }
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}' AND "Operador"."nivel" = 1`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Operador"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%') AND "Operador"."nivel" = 1) `)
                    : null;
        }

        return filter;
    }
}

export default new NivelController();
