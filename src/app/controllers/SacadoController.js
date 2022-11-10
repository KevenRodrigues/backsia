import Database from '../../database';
import getDelta from '../utils/getDelta';

class SacadoController {
    async index(req, res) {
        try {
            const { Convenio, Motina, Posto } = Database.getModels(
                req.database
            );
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
                where += ` (Unaccent(upper(trim(coalesce("Convenio"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Plcontas"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += SacadoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = SacadoController.handleFilters(filter, filtervalue);
                }
            }

            const response = await Convenio.findAll({
                attributes: [
                    'id',
                    'fantasia',
                    'razao',
                    'endereco',
                    'fone',
                    'status',
                    [Convenio.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Posto,
                        as: 'posto',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                ],
                where: Convenio.sequelize.literal(where),
                order: Convenio.sequelize.literal(`${order} ${orderdesc}`),
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(response);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Convenio,
                Motina,
                Posto,
                Represac,
                Repre,
            } = Database.getModels(req.database);

            const sacado = await Convenio.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'fantasia',
                    'razao',
                    'cep',
                    'endereco',
                    'bairro',
                    'cidade',
                    'uf',
                    'fone',
                    'fax',
                    'cgc_cpf',
                    'ie',
                    'im',
                    'contato',
                    'email',
                    'status',
                    'obs',
                    'dia',
                    'obsnf',
                    'endcob',
                    'emitenf',
                    'boletoemail',
                    'condominio',
                    'retemperc',
                    'retempercrps',
                    'repre',
                    'posto_id',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Posto,
                        as: 'posto',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                    {
                        model: Represac,
                        as: 'represac',
                        attributes: [
                            'perc',
                            'semimp',
                            'repre_id',
                            'sacado_id',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Repre,
                                as: 'repre',
                                attributes: [['id', 'codigo'], 'nome'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!sacado) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum sacado encontrado' });
            }

            return res.status(200).json(sacado);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createOrUpdate(req, res) {
        try {
            const { Convenio, Represac } = Database.getModels(req.database);
            const data = req.body;
            const emitenf = data.emitenf ? 1 : 0;
            const boletoemail = data.boletoemail ? 1 : 0;
            const condominio = data.condominio ? 1 : 0;
            const retemperc = data.retemperc ? 1 : 0;
            const retempercrps = data.retempercrps ? 1 : 0;
            const repre = data.repre ? 1 : 0;

            const sacadoData = {
                emitenf,
                boletoemail,
                condominio,
                fantasia: data.fantasia ? data.fantasia : null,
                razao: data.razao ? data.razao : null,
                cep: data.cep ? data.cep : null,
                endereco: data.endereco ? data.endereco : null,
                bairro: data.bairro ? data.bairro : null,
                cidade: data.cidade ? data.cidade : null,
                uf: data.uf ? data.uf : null,
                fone: data.fone ? data.fone : null,
                fax: data.fax ? data.fax : null,
                cgc_cpf: data.cgc_cpf ? data.cgc_cpf : null,
                ie: data.ie ? data.ie : null,
                im: data.im ? data.im : null,
                contato: data.contato ? data.contato : null,
                email: data.email ? data.email : null,
                status: data.status ? data.status : 0,
                dia: data.dia ? data.dia : null,
                obs: data.obs ? data.obs : null,
                endcob: data.endcob ? data.endcob : null,
                obsnf: data.obsnf ? data.obsnf : null,
                posto_id: data.posto_id ? data.posto_id : null,
                represac: data.comissoes ? data.comissoes : null,
                retemperc,
                retempercrps,
                repre,
            };

            if (data.id) {
                const existeSacado = await Convenio.findByPk(data.id, {
                    include: [{ model: Represac, as: 'represac' }],
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (!existeSacado) {
                    return res.status(400).json({
                        error: `Sacado com código ${data.id} não encontrado`,
                    });
                }

                const sacadoDelta = getDelta(
                    existeSacado.represac,
                    data.comissoes
                );

                await Convenio.sequelize
                    .transaction(async transaction => {
                        await Promise.all([
                            await sacadoDelta.added.map(async sacadoD => {
                                await Represac.create(sacadoD, {
                                    transaction,
                                }).catch(Convenio.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            await sacadoDelta.changed.map(async sacadoD => {
                                const represac = data.comissoes.find(
                                    sacados => sacados.id === sacadoD.id
                                );
                                await Represac.update(represac, {
                                    where: { id: represac.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            await sacadoDelta.deleted.map(
                                async sacadoDelete => {
                                    await sacadoDelete
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                        ]);
                        await Convenio.update(sacadoData, {
                            where: { id: data.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(sacadoData);
            }

            await Convenio.create(sacadoData, {
                include: [{ model: Represac, as: 'represac' }],
            })
                .then(x => {
                    return Convenio.findByPk(x.get('id'), {
                        include: [{ model: Represac, as: 'represac' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(sacadoData);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Convenio } = Database.getModels(req.database);
            await Convenio.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res.status(200).json({
                            message: 'Sacado deletado com sucesso.',
                        });
                    }
                    return res.status(400).json({
                        error: `Não foi possível deletar o Sacado ${req.params.id}`,
                    });
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
                filter += ` CAST("Convenio"."id" AS TEXT) ILIKE '%${filterValue}%'`;
                break;
            case 'codigo':
                filter += ` CAST("Convenio"."id" AS TEXT) ILIKE '%${filterValue}%'`;
                break;
            case 'fantasia':
                if (filterValue !== null) {
                    filter += ` CAST("Convenio"."fantasia" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'razao':
                if (filterValue !== null) {
                    filter += ` CAST("Convenio"."razao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'endereco':
                if (filterValue !== null) {
                    filter += ` CAST("Convenio"."endereco" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'fone':
                if (filterValue !== null) {
                    filter += ` CAST("Convenio"."fone" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Convenio"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new SacadoController();
