import { QueryTypes } from 'sequelize';
import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class FraseController {
    async index(req, res) {
        try {
            const { Frase, Exame, Motina } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Matriz"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Matriz"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += FraseController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = FraseController.handleFilters(filter, filtervalue);
                }
            }

            const frases = await Frase.findAll({
                order: Frase.sequelize.literal(`${order} ${orderdesc}`),
                where: Frase.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'exame_id',
                    'idopera_ultacao',
                    [Frase.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const frases_trim = frases.map(frase => {
                frase.descricao = frase.descricao.trim();
                frase.motina.descricao = frase.motina.descricao.trim();
                frase.exame
                    ? (frase.exame.descricao = frase.exame.descricao.trim())
                    : null;
                return frase;
            });

            return res.status(200).json(frases_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Frase, Fraseexa, Exame } = Database.getModels(req.database);
            const frase = await Frase.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'exame_id',
                    'codalfa',
                    'naogeral',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Fraseexa,
                        as: 'fraseexa',
                        attributes: ['id', 'frase_id', 'exame_id'],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!frase) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            frase.descricao = frase.descricao.trim();
            frase.exame
                ? (frase.exame.descricao = frase.exame.descricao.trim())
                : null;
            frase.fraseexa.map(fraseexa => {
                if (fraseexa.exame) {
                    fraseexa.exame.codigo = fraseexa.exame.codigo.trim();
                    fraseexa.exame.descricao = fraseexa.exame.descricao.trim();
                }
                return fraseexa;
            });
            return res.status(200).json(frase);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexFrasesByExame(req, res) {
        try {
            const { Frase } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const exame_id = req.params.id ? req.params.id : '';
            let where = '';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            if (filter !== '') {
                where = ` (Unaccent(upper(trim(coalesce("frase"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%')) AND (coalesce("frase"."naogeral",0) = 0) `;
            } else if (exame_id !== '')
                where = ` (("frase"."exame_id" = ${exame_id}) OR "fraseexa"."exame_id" = ${exame_id})`;

            const select = `
                SELECT DISTINCT(frase.id),
                    frase.codalfa,
                    frase.descricao,
                    exame.descricao as desc_exa,
                    frase.status,
                    exame.codigo as cod_exa,
                    frase.exame_id,
                    frase.publica,
                    frase.naogeral,
                    count(*) OVER () as total
                FROM frase
                LEFT JOIN exame ON exame.id = frase.exame_id
                LEFT JOIN fraseexa On fraseexa.frase_id = frase.id
                WHERE ${where}
                LIMIT ${limit}
                OFFSET ${(page - 1) * limit}
            `;

            const frases = await Frase.sequelize
                .query(select, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            frases.map(frase => {
                frase.descricao = frase.descricao.trim();
            });

            return res.status(200).json(frases);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Frase, Fraseexa } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo descricao obrigatorio'),
                fraseexa: Yup.array().of(
                    Yup.object().shape({
                        exame_id: Yup.number()
                            .transform(value =>
                                Number.isNaN(value) ? undefined : value
                            )
                            .required('Obrigatorio informar o exame.'),
                    })
                ),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.codalfa) {
                const fraseExists = await Frase.findOne({
                    where: { codalfa: req.body.codalfa.trim() },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (fraseExists && req.body.id !== fraseExists.id.toString()) {
                    return res
                        .status(400)
                        .json({ error: 'Cod. Alfa ja cadastrado.' });
                }
                req.body.codalfa = req.body.codalfa.trim();
            }

            if (req.body.id) {
                const frase = await Frase.findByPk(req.body.id, {
                    include: [{ model: Fraseexa, as: 'fraseexa' }],
                });

                if (!frase) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const fraseexaDelta = getDelta(
                    frase.fraseexa,
                    req.body.fraseexa
                );
                await Frase.sequelize
                    .transaction(async transaction => {
                        // Update fraseexa
                        await Promise.all([
                            fraseexaDelta.added.map(async fraseexaD => {
                                await Fraseexa.create(fraseexaD, {
                                    transaction,
                                }).catch(Frase.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            fraseexaDelta.changed.map(async fraseexaData => {
                                const fraseexa = req.body.fraseexa.find(
                                    _fraseexa =>
                                        _fraseexa.id === fraseexaData.id
                                );
                                await Fraseexa.update(fraseexa, {
                                    where: { id: fraseexa.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            fraseexaDelta.deleted.map(async fraseexaDel => {
                                await fraseexaDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        // Finally update frase
                        const {
                            descricao,
                            exame_id,
                            status,
                            fraseexa,
                        } = req.body;

                        await Frase.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                // Finally update frase
                const { descricao, exame_id, status, fraseexa } = req.body;
                return res.status(200).json({
                    descricao,
                    exame_id,
                    status,
                    fraseexa,
                });
            }
            const {
                id,
                descricao,
                exame_id,
                status,
                fraseexa,
            } = await Frase.create(req.body, {
                include: [{ model: Fraseexa, as: 'fraseexa' }],
            })
                .then(x => {
                    return Frase.findByPk(x.get('id'), {
                        include: [{ model: Fraseexa, as: 'fraseexa' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                descricao,
                exame_id,
                status,
                fraseexa,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Frase } = Database.getModels(req.database);
            await Frase.destroy({
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
                filter = ` CAST("Frase"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Frase"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Frase"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new FraseController();
