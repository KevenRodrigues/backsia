import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class EmpresaController {
    async index(req, res) {
        try {
            const { Empresa, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Empresa"."fantasia",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Empresa"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += EmpresaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = EmpresaController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const empresas = await Empresa.findAll({
                order: Empresa.sequelize.literal(`${order} ${orderdesc}`),
                where: Empresa.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'razao',
                    'fantasia',
                    'status',
                    'idopera_ultacao',
                    [Empresa.sequelize.literal('count(*) OVER ()'), 'total'],
                    [
                        Empresa.sequelize.literal(
                            ' (select count(empresa_id) AS "totalcustofixo" from empresaconv where empresa_id = "Empresa"."id" group by empresa_id order by empresa_id) '
                        ),
                        'totalcustofixo',
                    ],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const empresas_trim = empresas.map(empresa => {
                empresa.razao = empresa.razao ? empresa.razao.trim() : null;
                empresa.fantasia = empresa.fantasia ? empresa.fantasia.trim() : null;
                empresa.motina.descricao = empresa.motina ? empresa.motina.descricao.trim() : null;
                return empresa;
            });

            return res.status(200).json(empresas_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Empresa,
                Empresaconv,
                Motina,
                Convenio,
            } = Database.getModels(req.database);
            const empresa = await Empresa.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
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
                    'ibge',
                    'cnes',
                    'registro',
                    'crm',
                    'status',
                    'logra',
                    'issr',
                    'responsavel',
                    'cbos',
                    'numero',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Empresaconv,
                        as: 'empresaconv',
                        attributes: [
                            'id',
                            'empresa_id',
                            'convenio_id',
                            'codeletron',
                            'codconv',
                            'registro',
                            'codconvcon',
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['codigo', 'fantasia'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!empresa) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            empresa.razao = empresa.razao.trim();
            empresa.motina.descricao = empresa.motina.descricao
                ? empresa.motina.descricao.trim()
                : '';

            // empresa.empresaconv.map(empresaconv => {
            //     if (empresaconv.descricao) {
            //         empresaconv.descricao = empresaconv.descricao.trim();
            //     }
            //     return empresaconv;
            // });

            return res.status(200).json(empresa);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Empresa, Empresaconv } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                razao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo razao obrigatorio'),
                status: Yup.number().required('Campo status obrigatorio'),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const empresa = await Empresa.findByPk(req.body.id, {
                    include: [{ model: Empresaconv, as: 'empresaconv' }],
                });

                if (!empresa) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const empresaDelta = getDelta(
                    empresa.empresaconv,
                    req.body.empresaconv
                );
                await Empresa.sequelize
                    .transaction(async transaction => {
                        // Update empresaconv
                        await Promise.all([
                            empresaDelta.added.map(async empresaconvD => {
                                await Empresaconv.create(empresaconvD, {
                                    transaction,
                                }).catch(Empresa.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            empresaDelta.changed.map(async empresaconvData => {
                                const empresaconv = req.body.empresaconv.find(
                                    _empresaconv =>
                                        _empresaconv.id === empresaconvData.id
                                );
                                await Empresaconv.update(empresaconv, {
                                    where: { id: empresaconv.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            empresaDelta.deleted.map(async empresaconvDel => {
                                await empresaconvDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Empresa.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                // Finally update eqp
                const { razao, status, empresaconv } = req.body;
                return res.status(200).json({
                    razao,
                    status,
                    empresaconv,
                });
            }
            const { id, razao, status, empresaconv } = await Empresa.create(
                req.body,
                {
                    include: [{ model: Empresaconv, as: 'empresaconv' }],
                }
            )
                .then(x => {
                    return Empresa.findByPk(x.get('id'), {
                        include: [{ model: Empresaconv, as: 'empresaconv' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                razao,
                status,
                empresaconv,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Empresa } = Database.getModels(req.database);
            await Empresa.destroy({
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
                filter = ` CAST("Empresa"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Empresa"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Empresa"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new EmpresaController();
