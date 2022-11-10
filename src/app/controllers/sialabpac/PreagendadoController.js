import * as Yup from 'yup';
import Preagendado from '../../models/sialabpac/Preagendado';
import Laboratorio from '../../models/sialabpac/Laboratorio';
import Unidade from '../../models/sialabpac/Unidade';
import User from '../../models/sialabpac/User';
import Pedidosmedico from '../../models/sialabpac/PedidosMedico';

class PreagendadoController {
    async index(req, res) {
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
                where = ` (Unaccent(upper(trim(coalesce("Ccusto"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Ccusto"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += PreagendadoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = PreagendadoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const preagendados = await Preagendado.findAll({
                order: Preagendado.sequelize.literal(`${order} ${orderdesc}`),
                where: Preagendado.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'user_id',
                    'tipoatendimento',
                    'orcamento_id',
                    'status',
                    ['created_at', 'datacoleta'],
                    [
                        Preagendado.sequelize.literal('count(*) OVER ()'),
                        'total',
                    ],
                    [
                        Preagendado.sequelize.literal(
                            ' (select count(preagendado_id) AS "totalpedido" from pedidosmedicos where preagendado_id = "Preagendado"."id" group by preagendado_id order by preagendado_id)'
                        ),
                        'totalpedido',
                    ],
                    'data',
                    'hora',
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['name'],
                    },
                    {
                        model: Laboratorio,
                        as: 'laboratorio',
                        attributes: ['codigo', 'name'],
                        where: { codigo: req.query.labcode },
                    },
                    {
                        model: Unidade,
                        as: 'unidade',
                        attributes: ['posto', 'name'],
                    },
                ],
            });
            return res.status(200).json(preagendados);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const preagendados = await Preagendado.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'user_id',
                    'laboratorio_id',
                    'unidade_id',
                    'prontuario_id',
                    'tipoatendimento',
                    'status',
                    'created_at',
                    'data',
                    'hora',
                    [
                        Preagendado.sequelize.literal('count(*) OVER ()'),
                        'total',
                    ],
                ],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: [
                            'name',
                            'email',
                            'cpf',
                            'data_nasc',
                            'sexo',
                            'celular',
                            'fixo',
                            'cep',
                            'logradouro',
                            'numero',
                            'complemento',
                            'bairro',
                            'cidade',
                        ],
                    },
                    {
                        model: Laboratorio,
                        as: 'laboratorio',
                        attributes: ['codigo', 'name'],
                    },
                    {
                        model: Unidade,
                        as: 'unidade',
                        attributes: [
                            'posto',
                            'name',
                            'endereco',
                            'numero',
                            'complemento',
                            'bairro',
                            'cidade',
                            'uf',
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json(preagendados);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexPedido(req, res) {
        try {
            const pedidosmedicos = await Pedidosmedico.findAll({
                where: { preagendado_id: req.params.id },
                attributes: ['id', 'name', 'url'],
            });
            return res.status(200).json(pedidosmedicos);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const schema = Yup.object().shape({
                user_id: Yup.number().required(),
                laboratorio_id: Yup.string(),
                unidade_id: Yup.string().required(),
                prontuario_id: Yup.number().required(),
                tipoatendimento: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res
                    .status(400)
                    .json({ error: 'Todos os campos são obrigatórios.' });
            }

            const preAgendamento = await Preagendado.create(req.body);

            return res.status(200).json(preAgendamento);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const schema = Yup.object().shape({
                status: Yup.string(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, status } = await Preagendado.update(req.body, {
                attributes: ['id', 'status'],
                where: { id: req.body.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const preagendado = await Preagendado.findByPk(req.params.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );
            await preagendado.destroy().catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json('Agendamento excluído com sucesso!');
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexDashLab(req, res) {
        try {
            const lab = await Laboratorio.findOne({
                where: { codigo: req.params.labid },
                attributes: ['id', 'codigo'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (lab) {
                const preagendados = await Preagendado.findAll({
                    where: Preagendado.sequelize.literal(
                        ` "Preagendado"."status"='Em análise' and laboratorio_id = '${lab.id}' `
                    ),
                    limit: 1,
                    attributes: [
                        [
                            Preagendado.sequelize.literal('count(*) OVER ()'),
                            'total',
                        ],
                    ],
                });
                return res.status(200).json(preagendados);
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'unidade.posto':
                filter = ` (upper(trim(coalesce("unidade"."posto",''))) LIKE '%${filterValue.toUpperCase()}%') and status='Em análise'`;
                break;
            case 'codigo':
                filter = ` CAST("Preagendado"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%' and status='Em análise'`;
                break;
            case 'user.name':
                filter = ` (upper(trim(coalesce("user"."name",''))) LIKE '%${filterValue.toUpperCase()}%') and status='Em análise'`;
                break;
            case 'datacoleta':
                filter = ` "Preagendado"."created_at" between '${filterValue}' and status='Em análise'`;
                break;
            case 'data':
                filter = ` "Preagendado"."data" between '${filterValue}' and status='Em análise'`;
                break;
            case 'hora':
                filter = ` "Preagendado"."hora" LIKE '%${filterValue}%' and status='Em análise'`;
                break;
            default:
                filter = `status='Em análise'`;
        }

        return filter;
    }
}

export default new PreagendadoController();
