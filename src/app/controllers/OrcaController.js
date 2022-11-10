import * as Yup from 'yup';
import { QueryTypes } from 'sequelize';
import { format, subDays } from 'date-fns';
import getDelta from '../utils/getDelta';
import Preagendado from '../models/sialabpac/Preagendado';
import Database from '../../database';
import Notificacao from '../models/sialabpac/Notificacaos';

import { calculaDiasMovpacPorParametro } from './functions/functions';

class OrcaController {
    async index(req, res) {
        const { Orca, Motina, Prontuario } = Database.getModels(req.database);
        try {
            const { page = 1, limit = 10 } = req.query;

            const date = await calculaDiasMovpacPorParametro(req)

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';
            const postoperm =
                req.query.postoperm !== '' ? req.query.postoperm : '';

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

                        where += OrcaController.handleFilters(
                            filters[i].id,
                            filters[i].value,
                            date
                        );
                    }
                } else {
                    where = OrcaController.handleFilters(
                        filter,
                        filtervalue,
                        date
                    );
                }
            }

            if (postoperm !== '') {
                where +=
                    where === ''
                        ? ` ("prontuario"."posto" in ('${postoperm.replace(
                              /,/gi,
                              "','"
                          )}'))`
                        : ` and ("prontuario"."posto" in ('${postoperm.replace(
                              /,/gi,
                              "','"
                          )}'))`;
            }

            const orcas = await Orca.findAll({
                order: Orca.sequelize.literal(`${order} ${orderdesc}`),
                where: Orca.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'preagendado_id',
                    'nome',
                    'dataorc',
                    'fone',
                    'status',
                    'total',
                    [
                        Orca.sequelize.literal(
                            ' (select count(orca_id) AS "totalexa" from orca1 where orca_id = "Orca"."id" group by orca_id order by orca_id)'
                        ),
                        'totalexa',
                    ],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: ['posto'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const total_count = await Orca.count({
                where: Orca.sequelize.literal(where),
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: ['posto'],
                    },
                ],
            });
            try {
                if (orcas.length > 0) {
                    orcas[0].total = total_count.toString();
                }
                const orcas_trim = orcas.map(orca => {
                    orca.nome = orca.nome ? orca.nome.trim() : orca.nome;
                    orca.motina.descricao = orca.motina.descricao.trim();
                    return orca;
                });
                return res.status(200).json(orcas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Orca,
                Orca1,
                Exame,
                Prontuario,
                Material,
                Convenio,
                Plano,
                Medico,
            } = Database.getModels(req.database);
            const orca = await Orca.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: ['posto', 'prontuario'],
                    },
                    {
                        model: Orca1,
                        as: 'orca1',
                        attributes: [
                            'id',
                            'orca_id',
                            'exame_id',
                            'valpac',
                            'valconv',
                            'material_id',
                            'convenio_id',
                            'plano_id',
                            'medico_id',
                            'matric',
                            'totdescpac',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'codigo',
                                    'descricao',
                                    'preparo',
                                    'id',
                                    'status',
                                ],
                            },
                            {
                                model: Material,
                                as: 'material',
                                attributes: ['descricao', 'codigo', 'id'],
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['fantasia', 'codigo', 'id'],
                            },
                            {
                                model: Plano,
                                as: 'plano',
                                attributes: [
                                    'codigo',
                                    'descricao',
                                    'percpac',
                                    'percconv',
                                    'id',
                                ],
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: ['nome_med', 'crm', 'id'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!orca) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                orca.nome = orca.nome ? orca.nome.trim() : orca.nome;
                orca.orca1.map(orca1 => {
                    orca1.matric = orca1.matric.trim();
                    if (orca1.exame) {
                        orca1.exame.codigo = orca1.exame.codigo.trim();
                        orca1.exame.descricao = orca1.exame.descricao.trim();
                        orca1.material
                            ? (orca1.material.descricao = orca1.material.descricao.trim())
                            : null;
                        orca1.convenio
                            ? (orca1.convenio.fantasia = orca1.convenio.fantasia.trim())
                            : null;
                        orca1.plano
                            ? (orca1.plano.descricao = orca1.plano.descricao.trim())
                            : null;
                        orca1.medico
                            ? (orca1.medico.nome_med = orca1.medico.nome_med.trim())
                            : null;
                    }
                    return orca1;
                });
                return res.status(200).json(orca);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

        // Listagem Exames - orca1 apenas para exibir
        async indexOne2(req, res) {
            try {
                const { Orca1 } = Database.getModels(req.database);

                const select = `
                        SELECT
                              orca1.id,
                              'ATIVO' as statusexm,
                              exame.codigo,
                              exame.descricao
                        FROM orca1
                        LEFT JOIN exame on exame.id = orca1.exame_id
                        WHERE orca1.orca_id = ${req.params.id}
                        `;

                const exames = await Orca1.sequelize
                    .query(select, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                if (!exames) {
                    return res
                        .status(400)
                        .json({ error: 'Nenhum registro encontrado' });
                }
                return res.status(200).json(exames);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        }

    async createUpdate(req, res) {
        try {
            const { Orca, Orca1 } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                nome: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo nome obrigatorio'),
                orca1: Yup.array().of(
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

            if (req.body.id) {
                const orca = await Orca.findByPk(req.body.id, {
                    include: [{ model: Orca1, as: 'orca1' }],
                });

                if (!orca) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id: ${req.body.id}`,
                    });
                }

                const orca1Delta = getDelta(orca.orca1, req.body.orca1);
                await Orca.sequelize
                    .transaction(async transaction => {
                        // Update gradeexa
                        await Promise.all([
                            orca1Delta.added.map(async orca1D => {
                                orca1D.idopera_ultacao = req.userId;
                                await Orca1.create(orca1D, {
                                    transaction,
                                }).catch(Orca.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            orca1Delta.changed.map(async orca1Data => {
                                const orca1 = req.body.orca1.find(
                                    _orca1 => _orca1.id === orca1Data.id
                                );
                                orca1.idopera_ultacao = req.userId;
                                await Orca1.update(orca1, {
                                    where: { id: orca1.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            orca1Delta.deleted.map(async orca1Del => {
                                await orca1Del
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        req.body.idopera_ultacao = req.userId;

                        await Orca.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).error(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                // Finally update grade
                const { nome, idade, status, orca1 } = req.body;
                return res.status(200).json({
                    nome,
                    idade,
                    status,
                    orca1,
                });
            }
            req.body.idopera_ultacao = req.userId;
            const {
                id,
                nome,
                idade,
                status,
                preagendado_id,
                orca1,
                codelab,
            } = await Orca.create(req.body, {
                include: [{ model: Orca1, as: 'orca1' }],
            })
                .then(x => {
                    return Orca.findByPk(x.get('id'), {
                        include: [{ model: Orca1, as: 'orca1' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (preagendado_id) {
                await Preagendado.update(
                    {
                        orcamento_id: id,
                    },
                    {
                        where: {
                            id: preagendado_id,
                        },
                    }
                );
            }

            if (req.body.preagenda_userid) {
                await Notificacao.create({
                    user_id: req.body.preagenda_userid,
                    laboratorio_id: req.body.codelab,
                    preagendado_id,
                    mensagem: `Fique atento foi gerado um novo orcamento No.: ${id}, acesse e veja o valor do(s) exame(s) `,
                    lida: false,
                });
            }

            return res.status(200).json({
                id,
                nome,
                idade,
                status,
                orca1,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Orca } = Database.getModels(req.database);
            await Orca.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(async deletedRecord => {
                    if (deletedRecord === 1) {
                        await Preagendado.update(
                            {
                                orcamento_id: null,
                            },
                            {
                                where: {
                                    id: req.query.preagendado_id,
                                },
                            }
                        );
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

    static handleFilters(filterName, filterValue, date) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Orca"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'preagendado_id':
                filter = ` CAST("Orca"."preagendado_id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'dataorc':
                filter = ` "Orca"."dataorc" between '${filterValue}'`;
                break;
            case 'nome':
                filter += ` (Unaccent(upper(trim(coalesce("Orca"."nome",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'prontuario.posto':
                filter = ` "prontuario"."posto" LIKE '%${filterValue}%'`;
                break;
            case 'prontuario_orca':
                filter = ` "Orca"."prontuario_id" = '${filterValue}' AND TRIM(COALESCE(STATUSORC,'')) <> 'F' AND COALESCE(PRONTUARIO_ID,0) <> 0`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter = ` (Unaccent(upper(trim(coalesce("Orca"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : (filter = ` ("Orca"."dataorc" >= '${date}')`);
            //   null;
        }

        return filter;
    }
}

export default new OrcaController();
