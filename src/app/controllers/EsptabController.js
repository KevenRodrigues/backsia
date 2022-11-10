import * as Yup from 'yup';
import Database from '../../database';

class EsptabController {
    async index(req, res) {
        try {
            const { Esptab, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Esptab"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Esptab"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += EsptabController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = EsptabController.handleFilters(filter, filtervalue);
                }
            }

            const esptabs = await Esptab.findAll({
                order: Esptab.sequelize.literal(`${order} ${orderdesc}`),
                where: Esptab.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'idopera_ultacao',
                    [Esptab.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const esptabs_trim = esptabs.map(esptab => {
                    esptab.descricao = esptab.descricao.trim();
                    esptab.motina.descricao = esptab.motina.descricao.trim();
                    return esptab;
                });
                return res.status(200).json(esptabs_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Esptab, Motina } = Database.getModels(req.database);
            const esptabs = await Esptab.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!esptabs) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                esptabs.descricao = esptabs.descricao
                    ? esptabs.descricao.trim()
                    : '';
                esptabs.motina.descricao = esptabs.motina.descricao
                    ? esptabs.motina.descricao.trim()
                    : '';

                return res.status(200).json(esptabs);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Esptab } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                codigo: Yup.string()
                    .required()
                    .max(5),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const esptabExists = await Esptab.findOne({
                where: { codigo: req.body.codigo },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (esptabExists) {
                return res
                    .status(400)
                    .json({ error: 'Esptab com codigo ja cadastrado.' });
            }

            const { id, descricao, status, codigo } = await Esptab.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                codigo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Esptab } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                codigo: Yup.string().max(5),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const esptabExists = await Esptab.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!esptabExists) {
                return res
                    .status(400)
                    .json({ error: 'Esptab com codigo nao encontrado' });
            }

            if (esptabExists && req.body.id !== esptabExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Esptab com codigo ja cadastrado.' });
            }

            await Esptab.update(req.body, {
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
            const { Esptab } = Database.getModels(req.database);
            await Esptab.destroy({
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
                filter = ` CAST("Esptab"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Esptab"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Esptab"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new EsptabController();
