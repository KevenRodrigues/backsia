import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';

class MedicoReaController {
    async index(req, res) {
        try {
            const { MedicoRea, Motina } = Database.getModels(req.database);
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
                where = `   Unaccent(upper(trim(coalesce("MedicoRea"."nome_medrea",'')))) ilike Unaccent('${search.toUpperCase()}%') or   Unaccent(upper(trim(coalesce("MedicoRea"."crm",'')))) ILIKE '${search.toUpperCase()}%'`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += MedicoReaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = MedicoReaController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const medicosreas = await MedicoRea.findAll({
                order: MedicoRea.sequelize.literal(`${order} ${orderdesc}`),
                where: MedicoRea.sequelize.literal(where),
                attributes: [
                    'id',
                    'crm',
                    'nome_medrea',
                    'status',
                    'fone1',
                    'fone2',
                    'fone3',
                    'celular',
                    'email',
                    'abrev',
                    'ufcrm',
                    'endereco',
                    'bairro',
                    'cep',
                    'uf',
                    'interno',
                    'senha',
                    'enviawww',
                    'padrao',
                    'chavesline',
                    'uncp_bak',
                    'cpf',
                    'espmed_id',
                    'datanasc',
                    'cidade',
                    'idopera_ultacao',

                    [MedicoRea.sequelize.literal('count(*) OVER ()'), 'total'],
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

            const medicosreas_trim = medicosreas.map(medicorea => {
                medicorea.crm = medicorea.crm ? medicorea.crm.trim() : '';
                medicorea.nome_medrea = medicorea.nome_medrea
                    ? medicorea.nome_medrea.trim()
                    : '';
                medicorea.fone1 = medicorea.fone1 ? medicorea.fone1.trim() : '';
                medicorea.fone2 = medicorea.fone2 ? medicorea.fone2.trim() : '';
                medicorea.fone3 = medicorea.fone3 ? medicorea.fone3.trim() : '';
                medicorea.celular = medicorea.celular
                    ? medicorea.celular.trim()
                    : '';
                medicorea.email = medicorea.email ? medicorea.email.trim() : '';
                medicorea.abrev = medicorea.abrev ? medicorea.abrev.trim() : '';
                medicorea.ufcrm = medicorea.ufcrm ? medicorea.ufcrm.trim() : '';
                medicorea.endereco = medicorea.endereco
                    ? medicorea.endereco.trim()
                    : '';
                medicorea.bairro = medicorea.bairro
                    ? medicorea.bairro.trim()
                    : '';
                medicorea.cep = medicorea.cep ? medicorea.cep.trim() : '';
                medicorea.cidade = medicorea.cidade
                    ? medicorea.cidade.trim()
                    : '';
                medicorea.uf = medicorea.uf ? medicorea.uf.trim() : '';
                medicorea.senha = medicorea.senha ? medicorea.senha.trim() : '';
                medicorea.uncp_bak = medicorea.uncp_bak
                    ? medicorea.uncp_bak.trim()
                    : '';
                medicorea.cpf = medicorea.cpf ? medicorea.cpf.trim() : '';
                medicorea.chavesline = medicorea.chavesline
                    ? medicorea.chavesline.trim()
                    : '';
                medicorea.unimed = medicorea.unimed
                    ? medicorea.unimed.trim()
                    : '';
                if (medicorea.motina) {
                    medicorea.motina.descricao = medicorea.motina.descricao.trim();
                }

                return medicorea;
            });

            return res.status(200).json(medicosreas_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                MedicoRea,
                Motina,
                MedicoRea_Repasse,
                Setor,
                Espmed,
                Convenio,
                Exame,
            } = Database.getModels(req.database);
            const medicorea = await MedicoRea.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'crm',
                    'nome_medrea',
                    'status',
                    'fone1',
                    'fone2',
                    'fone3',
                    'celular',
                    'email',
                    'abrev',
                    'ufcrm',
                    'endereco',
                    'bairro',
                    'cep',
                    'uf',
                    'interno',
                    'senha',
                    'enviawww',
                    'padrao',
                    'chavesline',
                    'uncp_bak',
                    'cpf',
                    'espmed_id',
                    'datanasc',
                    'cidade',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Espmed,
                        as: 'espmed',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: MedicoRea_Repasse,
                        order: ['id', 'DESC'],
                        as: 'medicorea_repasse',
                        attributes: [
                            'id',
                            'medicorea_id',
                            'setor_id',
                            'percpac_repas',
                            'percconv_repas',
                            'idopera_ultacao',
                            'exame_id',
                            'valpac_repas',
                            'convenio_id',
                        ],
                        include: [
                            {
                                model: Setor,
                                as: 'setor',
                                attributes: ['id', 'descricao'],
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['id', 'razao'],
                            },
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['id', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!medicorea) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            medicorea.crm = medicorea.crm ? medicorea.crm.trim() : '';
            medicorea.nome_medrea = medicorea.nome_medrea
                ? medicorea.nome_medrea.trim()
                : '';
            medicorea.fone1 = medicorea.fone1 ? medicorea.fone1.trim() : '';
            medicorea.fone2 = medicorea.fone2 ? medicorea.fone2.trim() : '';
            medicorea.fone3 = medicorea.fone3 ? medicorea.fone3.trim() : '';
            medicorea.celular = medicorea.celular
                ? medicorea.celular.trim()
                : '';
            medicorea.email = medicorea.email ? medicorea.email.trim() : '';
            medicorea.abrev = medicorea.abrev ? medicorea.abrev.trim() : '';
            medicorea.ufcrm = medicorea.ufcrm ? medicorea.ufcrm.trim() : '';
            medicorea.endereco = medicorea.endereco
                ? medicorea.endereco.trim()
                : '';
            medicorea.bairro = medicorea.bairro ? medicorea.bairro.trim() : '';
            medicorea.cep = medicorea.cep ? medicorea.cep.trim() : '';
            medicorea.cidade = medicorea.cidade ? medicorea.cidade.trim() : '';
            medicorea.uf = medicorea.uf ? medicorea.uf.trim() : '';
            medicorea.senha = medicorea.senha ? medicorea.senha.trim() : '';
            medicorea.uncp_bak = medicorea.uncp_bak
                ? medicorea.uncp_bak.trim()
                : '';
            medicorea.cpf = medicorea.cpf ? medicorea.cpf.trim() : '';
            medicorea.chavesline = medicorea.chavesline
                ? medicorea.chavesline.trim()
                : '';
            medicorea.unimed = medicorea.unimed ? medicorea.unimed.trim() : '';
            if (medicorea.motina) {
                medicorea.motina.descricao = medicorea.motina.descricao.trim();
            }
            if (medicorea.espmed_id) {
                medicorea.espmed.descricao = medicorea.espmed.descricao.trim();
            }

            medicorea.medicorea_repasse.map(medicorea_repasse => {
                if (medicorea_repasse.setor) {
                    medicorea_repasse.setor.descricao = medicorea_repasse.setor
                        .descricao
                        ? medicorea_repasse.setor.descricao.trim()
                        : '';
                }
                return medicorea_repasse;
            });
            return res.status(200).json(medicorea);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { MedicoRea, MedicoRea_Repasse } = Database.getModels(
                req.database
            );
            const schema = Yup.object().shape({
                nome_medrea: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo nome do medico realizante obrigatorio'),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const medicorea = await MedicoRea.findByPk(req.body.id, {
                    include: [
                        { model: MedicoRea_Repasse, as: 'medicorea_repasse' },
                    ],
                });

                if (!medicorea) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const medicorea_repasseDelta = getDelta(
                    medicorea.medicorea_repasse,
                    req.body.medicorea_repasse
                );

                await MedicoRea.sequelize
                    .transaction(async transaction => {
                        // Update Medicorea_repasse
                        await Promise.all([
                            medicorea_repasseDelta.added.map(
                                async medicorea_repasseD => {
                                    await MedicoRea_Repasse.create(
                                        medicorea_repasseD,
                                        {
                                            transaction,
                                        }
                                    ).catch(MedicoRea.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),

                            medicorea_repasseDelta.changed.map(
                                async medicorea_repasseData => {
                                    const medicorea_repasse = req.body.medicorea_repasse.find(
                                        _medicorea_repasse =>
                                            _medicorea_repasse.id ===
                                            medicorea_repasseData.id
                                    );
                                    await MedicoRea_Repasse.update(
                                        medicorea_repasse,
                                        {
                                            where: { id: medicorea_repasse.id },
                                            transaction,
                                        }
                                    ).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),

                            medicorea_repasseDelta.deleted.map(
                                async medicorea_repasseDel => {
                                    await medicorea_repasseDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                        ]);

                        await MedicoRea.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                const {
                    descricao,
                    status,
                    setor_id,
                    medicorea_id,
                    percpac,
                    percconv,
                } = req.body;

                return res.status(200).json({
                    descricao,
                    status,
                    setor_id,
                    medicorea_id,
                    percpac,
                    percconv,
                });
            }
            const {
                id,
                nome_medrea,
                status,
                percpac,
                percconv,
            } = await MedicoRea.create(req.body, {
                include: [
                    { model: MedicoRea_Repasse, as: 'medicorea_repasse' },
                ],
            })
                .then(x => {
                    return MedicoRea.findByPk(x.get('id'), {
                        include: [
                            {
                                model: MedicoRea_Repasse,
                                as: 'medicorea_repasse',
                            },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                nome_medrea,
                status,
                percpac,
                percconv,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { MedicoRea } = Database.getModels(req.database);
            await MedicoRea.destroy({
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

    async updateMedicoreaMovpac(req, res) {
        try {
            const { Movpac } = Database.getModels(req.database);

            if (req.body.movpac_id) {
                await Movpac.sequelize
                    .transaction(async transaction => {
                        const { movpac_id, medicorea_id } = req.body;

                        await Movpac.update(
                            { medicorea_id },
                            {
                                where: { id: movpac_id },
                                transaction,
                            }
                        ).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        return res.status(200).json({
                            movpac_id,
                            medicorea_id,
                        });
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("MedicoRea"."crm" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("MedicoRea"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("MedicoRea"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new MedicoReaController();
