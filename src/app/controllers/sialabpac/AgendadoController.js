import * as Yup from 'yup';

import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Agendado from '../../models/sialabpac/Agendado';
import Unidade from '../../models/sialabpac/Unidade';
import User from '../../models/sialabpac/User';
import Agendadoexm from '../../models/sialabpac/Agendadoexm';
import Notificacao from '../../models/sialabpac/Notificacaos';
import Laboratorio from '../../models/sialabpac/Laboratorio';
import Preagendado from '../../models/sialabpac/Preagendado';

import Queue from '../../../lib/Queue';

import AgendadoMail from '../../jobs/AgendadoMail';
import PreparoExameMail from '../../jobs/PreparoExameMail';

import OneSignal from '../../Push/OneSignal';

class AgendadoController {
    async index(req, res) {
        try {
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
                where = ` (Unaccent(upper(trim(coalesce("Ccusto"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Ccusto"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += AgendadoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = AgendadoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const agendados = await Agendado.findAll({
                order: Agendado.sequelize.literal(`${order} ${orderdesc}`),
                where: Agendado.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'preagendado_id',
                    'user_id',
                    'orcamento_id',
                    'datacoleta',
                    'motivo_cancela',
                    [Agendado.sequelize.literal('count(*) OVER ()'), 'total'],
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
                        model: Unidade,
                        as: 'unidade',
                        attributes: ['posto', 'name'],
                    },
                    {
                        model: Laboratorio,
                        as: 'laboratorio',
                        attributes: ['codigo', 'name'],
                        where: { codigo: req.query.labcode },
                    },
                ],
            });
            return res.status(200).json(agendados);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const schema = Yup.object().shape({
                user_id: Yup.number().required(),
                laboratorio_id: Yup.number().required(),
                unidade_id: Yup.number().required(),
                orcamento_id: Yup.number().required(),
                datacoleta: Yup.date().required(),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const agendado = await Agendado.findByPk(req.body.id, {
                    include: [{ model: Agendadoexm, as: 'agendadoexm' }],
                });

                if (!agendado) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const agendado1Delta = getDelta(
                    agendado.agendadoexm,
                    req.body.agendadoexm
                );
                await Agendado.sequelize
                    .transaction(async transaction => {
                        // Update gradeexa
                        await Promise.all([
                            agendado1Delta.added.map(async agendadoexmD => {
                                await Agendadoexm.create(agendadoexmD, {
                                    transaction,
                                }).catch(Agendado.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            agendado1Delta.changed.map(
                                async agendadoexmData => {
                                    const agendadoexm = req.body.agendadoexm.find(
                                        _agendadoexm =>
                                            _agendadoexm.id ===
                                            agendadoexmData.id
                                    );
                                    await Agendadoexm.update(agendadoexm, {
                                        where: { id: agendadoexm.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            agendado1Delta.deleted.map(async agendadoexmDel => {
                                await agendadoexmDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        // Finally update agendado

                        const {
                            id,
                            user_id,
                            laboratorio_id,
                            unidade_id,
                            orcamento_id,
                            datacoleta,
                            agendadoexm,
                        } = await Agendado.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).error(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        return res.json({
                            id,
                            user_id,
                            laboratorio_id,
                            unidade_id,
                            orcamento_id,
                            datacoleta,
                            agendadoexm,
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
            } else {
                await Agendado.sequelize
                    .transaction(async transaction => {
                        await Agendado.create(req.body, {
                            include: [
                                { model: Agendadoexm, as: 'agendadoexm' },
                            ],
                            transaction,
                        })
                            .then(x => {
                                return Agendado.findByPk(x.get('id'), {
                                    include: [
                                        {
                                            model: Agendadoexm,
                                            as: 'agendadoexm',
                                        },
                                    ],
                                    transaction,
                                })
                                    .then(agendado => {
                                        return Notificacao.create(
                                            {
                                                user_id: agendado.user_id,
                                                laboratorio_id:
                                                    agendado.laboratorio_id,
                                                preagendado_id:
                                                    agendado.preagendado_id,
                                                mensagem: `Fique atento foi gerado um novo agendamento No.: ${
                                                    agendado.id
                                                } para o dia ${format(
                                                    new Date(
                                                        agendado.datacoleta
                                                    ),
                                                    'dd MMMM yyyy',
                                                    {
                                                        locale: pt,
                                                    }
                                                )}, acesse e veja o preparo do(s) exame(s) `,
                                                lida: false,
                                            },
                                            transaction
                                        );
                                    })
                                    .then(preagendado => {
                                        return Preagendado.update(
                                            {
                                                id: preagendado.preagendado_id,
                                                status: 'Agendado',
                                            },
                                            {
                                                where: {
                                                    id:
                                                        preagendado.preagendado_id,
                                                },
                                            },
                                            transaction
                                        );
                                    })
                                    .then(async () => {
                                        const userpush = await User.findByPk(
                                            req.body.user_id
                                        );
                                        const onesiignal = OneSignal;
                                        onesiignal.sendNotification({
                                            app_id: userpush.onesignal_app_id,
                                            contents: {
                                                en: `Voce tem um novo agendamento para o dia ${format(
                                                    new Date(
                                                        req.body.datacoleta
                                                    ),
                                                    'dd MMMM yyyy',
                                                    {
                                                        locale: pt,
                                                    }
                                                )}, acesse e veja o preparo do(s) exame(s).`,
                                            },
                                            include_player_ids: [
                                                userpush.onesignal_player_id,
                                            ],
                                        });
                                    })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            })
                            .catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });

                        await User.findByPk(req.body.user_id, {
                            attributes: ['name', 'email'],
                        })
                            .then(async user => {
                                await Queue.add(AgendadoMail.key, {
                                    username: user.name,
                                    email: user.email,
                                    date: new Date(),
                                    datacoleta: req.body.datacoleta,
                                    preagendado_id: req.body.preagendado_id,
                                    orcamento_id: req.body.orcamento_id,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            })
                            .catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });

                        return res
                            .status(200)
                            .json('Agendamento realizado com sucesso!');
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            await Agendado.destroy({
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

    async indexDashLab(req, res) {
        try {
            const lab = await Laboratorio.findOne({
                where: { codigo: req.params.labid },
                attributes: ['id', 'codigo'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (lab) {
                const agendados = await Agendado.findAll({
                    where: Agendado.sequelize.literal(
                        ` "Agendado"."motivo_cancela" isnull and laboratorio_id = '${lab.id}' `
                    ),
                    limit: 1,
                    attributes: [
                        [
                            Agendado.sequelize.literal('count(*) OVER ()'),
                            'total',
                        ],
                    ],
                });
                return res.status(200).json(agendados);
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async sendEmail(req, res) {
        try {
            const layoutLab = await Laboratorio.findOne({
                where: { codigo: req.body.laboratorio_codigo },
                attributes: [
                    'id',
                    'codigo',
                    'name',
                    'cnpj',
                    'color1',
                    'color2',
                    'color3',
                    'logo_base64',
                    'logo_url',
                ],
            }).catch(err=> {
                return res.status(400).json({ error: err.message });
            });

            const userValue = await User.findByPk(req.body.user_id, {
                attributes: ['name', 'email'],
            }).catch(err=> {
                return res.status(400).json({ error: err.message });
            });

            if (!layoutLab) {
                return res.status(400).json({ error: 'Laboratório não encontrado!' });
            }

            const data = req.body;

            for (let i = 0; i < data.agendadoexm.length; i++) {
                const element = data.agendadoexm[i];
                element.primary = layoutLab.color1;
                element.secondary = layoutLab.color2;
                element.tertiary = layoutLab.color3;
            }

            await Queue.add(PreparoExameMail.key, {
                username: userValue.name,
                email: userValue.email,
                preagendado_id: data.preagendado_id,
                orcamento_id: data.orcamento_id,
                examesValues: data.agendadoexm,
                layoutValues: layoutLab,
                paramsLab: data.params,
            }).catch(err => {
                return res
                    .status(400)
                    .json({ error: err.message });
            });

            return res.status(200).json('Agendamento realizado com sucesso!');
        } catch (error) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'unidade.posto':
                filter = ` (upper(trim(coalesce("unidade"."posto",''))) LIKE '%${filterValue.toUpperCase()}%')`;
                break;
            case 'codigo':
                filter = ` CAST("Agendado"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'user.name':
                filter = ` (upper(trim(coalesce("user"."name",''))) LIKE '%${filterValue.toUpperCase()}%')`;
                break;
            case 'orcamento_id':
                filter = ` CAST("Agendado"."orcamento_id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'preagendado_id':
                filter = ` CAST("Agendado"."preagendado_id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'datacoleta':
                filter = ` "Agendado"."datacoleta" between '${filterValue}'`;
                break;
            default:
                filter = null;
        }

        return filter;
    }
}

export default new AgendadoController();
