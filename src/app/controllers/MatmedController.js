import * as Yup from 'yup';
import Database from '../../database';

class MatmedController {
    async index(req, res) {
        try {
            const { Matmed, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Matmed"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Matmed"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += MatmedController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = MatmedController.handleFilters(filter, filtervalue);
                }
            }

            const matmeds = await Matmed.findAll({
                order: Matmed.sequelize.literal(`${order} ${orderdesc}`),
                where: Matmed.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Matmed.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const matmeds_trim = matmeds.map(filtro => {
                    filtro.descricao = filtro.descricao.trim();
                    filtro.motina.descricao = filtro.motina.descricao.trim();
                    return filtro;
                });
                return res.status(200).json(matmeds_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Matmed, Motina, Examatmed } = Database.getModels(
                req.database
            );

            if (req.params.exame_id) {
                const ExamatmedExists = await Examatmed.findOne({
                    where: {
                        exame_id: req.params.exame_id,
                        matmed_id: req.params.id,
                    },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (ExamatmedExists) {
                    return res.status(400).json({
                        error: 'Material e Medicamento ja selecionado.',
                    });
                }
            }

            const matmeds = await Matmed.findByPk(req.params.id, {
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!matmeds) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                matmeds.descricao = matmeds.descricao
                    ? matmeds.descricao.trim()
                    : '';
                matmeds.motina.descricao = matmeds.motina.descricao
                    ? matmeds.motina.descricao.trim()
                    : '';

                return res.status(200).json(matmeds);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Matmed } = Database.getModels(req.database);
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
                status,
                codtab,
                medicam,
                contraste,
                preco,
                precofra,
                qtdfra,
                unidade,
                marca,
                simpro,
                brasind,
            } = await Matmed.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                codtab,
                medicam,
                contraste,
                preco,
                precofra,
                qtdfra,
                unidade,
                marca,
                simpro,
                brasind,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Matmed } = Database.getModels(req.database);
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

            const filtroExists = await Matmed.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            await Matmed.update(req.body, {
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
            const { Matmed } = Database.getModels(req.database);
            await Matmed.destroy({
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
                filter = ` CAST("Matmed"."id" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Matmed"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Matmed"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new MatmedController();
