import * as Yup from 'yup';
import Database from '../../database';
import getDelta from '../utils/getDelta';

class PagarController {
    async index(req, res) {
        const { Pagar, Fornecedor, Empresa } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Pagar"."razao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Pagar"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += PagarController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = PagarController.handleFilters(filter, filtervalue);
                }
            }

            const pagar = await Pagar.findAll({
                order: Pagar.sequelize.literal(`${order} ${orderdesc}`),
                where: Pagar.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'numerodoc',
                    'parcela',
                    'fornec_id',
                    'vencimento',
                    'datent',
                    'valor',
                    'empresa_id',
                    'operador_id',
                    'status',
                    [Pagar.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: Fornecedor,
                        as: 'fornecedor',
                        attributes: ['id', 'fantasia'],
                    },
                    {
                        model: Empresa,
                        as: 'empresa',
                        attributes: ['fantasia'],
                    },
                ],
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(pagar);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        const { Pagar, Fornecedor, Empresa } = Database.getModels(req.database);
        try {
            const pagar = await Pagar.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Fornecedor,
                        as: 'fornecedor',
                        attributes: ['id', 'fantasia'],
                    },
                    {
                        model: Empresa,
                        as: 'empresa',
                        attributes: ['id', 'fantasia'],
                    },
                ],
            });
            if (pagar) {
                return res.status(200).json(pagar);
            }
            return res
                .status(400)
                .json({ error: 'Conta a pagar nao encontrada.' });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Pagar, Pagar1, Pagar2 } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                // descricao: Yup.string()
                //     .transform(v => (v === null ? '' : v))
                //     .required('Campo descricao obrigatorio'),
                // eqpexa: Yup.array().of(
                //     Yup.object().shape({
                //         exame_id: Yup.number()
                //             .transform(value =>
                //                 Number.isNaN(value) ? undefined : value
                //             )
                //             .required('Obrigatorio informar o exame.'),
                //     })
                // ),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const pagar = await Pagar.findByPk(req.body.id, {
                    include: [
                        { model: Pagar1, as: 'pagar1' },
                        { model: Pagar2, as: 'pagar2' },
                    ],
                });

                if (!pagar) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const pagar1Delta = getDelta(pagar.pagar1, req.body.pagar1);
                const pagar2Delta = getDelta(pagar.pagar2, req.body.pagar2);
                await Pagar.sequelize
                    .transaction(async transaction => {
                        // Update pagar1
                        await Promise.all([
                            pagar1Delta.added.map(async pagar1D => {
                                await Pagar1.create(pagar1D, {
                                    transaction,
                                }).catch(Pagar.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            pagar2Delta.added.map(async pagar2D => {
                                await Pagar2.create(pagar2D, {
                                    transaction,
                                }).catch(Pagar.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            pagar1Delta.changed.map(async pagar1Data => {
                                const pagar1 = req.body.pagar1.find(
                                    _pagar1 => _pagar1.id === pagar1Data.id
                                );
                                await Pagar1.update(pagar1, {
                                    where: { id: pagar1.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            pagar2Delta.changed.map(async pagar2Data => {
                                const pagar2 = req.body.pagar2.find(
                                    _pagar2 => _pagar2.id === pagar2Data.id
                                );
                                await Pagar2.update(pagar2, {
                                    where: { id: pagar2.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            pagar1Delta.deleted.map(async pagar1Del => {
                                await pagar1Del
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            pagar2Delta.deleted.map(async pagar2Del => {
                                await pagar2Del
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        // Finally update apoio
                        // const { razao, status, pagar1, pagar2 } = req.body;

                        const pagarUpdate = await Pagar.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        return res.status(200).json(pagarUpdate);
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
            } else {
                const pagar = await Pagar.create(req.body, {
                    include: [
                        { model: Pagar1, as: 'pagar1' },
                        { model: Pagar2, as: 'pagar2' },
                    ],
                })
                    .then(x => {
                        return Pagar.findByPk(x.get('id'), {
                            include: [
                                { model: Pagar1, as: 'pagar1' },
                                { model: Pagar2, as: 'pagar2' },
                            ],
                        });
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(pagar);
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async cancelar(req, res) {
        try {
            const { Pagar } = Database.getModels(req.database);

            const pagar = await Pagar.findByPk(req.params.id).error(err => {
                return res.status(400).json({ error: err.message });
            });

            if (pagar) {
                pagar.update(req.body);
                return res.status(200).json(pagar);
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        return null;
    }

    async estorno(req, res) {
        const { idopera_ultacao, status } = req.body;
        try {
            const {
                Pagar,
                Pagar1,
                Paramf,
                Receber,
                Receber1,
                Contas,
            } = Database.getModels(req.database);

            const pagar = await Pagar.findByPk(req.params.id, {
                include: [
                    {
                        model: Pagar1,
                        as: 'pagar1',
                        attributes: [
                            'contas_id',
                            'valpag',
                            'desconto',
                            'datvenc',
                            'numche',
                            'juros',
                            'numbanco',
                        ],
                    },
                ],
                replacements: ['pagar1'],
            })
                .then(data => {
                    return data.toJSON();
                })
                .error(err => {
                    return res.status(400).json({ error: err.message });
                });

            const { sacado_id } = await Paramf.findOne({ raw: true }).error(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            const contas = await Contas.findAll({
                attributes: ['id', 'saldo'],
                raw: true,
            }).error(err => {
                return res.status(400).json({ error: err.message });
            });

            const newContas = pagar.pagar1.map(conta => {
                const valorpago = Number(conta.valpag);
                const desconto = Number(conta.desconto);
                const juros = Number(conta.juros);
                const newValorpago = Number(valorpago - desconto + juros);
                const { saldo } = contas.find(x => x.id === conta.contas_id);
                const newSaldo = Number(saldo) + newValorpago;

                return {
                    id: conta.contas_id,
                    saldo: newSaldo,
                    idopera_ultacao,
                };
            });

            if (pagar) {
                const newReceber = {
                    datpag: pagar.datrecbol,
                    datrecbol: pagar.datrecbol,
                    totdesc: pagar.totdesc,
                    totjuros: pagar.totjuros,
                    datent: pagar.datent,
                    sacado_id,
                    numerodoc: pagar.numerodoc,
                    valor: pagar.valor,
                    totpago: pagar.totpago,
                    previsao: 0,
                    obs: `Estorno de conta a pagar No.: ${pagar.id}`,
                    tippag: pagar.tippag,
                    vencimento: pagar.vencimento,
                    status: 'FC',
                    idopera_ultacao,
                };

                await Receber.sequelize.transaction(async transaction => {
                    const receber = await Receber.create(newReceber, {
                        transaction,
                    }).catch(Receber.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await pagar.pagar1.map(async pagar1C => {
                        const newReceber1 = {
                            ...pagar1C,
                            receber_id: receber.id,
                            idopera_ultacao,
                        };

                        await Receber1.create(newReceber1, {
                            transaction,
                        }).catch(Receber.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    });

                    await newContas.map(async conta => {
                        await Contas.update(
                            conta,
                            {
                                where: { id: conta.id },
                            },
                            {
                                transaction,
                            }
                        ).catch(Receber.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    });

                    await Pagar.update(
                        req.body,
                        { where: { id: pagar.id } },
                        {
                            transaction,
                        }
                    ).catch(Receber.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });

                    return res.json(receber);
                });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        return null;
    }

    async pagamento(req, res) {
        const pagarId = req.params.id;
        const {
            totdesc,
            totjuros,
            totalpagar,
            pagamento,
            pagar1,
            idopera_ultacao,
        } = req.body;

        const pagamentoData = {
            totdesc,
            totjuros,
            datpag: pagamento,
            totpago: totalpagar,
            status: 'FC',
            idopera_ultacao,
        };

        const newSaldos = pagar1.map(item => {
            const getValor = parseFloat(item.valpag).toFixed(2);
            const getSaldo = parseFloat(item.contas.saldo).toFixed(2);
            const newSaldo = parseFloat(getSaldo - getValor).toFixed(2);
            return {
                id: item.contas.id,
                saldo: newSaldo,
            };
        });

        try {
            const { Pagar, Pagar1, Contas } = Database.getModels(req.database);

            await Pagar.sequelize.transaction(async transaction => {
                await Promise.all([
                    await pagar1.map(async item => {
                        const newPagar1 = {
                            ...item,
                            idopera_ultacao,
                        };

                        await Pagar1.update(newPagar1, {
                            where: { id: item.id },
                            transaction,
                        }).catch(Pagar.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }),

                    await newSaldos.map(async conta => {
                        await Contas.update(conta, {
                            where: { id: conta.id },
                            transaction,
                        }).catch(Pagar.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }),
                ]);

                await Pagar.update(pagamentoData, {
                    where: { id: pagarId },
                    transaction,
                }).catch(Pagar.sequelize, err => {
                    return res.status(400).json({ error: err.message });
                });

                return res.status(200).json(pagamentoData);
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        return null;
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Pagar"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'numerodoc':
                filter = ` CAST("Pagar"."numerodoc" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'parcela':
                filter = ` CAST("Pagar"."parcela" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'fornecedor.fantasia':
                filter = ` (Unaccent(upper(trim(coalesce("fornecedor"."fantasia",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'vencimento':
                filter = ` "Pagar"."vencimento" between '${filterValue}'`;
                break;
            case 'datent':
                filter = ` "Pagar"."datent" between '${filterValue}'`;
                break;
            case 'empresa.fantasia':
                filter = ` (Unaccent(upper(trim(coalesce("empresa"."fantasia",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'valor':
                filter = ` CAST("Pagar"."valor" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'status':
                filter = ` CAST("Pagar"."status" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter = ` (Unaccent(upper(trim(coalesce("Pagar"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new PagarController();
