import { format, subDays } from 'date-fns';
import Database from '../../database';

import { calculaDiasMovpacPorParametro } from './functions/functions';

class NovaColetaController {
    async index(req, res) {
        try {
            const { NovaColeta, Motivo, Exame, Movpac } = Database.getModels(
                req.database
            );
            const { page = 1, limit = 10 } = req.query;

            const date = await calculaDiasMovpacPorParametro(req)

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';
            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            const postoperm =
                req.query.postoperm !== '' ? req.query.postoperm : '';

            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';
            // let whereexa = '';
            if (req.query.search && req.query.search.length > 0) {
                if (postoperm !== '') {
                    where +=
                        where === ''
                            ? ` ("NovaColeta"."id" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("NovaColeta"."id" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                } else {
                    where = ` (Unaccent(upper(trim(coalesce("NovaColeta"."nome",'')))) ILIKE Unaccent('%${search.toUpperCase()}%'))
                    or (Unaccent(upper(trim(coalesce("NovaColeta"."nome_social",'')))) ILIKE Unaccent('%${search.toUpperCase()}%'))
                    or (CAST("NovaColeta"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
                }
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += NovaColetaController.handleFilters(
                            filters[i].id,
                            filters[i].value,
                            date
                        );
                    }
                } else {
                    where = NovaColetaController.handleFilters(
                        filter,
                        filtervalue,
                        date
                    );
                }
            }

            const novasColetas = await NovaColeta.findAll({
                order: NovaColeta.sequelize.literal(`${order} ${orderdesc}`),
                where: NovaColeta.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'posto',
                    'amostra',
                    'nome',
                    'motivo_id',
                    'datasolic',
                    'status',
                    'nome_social',
                    'total',
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motivo,
                        as: 'motivo',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Movpac,
                        as: 'movpac',
                        attributes: ['amostra'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const total_count = await NovaColeta.count({
                where: NovaColeta.sequelize.literal(where),
                include: [
                    {
                        model: Motivo,
                        as: 'motivo',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Movpac,
                        as: 'movpac',
                        attributes: ['amostra'],
                    },
                ],
            });

            try {
                const novasColetas_trim = novasColetas.map(coleta => {
                    coleta.nome = coleta.nome.trim();
                    coleta.nome_social = coleta.nome_social.trim();
                    if (coleta.motivo) {
                        coleta.motivo.descricao = coleta.motivo.descricao.trim();
                    }
                    return coleta;
                });

                if (novasColetas_trim.length > 0) {
                    novasColetas_trim[0].total = total_count.toString();
                }
                return res.status(200).json(novasColetas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { NovaColeta, Motivo } = Database.getModels(req.database);
            const novaColeta = await NovaColeta.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Motivo,
                        as: 'motivo',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!novaColeta) {
                return res
                    .status(400)
                    .json({ error: 'Nenhuma Nova Coleta encontrada' });
            }

            novaColeta.nome = novaColeta.nome.trim();
            novaColeta.nome_social = novaColeta.nome_social.trim();
            novaColeta.motivo.descricao = novaColeta.motivo.descricao.trim();

            return res.status(200).json(novaColeta);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { NovaColeta, Movexa } = Database.getModels(req.database);
            const novasColetas = [];
            if (req.body.length > 0) {
                try {
                    for (let i = 0; i < req.body.length; i++) {
                        const item = req.body[i];
                        const novaColeta = await NovaColeta.create(item).catch(
                            err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            }
                        );

                        const dataMovexa = {
                            statusexm: 'NC',
                            dtcoleta: null,
                            dtentrega: null,
                            idopera_ultacao: req.userId,
                        };

                        if (item.status === 'AP') {
                            dataMovexa.labapoio = 0;
                            dataMovexa.codpedapoio = null;
                            dataMovexa.etiquetaws_id = null;
                        }

                        await Movexa.update(dataMovexa, {
                            where: { id: item.movexa_id },
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        novasColetas.push(novaColeta);

                        await Movexa.sequelize.query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                item.movexa_id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'NOVA COLETA STATUS: ${item.statusexm.trim()}','${
                                req.headers.host
                            }')`
                        );
                    }

                    return res.status(200).json(novasColetas);
                } catch (err) {
                    return res.status(400).json({ error: err.message });
                }
            } else {
                return res.status(406).json({
                    error: ' Formato de dados não aceito.',
                });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { NovaColeta } = Database.getModels(req.database);

            if (req.body.id) {
                const novaColeta = await NovaColeta.findByPk(req.body.id);

                if (!novaColeta) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                req.body.idopera_ultacao = req.userId;

                await NovaColeta.sequelize
                    .transaction(async transaction => {
                        await NovaColeta.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        return res.status(200).json({
                            ok: true,
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue, date) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter += ` CAST("NovaColeta"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'posto':
                filter += ` CAST("NovaColeta"."posto" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'amostra':
                filter += ` CAST("NovaColeta"."amostra" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'nome':
                filter += ` CAST("NovaColeta"."nome" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'motivo.descricao':
                filter += ` (Unaccent(upper(trim(coalesce("motivo"."descricao",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'exame.id':
                filter += ` CAST("exame"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'exame.descricao':
                filter += ` (Unaccent(upper(trim(coalesce("exame"."descricao",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'dataentra':
                filter += ` "movpac"."dataentra" between '${filterValue}'`;
                break;
            case 'datasolic':
                filter += ` "NovaColeta"."datasolic" between '${filterValue}'`;
                break;
            case 'intervalo_amostras':
                filter += ` "movpac"."amostra" between '${filterValue.primeira}' and '${filterValue.segunda}'`;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("NovaColeta"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : (filter += ` ("NovaColeta"."datasolic" >= '${date}')`);
        }

        return filter;
    }
}

export default new NovaColetaController();
