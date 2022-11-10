import * as Yup from 'yup';
import Database from '../../database';
import getDelta from '../utils/getDelta';

class ReceberController {
    async index(req, res) {
        const { Receber, Convenio } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Receber"."razao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Receber"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += ReceberController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = ReceberController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const pagar = await Receber.findAll({
                order: Receber.sequelize.literal(`${order} ${orderdesc}`),
                where: Receber.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    [
                        Receber.sequelize.literal(
                            `TRIM(COALESCE(numerodoc,''))`
                        ),
                        'numerodoc',
                    ],
                    'parcela',
                    'vencimento',
                    'datent',
                    'obs',
                    'valor',
                    'empresa_id',
                    'operador_id',
                    'status',
                    [Receber.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: Convenio,
                        as: 'sacado',
                        attributes: ['id', 'fantasia'],
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
        const { Receber, Convenio, Empresa } = Database.getModels(req.database);
        try {
            const receber = await Receber.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Convenio,
                        as: 'sacado',
                        attributes: ['id', 'fantasia'],
                    },
                    {
                        model: Empresa,
                        as: 'empresa',
                        attributes: ['id', 'fantasia'],
                    },
                ],
            });
            if (receber) {
                return res.status(200).json(receber);
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
            const { Receber, Receber1, Receber2 } = Database.getModels(
                req.database
            );
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
                const receber = await Receber.findByPk(req.body.id, {
                    include: [
                        { model: Receber1, as: 'receber1' },
                        { model: Receber2, as: 'receber2' },
                    ],
                });

                if (!receber) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const receber1Delta = getDelta(
                    receber.receber1,
                    req.body.receber1
                );
                const receber2Delta = getDelta(
                    receber.receber2,
                    req.body.receber2
                );
                await Receber.sequelize
                    .transaction(async transaction => {
                        // Update receber1
                        await Promise.all([
                            receber1Delta.added.map(async receber1D => {
                                await Receber1.create(receber1D, {
                                    transaction,
                                }).catch(Receber.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            receber2Delta.added.map(async receber2D => {
                                await Receber2.create(receber2D, {
                                    transaction,
                                }).catch(Receber.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            receber1Delta.changed.map(async receber1Data => {
                                const receber1 = req.body.receber1.find(
                                    _receber1 =>
                                        _receber1.id === receber1Data.id
                                );
                                await Receber1.update(receber1, {
                                    where: { id: receber1.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            receber2Delta.changed.map(async receber2Data => {
                                const receber2 = req.body.receber2.find(
                                    _receber2 =>
                                        _receber2.id === receber2Data.id
                                );
                                await Receber2.update(receber2, {
                                    where: { id: receber2.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            receber1Delta.deleted.map(async receber1Del => {
                                await receber1Del
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            receber2Delta.deleted.map(async receber2Del => {
                                await receber2Del
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        // Finally update apoio
                        // const { razao, status, receber1, receber2 } = req.body;

                        const receberUpdate = await Receber.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        return res.status(200).json(receberUpdate);
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
            } else {
                const receber = await Receber.create(req.body, {
                    include: [
                        { model: Receber1, as: 'receber1' },
                        { model: Receber2, as: 'receber2' },
                    ],
                })
                    .then(x => {
                        return Receber.findByPk(x.get('id'), {
                            include: [
                                { model: Receber1, as: 'receber1' },
                                { model: Receber2, as: 'receber2' },
                            ],
                        });
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(receber);
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async cancelar(req, res) {
        try {
            const { Receber } = Database.getModels(req.database);

            const receber = await Receber.findByPk(req.params.id).error(err => {
                return res.status(400).json({ error: err.message });
            });

            if (receber) {
                receber.update(req.body);
                return res.status(200).json(receber);
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
                Receber,
                Receber1,
                Paramf,
                Pagar,
                Pagar1,
                Contas,
            } = Database.getModels(req.database);

            const receber = await Receber.findByPk(req.params.id, {
                include: [
                    {
                        model: Receber1,
                        as: 'receber1',
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
                replacements: ['receber1'],
            })
                .then(data => {
                    return data.toJSON();
                })
                .error(err => {
                    return res.status(400).json({ error: err.message });
                });

            const { fornec_id } = await Paramf.findOne({ raw: true }).error(
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

            const newContas = receber.receber1.map(conta => {
                const valorpago = Number(conta.valpag);
                const desconto = Number(conta.desconto);
                const juros = Number(conta.juros);
                const newValorpago = Number(valorpago - desconto + juros);
                const { saldo } = contas.find(x => x.id === conta.contas_id);
                const newSaldo = Number(saldo) - newValorpago;

                return {
                    id: conta.contas_id,
                    saldo: newSaldo,
                    idopera_ultacao,
                };
            });

            if (receber) {
                const newPagar = {
                    datpag: receber.datrecbol,
                    datrecbol: receber.datrecbol,
                    totdesc: receber.totdesc,
                    totjuros: receber.totjuros,
                    datent: receber.datent,
                    fornec_id,
                    numerodoc: receber.numerodoc,
                    valor: receber.valor,
                    totpago: receber.totpago,
                    previsao: 0,
                    obs: `Estorno de conta a receber No.: ${receber.id}`,
                    tippag: receber.tippag,
                    vencimento: receber.vencimento,
                    status: 'FC',
                    idopera_ultacao,
                };

                await Pagar.sequelize.transaction(async transaction => {
                    const pagar = await Pagar.create(newPagar, {
                        transaction,
                    }).catch(Pagar.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await receber.receber1.map(async receber1C => {
                        const newPagar1 = {
                            ...receber1C,
                            pagar_id: pagar.id,
                            idopera_ultacao,
                        };

                        await Pagar1.create(newPagar1, {
                            transaction,
                        }).catch(Pagar.sequelize, err => {
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

                    await Receber.update(
                        req.body,
                        { where: { id: receber.id } },
                        {
                            transaction,
                        }
                    ).catch(Receber.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });

                    return res.json(pagar);
                });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        return null;
    }

    async recebimento(req, res) {
        const receberId = req.params.id;
        const {
            totdesc,
            totjuros,
            totalpagar,
            pagamento,
            receber1,
            idopera_ultacao,
        } = req.body;

        const recebimentoData = {
            totdesc,
            totjuros,
            datpag: pagamento,
            totpago: totalpagar,
            status: 'FC',
            idopera_ultacao,
        };

        const newSaldos = receber1.map(item => {
            const getValor = parseFloat(item.valpag).toFixed(2);
            const getSaldo = parseFloat(item.contas.saldo).toFixed(2);
            const newSaldo = parseFloat(+getSaldo + +getValor).toFixed(2);
            return {
                id: item.contas.id,
                saldo: parseFloat(newSaldo).toFixed(2),
            };
        });

        try {
            const { Receber, Receber1, Contas } = Database.getModels(
                req.database
            );

            await Receber.sequelize.transaction(async transaction => {
                await Promise.all([
                    await receber1.map(async item => {
                        const newReceber1 = {
                            ...item,
                            idopera_ultacao,
                        };

                        await Receber1.update(newReceber1, {
                            where: { id: item.id },
                            transaction,
                        }).catch(Receber.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }),

                    await newSaldos.map(async conta => {
                        await Contas.update(conta, {
                            where: { id: conta.id },
                            transaction,
                        }).catch(Receber.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }),

                    await Receber.update(recebimentoData, {
                        where: { id: receberId },
                        transaction,
                    }).catch(Receber.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    }),
                ]);

                return res.status(200).json(recebimentoData);
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
                filter = ` CAST("Receber"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'numerodoc':
                filter = ` CAST("Receber"."numerodoc" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'parcela':
                filter = ` CAST("Receber"."parcela" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;

            case 'sacado.fantasia':
                filter = ` (Unaccent(upper(trim(coalesce("sacado"."fantasia",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;

            case 'fornecedor.fantasia':
                filter = ` (Unaccent(upper(trim(coalesce("fornecedor"."fantasia",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;

            case 'vencimento':
                filter = ` "Receber"."vencimento" between '${filterValue}'`;
                break;

            case 'datent':
                filter = ` "Receber"."datent" between '${filterValue}'`;
                break;

            case 'empresa.fantasia':
                filter = ` (Unaccent(upper(trim(coalesce("empresa"."fantasia",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;

            case 'obs':
                filter = ` (Unaccent(upper(trim(coalesce("Receber"."obs",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;

            case 'valor':
                filter = ` CAST("Receber"."valor" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;

            case 'status':
                filter = ` CAST("Receber"."status" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter = ` (Unaccent(upper(trim(coalesce("Receber"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new ReceberController();
