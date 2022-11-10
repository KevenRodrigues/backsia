import * as Yup from 'yup';
import Database from '../../database';

class FornecedorController {
    async index(req, res) {
        const { Fornecedor, Motina } = Database.getModels(req.database);
        try {
            const { page = 1, limit = 10 } = req.query;

            const order =
                req.query.sortby !== '' && req.query.sortby !== undefined
                    ? req.query.sortby
                    : 'id';
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
                where = ` (Unaccent(upper(trim(coalesce("Fornecedor"."razao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Fornecedor"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += FornecedorController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = FornecedorController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const fornecedor = await Fornecedor.findAll({
                order: Fornecedor.sequelize.literal(`${order} ${orderdesc}`),
                where: Fornecedor.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'fantasia',
                    'endereco',
                    'fone',
                    'status',
                    'idopera_ultacao',
                    [Fornecedor.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(fornecedor);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Fornecedor, Motina, Ccusto, Plcontas } = Database.getModels(
                req.database
            );
            const fornecedores = await Fornecedor.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'pl_contas_id',
                    'ccusto_id',
                    'razao',
                    'fantasia',
                    'endereco',
                    'bairro',
                    'cep',
                    'uf',
                    'cidade',
                    'fone',
                    'fax',
                    'email',
                    'contato',
                    'cgc_cpf',
                    'ie',
                    'obs',
                    'status',
                    'banc',
                    'historico',
                    'im',
                    'qualidade',
                    'logistica',
                    'competitivo',
                    'exclusivo',
                    'datquali',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Ccusto,
                        as: 'ccusto',
                        attributes: ['descricao', 'id'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontas',
                        attributes: ['descricao', 'id'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!fornecedores) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                fornecedores.fantasia = fornecedores.fantasia
                    ? fornecedores.fantasia.trim()
                    : '';
                fornecedores.motina.descricao = fornecedores.motina.descricao
                    ? fornecedores.motina.descricao.trim()
                    : '';

                return res.status(200).json(fornecedores);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Fornecedor } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                razao: Yup.string().required(),
                fantasia: Yup.string().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, descricao, status } = await Fornecedor.create(
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
            const { Fornecedor } = Database.getModels(req.database);
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

            const fornecedorExists = await Fornecedor.findByPk(
                req.body.id
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!fornecedorExists) {
                return res
                    .status(400)
                    .json({ error: 'Fornecedor não encontrado!' });
            }

            await Fornecedor.update(req.body, {
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
            const { Fornecedor } = Database.getModels(req.database);
            await Fornecedor.destroy({
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
                filter += ` CAST("Fornecedor"."id" AS TEXT) ILIKE '${filterValue}%'`;
                break;
            case 'fantasia':
                if (filterValue !== null) {
                    filter += ` CAST("Fornecedor"."fantasia" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'endereco':
                filter += ` CAST("Fornecedor"."endereco" AS TEXT) ILIKE '%${filterValue}%'`;
                break;
            case 'fone':
                filter += ` CAST("Fornecedor"."fone" AS TEXT) ILIKE '%${filterValue}%'`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Fornecedor"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }
        return filter;
    }
}

export default new FornecedorController();
