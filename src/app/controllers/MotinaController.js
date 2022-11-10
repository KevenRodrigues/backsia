import * as Yup from 'yup';
import Database from '../../database';

class MotinaController {
    async index(req, res) {
        try {
            const { Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Motina"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Motina"."id" AS TEXT) ILIKE '%${parseInt(
                    search
                )}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += MotinaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = MotinaController.handleFilters(filter, filtervalue);
                }
            }

            const motinas = await Motina.findAll({
                order: Motina.sequelize.literal(`${order} ${orderdesc}`),
                where: Motina.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Motina.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const motinas_trim = motinas.map(motina => {
                    motina.descricao = motina.descricao
                        ? motina.descricao.trim()
                        : '';
                    motina.status = motina.status ? motina.status : 0;
                    motina.idopera_ultacao = motina.idopera_ultacao
                        ? motina.idopera_ultacao
                        : 0;
                    return motina;
                });
                return res.status(200).json(motinas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Motina } = Database.getModels(req.database);
            const motinas = await Motina.findByPk(req.params.id, {
                attributes: ['id', 'descricao', 'status', 'idopera_ultacao'],
            });

            if (!motinas) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            try {
                motinas.descricao = motinas.descricao
                    ? motinas.descricao.trim()
                    : '';
                motinas.status = motinas.status ? motinas.status : 0;
                motinas.idopera_ultacao = motinas.idopera_ultacao
                    ? motinas.idopera_ultacao
                    : 0;

                return res.status(200).json(motinas);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Motina } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, descricao, status } = await Motina.create(
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
            const { Motina } = Database.getModels(req.database);
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

            const { id, descricao, status } = await Motina.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
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
            const { Motina } = Database.getModels(req.database);
            await Motina.destroy({
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
                filter = ` CAST("Motina"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Motina"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Motina"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new MotinaController();
