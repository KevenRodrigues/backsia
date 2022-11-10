import * as Yup from 'yup';
import Database from '../../database';

class PorteController {
    async index(req, res) {
        try {
            const { Porte, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Porte"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Porte"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += PorteController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = PorteController.handleFilters(filter, filtervalue);
                }
            }

            const portes = await Porte.findAll({
                order: Porte.sequelize.literal(`${order} ${orderdesc}`),
                where: Porte.sequelize.literal(where),
                attributes: [
                    'id',
                    'codigo',
                    'descricao',
                    'valor',
                    'status',
                    'idopera_ultacao',
                    [Porte.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const portes_trim = portes.map(porte => {
                    porte.descricao = porte.descricao.trim();
                    porte.motina.descricao = porte.motina.descricao.trim();
                    return porte;
                });
                return res.status(200).json(portes_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Porte, Motina } = Database.getModels(req.database);
            const portes = await Porte.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'codigo',
                    'descricao',
                    'valor',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!portes) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                portes.descricao = portes.descricao
                    ? portes.descricao.trim()
                    : '';
                portes.motina.descricao = portes.motina.descricao
                    ? portes.motina.descricao.trim()
                    : '';

                return res.status(200).json(portes);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Porte } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                valor: Yup.number().required(),
                codigo: Yup.string()
                    .required()
                    .max(5),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const porteExists = await Porte.findOne({
                where: { codigo: req.body.codigo },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (porteExists) {
                return res
                    .status(400)
                    .json({ error: 'Porte com codigo ja cadastrado.' });
            }

            const { id, descricao, status, valor, codigo } = await Porte.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                valor,
                status,
                codigo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Porte } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                valor: Yup.number(),
                codigo: Yup.string().max(5),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const porteExists = await Porte.findByPk(req.body.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!porteExists) {
                return res
                    .status(400)
                    .json({ error: 'Porte com codigo nao encontrado' });
            }

            if (porteExists && req.body.id !== porteExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Porte com codigo ja cadastrado.' });
            }

            await Porte.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        valor: data[1].status,
                        codigo: data[1].codigo,
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
            const { Porte } = Database.getModels(req.database);
            await Porte.destroy({
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
                filter = ` CAST("Porte"."codigo" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Porte"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'valor':
                if (filterValue !== null) {
                    filter += ` CAST("Porte"."valor" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Porte"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new PorteController();
