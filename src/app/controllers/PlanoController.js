import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';
import { QueryTypes } from 'sequelize';

class PlanoController {
    async index(req, res) {
        try {
            const { Plano, Motina } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const registros = await Plano.findAll({
                order: ['id'],
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Plano.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const registros_trim = registros.map(registro => {
                registro.descricao = registro.descricao.trim();
                registro.motina.descricao = registro.motina.descricao.trim();
                return registro;
            });

            return res.status(200).json(registros_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Plano,
                Motina,
                Descoberto,
                Exame,
                Tabela,
                Valespec,
                Naofatura,
                Limite,
                Planodes,
                Convenio_espec,
                Esptab,
            } = Database.getModels(req.database);
            const registro = await Plano.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'convenio_id',
                    'tabela_id',
                    'descricao',
                    'tabela_id',
                    'codigo',
                    'padrao',
                    'percpac',
                    'percconv',
                    'valch',
                    'obs',
                    'status',
                    'idopera_ultacao',
                    'usuario',
                    'valfilme',
                    'codfilme',
                    'motivo',
                    'limite',
                    'mpercconv',
                    'mpercpac',
                    'fpercpac',
                    'fpercconv',
                    'autoriza',
                    'deparapla',
                    'valorauto',
                    'autori',
                    'ambobriga',
                    'descmat',
                    'codigofilm',
                    'tipotab',
                    'umexapormes',
                    'umexapormat',
                    'exibmattiss',
                    'valcopart',
                    'dtultger',
                    'operador_id_ultger',
                    'marca',
                    'dtultgerini',
                    'dtultgerfin',
                    'umexaporperiodo',
                    'diasexaage',
                    'banda_porte',
                    'banda_uco',
                    'valor_pacote',
                    'total_exames_realizados',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    { model: Tabela, as: 'tabela', attributes: ['descricao'] },
                    {
                        model: Descoberto,
                        as: 'descoberto',
                        attributes: [
                            'id',
                            'exame_id',
                            'plano_id',
                            'convenio_id',
                            'motivo_desc',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Valespec,
                        as: 'valespec',
                        attributes: [
                            'id',
                            'exame_id',
                            'plano_id',
                            'convenio_id',
                            'valorexa',
                            'codamb',
                            'percpac',
                            'percconv',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Naofatura,
                        as: 'naofatura',
                        attributes: [
                            'id',
                            'exame_id',
                            'plano_id',
                            'convenio_id',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Limite,
                        attributes: [
                            'id',
                            'exame_id',
                            'plano_id',
                            'convenio_id',
                            'qtd',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Planodes,
                        as: 'planodes',
                        attributes: [
                            'id',
                            'plano_id',
                            'convenio_id',
                            'faixaini',
                            'faixafin',
                            'porcdesc',
                            'idopera_ultacao',
                        ],
                    },
                    {
                        model: Convenio_espec,
                        as: 'convenio_espec',
                        attributes: [
                            'id',
                            'plano_id',
                            'convenio_id',
                            'esptab_id',
                            'valorch',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Esptab,
                                as: 'esptab',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!registro) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            registro.descricao = registro.descricao.trim();
            registro.motina.descricao = registro.motina.descricao.trim();
            return res.status(200).json(registro);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexConv(req, res) {
        try {
            const { Plano, Motina, Tabela } = Database.getModels(req.database);
            const registros = await Plano.findAll({
                where: { convenio_id: req.params.convenio_id },
                attributes: [
                    'id',
                    'convenio_id',
                    'descricao',
                    'tabela_id',
                    'codigo',
                    'padrao',
                    'percpac',
                    'percconv',
                    'valch',
                    'obs',
                    'status',
                    'idopera_ultacao',
                    'usuario',
                    'valfilme',
                    'codfilme',
                    'motivo',
                    'limite',
                    'mpercconv',
                    'mpercpac',
                    'fpercpac',
                    'fpercconv',
                    'autoriza',
                    'deparapla',
                    'valorauto',
                    'autori',
                    'ambobriga',
                    'descmat',
                    'codigofilm',
                    'tipotab',
                    'umexapormes',
                    'umexapormat',
                    'exibmattiss',
                    'valcopart',
                    'dtultger',
                    'operador_id_ultger',
                    'marca',
                    'dtultgerini',
                    'dtultgerfin',
                    'umexaporperiodo',
                    'diasexaage',
                    'banda_porte',
                    'banda_uco',
                    'valor_pacote',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    { model: Tabela, as: 'tabela', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!registros) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            const registros_trim = registros.map(registro => {
                registro.descricao = registro.descricao.trim();
                registro.motina.descricao = registro.motina.descricao.trim();
                if(registro.tabela)
                    registro.tabela.descricao = registro.tabela.descricao.trim();
                return registro;
            });
            return res.status(200).json(registros_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexValorexa(req, res) {
        try {
            const { Plano } = Database.getModels(req.database);

            const valorexa = await Plano.sequelize
                .query(
                    "select valorexa(:plano_id,:exame_id,'P') as valpac, valorexa(:plano_id,:exame_id,'C') as valconv",
                    {
                        replacements: {
                            plano_id: req.query.plano_id,
                            exame_id: req.query.exame_id,
                        },
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(valorexa);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexCalculoExame(req, res) {
        try {
            const { Plano } = Database.getModels(req.database);
            const { dataInicio, dataFim, itemId, convenioId } = req.query;

            const valorTotal = await Plano.sequelize
                .query(
                    `SELECT DISTINCT
                        count(movexa.id) as total_exames,
                        plano.limite,
                        convenio.fantasia as desc_convenio,
                        plano.descricao as desc_plano
                    FROM movexa
                    LEFT JOIN convenio ON (convenio.id = movexa.convenio_id)
                    LEFT JOIN plano ON (plano.convenio_id = convenio.id)
                    WHERE plano.limite > 0
                        and plano.percconv > 0.00
                        and movexa.dataentra between '${dataInicio}' and '${dataFim}'
                        and plano.convenio_id = ${convenioId}
                        and plano.id = ${itemId}
                    GROUP BY plano.limite, convenio.fantasia, plano.descricao
                    ORDER BY convenio.fantasia, plano.descricao, plano.limite
                    `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(valorTotal);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const {
                Plano,
                Descoberto,
                Valespec,
                Naofatura,
                Limite,
                Planodes,
                Convenio_espec,
            } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo descricao obrigatorio'),
                status: Yup.number().required('Campo descricao obrigatorio'),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const plano = await Plano.findByPk(req.body.id, {
                    include: [
                        { model: Descoberto, as: 'descoberto' },
                        { model: Valespec, as: 'valespec' },
                        { model: Naofatura, as: 'naofatura' },
                        { model: Limite },
                        { model: Planodes, as: 'planodes' },
                        { model: Convenio_espec, as: 'convenio_espec' },
                    ],
                });

                if (!plano) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const planoDelta = getDelta(
                    plano.descoberto,
                    req.body.descoberto
                );
                const planoValespDelta = getDelta(
                    plano.valespec,
                    req.body.valespec
                );
                const planoNaofaturaDelta = getDelta(
                    plano.naofatura,
                    req.body.naofatura
                );
                const planoLimiteDelta = getDelta(
                    plano.Limites,
                    req.body.Limites
                );
                const planodesDelta = getDelta(
                    plano.planodes,
                    req.body.planodes
                );
                const planoconv_especDelta = getDelta(
                    plano.convenio_espec,
                    req.body.convenio_espec
                );
                await Plano.sequelize
                    .transaction(async transaction => {
                        // Update descoberto
                        await Promise.all([
                            // Descoberto
                            planoDelta.added.map(async descobertoD => {
                                await Descoberto.create(descobertoD, {
                                    transaction,
                                }).catch(Plano.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planoDelta.changed.map(async descobertoData => {
                                const descoberto = req.body.descoberto.find(
                                    _descoberto =>
                                        _descoberto.id === descobertoData.id
                                );
                                await Descoberto.update(descoberto, {
                                    where: { id: descoberto.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planoDelta.deleted.map(async descobertoDel => {
                                await descobertoDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            // Descoberto

                            // Valores Especiais
                            planoValespDelta.added.map(async valespecD => {
                                await Valespec.create(valespecD, {
                                    transaction,
                                }).catch(Plano.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planoValespDelta.changed.map(async valespecData => {
                                const valespec = req.body.valespec.find(
                                    _valespec =>
                                        _valespec.id === valespecData.id
                                );
                                await Valespec.update(valespec, {
                                    where: { id: valespec.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planoValespDelta.deleted.map(async valespecDel => {
                                await valespecDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            // Valores Especiais

                            // Nao Fatura
                            planoNaofaturaDelta.added.map(async naofaturaD => {
                                await Naofatura.create(naofaturaD, {
                                    transaction,
                                }).catch(Plano.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planoNaofaturaDelta.deleted.map(
                                async naofaturaDel => {
                                    await naofaturaDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            // Nao Fatura
                            // Limite
                            planoLimiteDelta.added.map(async limiteD => {
                                await Limite.create(limiteD, {
                                    transaction,
                                }).catch(Plano.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planoLimiteDelta.deleted.map(async limiteDel => {
                                await limiteDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            // Limite
                            // Planodes
                            planodesDelta.added.map(async planodesD => {
                                await Planodes.create(planodesD, {
                                    transaction,
                                }).catch(Plano.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            planodesDelta.deleted.map(async planodesDel => {
                                await planodesDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            // Planodes
                            // Convenio espec
                            planoconv_especDelta.added.map(
                                async planoconv_especD => {
                                    await Convenio_espec.create(
                                        planoconv_especD,
                                        {
                                            transaction,
                                        }
                                    ).catch(Plano.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            planoconv_especDelta.deleted.map(
                                async planoconv_especDel => {
                                    await planoconv_especDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            // Convenio espec
                        ]);

                        await Plano.update(req.body, {
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
                const {
                    id,
                    convenio_id,
                    descricao,
                    status,
                    descoberto,
                    valespec,
                } = req.body;

                return res.status(200).json({
                    id,
                    convenio_id,
                    descricao,
                    status,
                    descoberto,
                    valespec,
                });
            }
            const {
                id,
                convenio_id,
                descricao,
                status,
                descoberto,
                valespec,
            } = await Plano.create(req.body, {
                include: [
                    { model: Descoberto, as: 'descoberto' },
                    { model: Valespec, as: 'valespec' },
                    { model: Naofatura, as: 'naofatura' },
                    { model: Limite },
                    { model: Planodes, as: 'planodes' },
                    { model: Convenio_espec, as: 'convenio_espec' },
                ],
            })
                .then(x => {
                    return Plano.findByPk(x.get('id'), {
                        include: [
                            { model: Descoberto, as: 'descoberto' },
                            { model: Valespec, as: 'valespec' },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                convenio_id,
                descricao,
                status,
                descoberto,
                valespec,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Plano } = Database.getModels(req.database);
            await Plano.destroy({
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

    async getDescontoPlano(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { plano_id } = req.params;
            const { total_paciente } = req.query;

            const result = await sequelize
                .query(`
                    SELECT PORCDESC
                    FROM PLANODES
                    WHERE ${total_paciente} BETWEEN FAIXAINI AND FAIXAFIN
                        AND PLANODES.PLANO_ID = ${plano_id}
                `, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getDeparaPlano(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            let { exames } = req.query;

            exames = JSON.parse(exames);

            const tabelaPlanos = []
            for (let i = 0; i < exames.length; i++) {
                const exame = exames[i];
                const result = await sequelize
                    .query(`
                        SELECT
                            CAST(TRIM(COALESCE(
                            (CASE WHEN TRIM(COALESCE(TABELA1.DEPARA3EXAME,'')) = '' THEN
                                TABELA.DEPARA3
                            ELSE
                                COALESCE(TABELA1.DEPARA3EXAME,'')
                            END),'')) AS CHAR(10)) AS DEPARAFAT,
                            TABELA.DEPARA3,
                            TABELA1.DEPARA3EXAME
                        FROM TABELA
                        LEFT JOIN PLANO   ON PLANO.ID = ${exame.plano_id}
                        LEFT JOIN TABELA1 ON TABELA1.TABELA_ID = COALESCE(PLANO.TABELA_ID,0)
                        WHERE TABELA.ID = COALESCE(PLANO.TABELA_ID,0) AND TABELA1.EXAME_ID = ${exame.exame_id}
                    `, { type: QueryTypes.SELECT })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                tabelaPlanos.push({...exame, ...result[0]});
            }

            return res.status(200).json(tabelaPlanos);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new PlanoController();
