import * as Yup from 'yup';
import Database from '../../database';

class FeriadoController {
    async index(req, res) {
        try {
            const { Feriado, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Feriado"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Feriado"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += FeriadoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = FeriadoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const feriados = await Feriado.findAll({
                order: Feriado.sequelize.literal(`${order} ${orderdesc}`),
                where: Feriado.sequelize.literal(where),
                attributes: [
                    'id',
                    'data',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Feriado.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const feriados_trim = feriados.map(feriado => {
                    feriado.descricao = feriado.descricao.trim();
                    feriado.motina.descricao = feriado.motina.descricao.trim();
                    return feriado;
                });
                return res.status(200).json(feriados_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Feriado, Motina } = Database.getModels(req.database);
            const feriados = await Feriado.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'data',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!feriados) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                feriados.descricao = feriados.descricao
                    ? feriados.descricao.trim()
                    : '';
                feriados.motina.descricao = feriados.motina.descricao
                    ? feriados.motina.descricao.trim()
                    : '';

                return res.status(200).json(feriados);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Feriado } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                data: Yup.string().required(),
                descricao: Yup.string().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, data, descricao, status } = await Feriado.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                data,
                descricao,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Feriado } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                data: Yup.string(),
                descricao: Yup.string(),
                status: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const feriadoExists = await Feriado.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!feriadoExists) {
                return res
                    .status(400)
                    .json({ error: 'Feriado com codigo não encontrado' });
            }

            await Feriado.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        data: data[1].data,
                        descricao: data[1].descricao,
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
            const { Feriado } = Database.getModels(req.database);
            await Feriado.destroy({
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
                filter = ` CAST("Feriado"."id" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'data':
                if (filterValue !== null) {
                    filter += ` CAST("Feriado"."data" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Feriado"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Feriado"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new FeriadoController();
