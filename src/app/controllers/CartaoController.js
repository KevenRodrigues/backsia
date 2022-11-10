import * as Yup from 'yup';
import Database from '../../database';

class CartaoController {
    async index(req, res) {
        try {
            const { Cartao, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Cartao"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Cartao"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += CartaoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = CartaoController.handleFilters(filter, filtervalue);
                }
            }

            const cartoes = await Cartao.findAll({
                order: Cartao.sequelize.literal(`${order} ${orderdesc}`),
                where: Cartao.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'perc_venda',
                    'status',
                    'idopera_ultacao',
                    [Cartao.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const cartoes_trim = cartoes.map(cartao => {
                    cartao.descricao = cartao.descricao.trim();
                    cartao.motina.descricao = cartao.motina.descricao.trim();
                    return cartao;
                });
                return res.status(200).json(cartoes_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Cartao, Motina } = Database.getModels(req.database);
            const cartoes = await Cartao.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'perc_venda',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!cartoes) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                cartoes.descricao = cartoes.descricao
                    ? cartoes.descricao.trim()
                    : '';
                cartoes.motina.descricao = cartoes.motina.descricao
                    ? cartoes.motina.descricao.trim()
                    : '';

                return res.status(200).json(cartoes);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Cartao } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                perc_venda: Yup.number().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, descricao, perc_venda, status } = await Cartao.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                perc_venda,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Cartao } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                perc_venda: Yup.number(),
                status: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const cartaoExists = await Cartao.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!cartaoExists) {
                return res
                    .status(400)
                    .json({ error: 'Cartão não encontrado!' });
            }

            await Cartao.update(req.body, {
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
            const { Cartao } = Database.getModels(req.database);
            await Cartao.destroy({
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
                filter = ` CAST("Cartao"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Cartao"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Cartao"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new CartaoController();
