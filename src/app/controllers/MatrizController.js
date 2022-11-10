import * as Yup from 'yup';
import Database from '../../database';

class MatrizController {
    async index(req, res) {
        try {
            const { Matriz, Motina, Layout } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Matriz"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Matriz"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += MatrizController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = MatrizController.handleFilters(filter, filtervalue);
                }
            }

            const matrizs = await Matriz.findAll({
                order: Matriz.sequelize.literal(`${order} ${orderdesc}`),
                where: Matriz.sequelize.literal(where),
                attributes: [
                    'id',
                    'codigo',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Matriz.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                    { model: Layout, as: 'layout', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const matrizs_trim = matrizs.map(matriz => {
                    matriz.descricao = matriz.descricao.trim();
                    matriz.motina.descricao = matriz.motina.descricao.trim();
                    return matriz;
                });
                return res.status(200).json(matrizs_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Matriz, Motina, Layout } = Database.getModels(req.database);
            const matrizs = await Matriz.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'codigo',
                    'descricao',
                    'matriz',
                    'matrizrtf',
                    'usamatrizrtf',
                    'status',
                    'layout_id',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                    {
                        model: Layout,
                        as: 'layout',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!matrizs) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                matrizs.descricao = matrizs.descricao
                    ? matrizs.descricao.trim()
                    : '';
                matrizs.motina.descricao = matrizs.motina.descricao
                    ? matrizs.motina.descricao.trim()
                    : '';

                return res.status(200).json(matrizs);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Matriz } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const MatrizExists = await Matriz.findOne({
                where: { codigo: req.body.codigo.trim().padStart(5, '0') },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (MatrizExists) {
                return res
                    .status(400)
                    .json({ error: 'Matriz com codigo ja cadastrado.' });
            }
            req.body.codigo = req.body.codigo.trim().padStart(5, '0');

            const { id, descricao, status } = await Matriz.create(
                req.body
            ).catch(err => {
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

    async update(req, res) {
        try {
            const { Matriz } = Database.getModels(req.database);
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

            const matrizExists = await Matriz.findOne({
                where: { codigo: req.body.codigo.trim().padStart(5, '0') },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (matrizExists && req.body.id !== matrizExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Matriz com codigo ja cadastrado.' });
            }
            req.body.codigo = req.body.codigo.trim().padStart(5, '0');

            await Matriz.update(req.body, {
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
            const { Matriz } = Database.getModels(req.database);
            await Matriz.destroy({
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
                filter = ` CAST("Matriz"."codigo" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Matriz"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Matriz"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new MatrizController();
