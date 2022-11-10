import * as Yup from 'yup';
import Database from '../../database';

class SetorFilaController {
    async index(req, res) {
        try {
            const { SetorFila, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("SetorFila"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("SetorFila"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += SetorFilaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = SetorFilaController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const setores = await SetorFila.findAll({
                order: SetorFila.sequelize.literal(`${order} ${orderdesc}`),
                where: SetorFila.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'prioridade',
                    'seqsenha',
                    'status',
                    'idopera_ultacao',
                    [SetorFila.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const setores_trim = setores.map(setor => {
                    setor.descricao = setor.descricao.trim();
                    setor.motina.descricao = setor.motina.descricao.trim();
                    return setor;
                });
                return res.status(200).json(setores_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { SetorFila, Motina } = Database.getModels(req.database);
            const setores = await SetorFila.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'prioridade',
                    'seqsenha',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!setores) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                setores.descricao = setores.descricao
                    ? setores.descricao.trim()
                    : '';
                setores.motina.descricao = setores.motina.descricao
                    ? setores.motina.descricao.trim()
                    : '';

                return res.status(200).json(setores);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { SetorFila } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                prioridade: Yup.string()
                    .required()
                    .max(20),
                seqsenha: Yup.string()
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
                prioridade,
                seqsenha,
            } = await SetorFila.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                prioridade,
                seqsenha,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { SetorFila } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                prioridade: Yup.string().max(20),
                seqsenha: Yup.string().max(50),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const filtroExists = await SetorFila.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            await SetorFila.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        prioridade: data[1].prioridade,
                        seqsenha: data[1].seqsenha,
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
            const { SetorFila } = Database.getModels(req.database);
            await SetorFila.destroy({
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
                filter = ` CAST("SetorFila"."id" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("SetorFila"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'prioridade':
                filter = ` CAST("SetorFila"."prioridade" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'seqsenha':
                filter = ` CAST("SetorFila"."seqsenha" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("SetorFila"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new SetorFilaController();
