import * as Yup from 'yup';
import Database from '../../database';

class CidController {
    async index(req, res) {
        try {
            const { Cid, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Cid"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Cid"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += CidController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = CidController.handleFilters(filter, filtervalue);
                }
            }

            const cids = await Cid.findAll({
                order: Cid.sequelize.literal(`${order} ${orderdesc}`),
                where: Cid.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'sexo',
                    'codigo',
                    'idopera_ultacao',
                    [Cid.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['descricao', 'id'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const cids_trim = cids.map(cid => {
                    cid.descricao = cid.descricao ? cid.descricao.trim() : '';
                    cid.sexo = cid.sexo ? cid.sexo.trim() : '';
                    cid.codigo = cid.codigo ? cid.codigo.trim() : '';
                    cid.motina.descricao = cid.motina.descricao
                        ? cid.motina.descricao.trim()
                        : '';
                    return cid;
                });
                return res.status(200).json(cids_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Cid, Motina } = Database.getModels(req.database);
            const cids = await Cid.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'sexo',
                    'codigo',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['descricao', 'id'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!cids) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                cids.descricao = cids.descricao ? cids.descricao.trim() : '';
                cids.sexo = cids.sexo ? cids.sexo.trim() : '';
                cids.codigo = cids.codigo ? cids.codigo.trim() : '';
                cids.motina.descricao = cids.motina.descricao
                    ? cids.motina.descricao.trim()
                    : '';

                return res.status(200).json(cids);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Cid } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                codigo: Yup.string()
                    .required()
                    .max(5),
                sexo: Yup.string().nullable(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const cidExists = await Cid.findOne({
                where: { codigo: req.body.codigo },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (cidExists) {
                return res
                    .status(400)
                    .json({ error: 'Cid com codigo ja cadastrado.' });
            }

            const { id, descricao, status, codigo, sexo } = await Cid.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                sexo,
                codigo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Cid } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                codigo: Yup.string().max(5),
                sexo: Yup.string().nullable(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            if (req.body.codigo) {
                const cidExists = await Cid.findOne({
                    where: { codigo: req.body.codigo.trim() },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (cidExists && req.body.id !== cidExists.id.toString()) {
                    return res
                        .status(400)
                        .json({ error: 'Cid com Codigo ja cadastrado.' });
                }
                req.body.codigo = req.body.codigo.trim();
            }

            await Cid.update(req.body, {
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
            const { Cid } = Database.getModels(req.database);
            await Cid.destroy({
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
                filter = ` CAST("Cid"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Cid"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Cid"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new CidController();
