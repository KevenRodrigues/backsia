import * as Yup from 'yup';
import Database from '../../database';

class FiltroController {
    async index(req, res) {
        try {
            const { Filtro, Motina } = Database.getModels(req.database);
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

                        where += FiltroController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = FiltroController.handleFilters(filter, filtervalue);
                }
            }

            const filtros = await Filtro.findAll({
                order: Filtro.sequelize.literal(`${order} ${orderdesc}`),
                where: Filtro.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'cursor',
                    'filtro',
                    'status',
                    'idopera_ultacao',
                    [Filtro.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const filtros_trim = filtros.map(filtro => {
                    filtro.descricao = filtro.descricao
                        ? filtro.descricao.trim()
                        : null;
                    filtro.cursor = filtro.cursor ? filtro.cursor.trim() : null;
                    filtro.motina.descricao = filtro.motina
                        ? filtro.motina.descricao.trim()
                        : null;
                    return filtro;
                });
                return res.status(200).json(filtros_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Filtro, Motina } = Database.getModels(req.database);
            const filtros = await Filtro.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'cursor',
                    'filtro',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!filtros) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                filtros.descricao = filtros.descricao
                    ? filtros.descricao.trim()
                    : '';
                filtros.motina.descricao = filtros.motina.descricao
                    ? filtros.motina.descricao.trim()
                    : '';

                return res.status(200).json(filtros);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Filtro } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                cursor: Yup.string()
                    .required()
                    .max(20),
                filtro: Yup.string()
                    .required()
                    .max(50),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const {
                id,
                descricao,
                status,
                cursor,
                filtro,
            } = await Filtro.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                cursor,
                filtro,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Filtro } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                cursor: Yup.string().max(20),
                filtro: Yup.string().max(50),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const filtroExists = await Filtro.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            await Filtro.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        cursor: data[1].cursor,
                        filtro: data[1].filtro,
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
            const { Filtro } = Database.getModels(req.database);
            await Filtro.destroy({
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
            case 'id':
                filter = ` CAST("Filtro"."id" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Filtro"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Filtro"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new FiltroController();
