import * as Yup from 'yup';

import aws from 'aws-sdk';

import { QueryTypes } from 'sequelize';
import { format, parseISO } from 'date-fns';

import { PegaData } from './functions/functions';
import Database from '../../database';
import getDelta from '../utils/getDelta';
import { gerarRelatorioHtml } from './functions/functions';

const s3 = new aws.S3();

class ConvenioController {
    async index(req, res) {
        try {
            const { Convenio, Motina } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';
            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';
            // Verificacao se usuario possui convenios permitidos para filtros apenas eles
            const convperm =
                req.query.convperm !== '' ? req.query.convperm : '';

            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                if (convperm !== '') {
                    where +=
                        where === ''
                            ? ` ("Convenio"."codigo" in ('${convperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("Convenio"."codigo" in ('${convperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                } else {
                    where = ` "Convenio"."status" = 0 and (Unaccent(upper(trim(coalesce("Convenio"."razao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')
                    or (Unaccent(upper(trim(coalesce("Convenio"."fantasia",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')
                    or (CAST("Convenio"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')))`;
                }
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += ConvenioController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = ConvenioController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }


            const convenios = await Convenio.findAll({
                order: Convenio.sequelize.literal(`${order} ${orderdesc}`),
                where: Convenio.sequelize.literal(where),
                attributes: [
                    'id',
                    'codigo',
                    'fantasia',
                    'razao',
                    'status',
                    'idopera_ultacao',
                    [Convenio.sequelize.literal('count(*) OVER ()'), 'total'],
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

            const convenios_trim = convenios.map(convenio => {
                convenio.fantasia = convenio.fantasia.trim();
                convenio.razao = convenio.razao.trim();
                if (convenio.motina) {
                    convenio.motina.descricao = convenio.motina.descricao.trim();
                }
                return convenio;
            });

            return res.status(200).json(convenios_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Convenio,
                Motina,
                Plano,
                Entrega,
                Envio,
                Empresa,
                Contato,
                ConvenioTiss,
                ConvenioSus,
                ConvenioLembrete,
                Exame,
            } = Database.getModels(req.database);
            const convenio = await Convenio.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'entrega_id',
                    'envio_id',
                    'codigo',
                    'razao',
                    'fantasia',
                    'cgc_cpf',
                    'ie',
                    'obs',
                    'status',
                    'idopera_ultacao',
                    'fone',
                    'fone2',
                    'ramal',
                    'fax',
                    'endereco',
                    'bairro',
                    'cidade',
                    'uf',
                    'cep',
                    'email',
                    'site',
                    'ruabol',
                    'ruanot',
                    'ruaout',
                    'bairrobol',
                    'bairronot',
                    'bairroout',
                    'ufbol',
                    'ufnot',
                    'ufout',
                    'cidadebol',
                    'cidadenot',
                    'cidadeout',
                    'cepbol',
                    'cepnot',
                    'cepout',
                    'contrato',
                    'validade',
                    'diapgto',
                    'valorcontr',
                    'informa',
                    'motivo',
                    'senha',
                    'limite',
                    'requisicao',
                    'guia',
                    'comprova',
                    'matricula',
                    'controle',
                    'infcid',
                    'modulo',
                    'locconve',
                    'tipopg',
                    'tiposub',
                    'tiposub2',
                    'tiposub3',
                    'lis',
                    'database_',
                    'responsa',
                    'codeletron',
                    'impriconta',
                    'tamanhomat',
                    'ordemnf',
                    'remessa',
                    'lote',
                    'ramalf',
                    'conta2',
                    'contatoout',
                    'contatonf',
                    'contatobol',
                    'orides',
                    'marca',
                    'datai',
                    'dataf',
                    'prazo_pag',
                    'dia_base',
                    'tipo_pes',
                    'registro',
                    'valaut',
                    'numtra',
                    'usatiss',
                    'usatissnew',
                    'chklotehash',
                    'gerarqnumtran',
                    'cabecalho',
                    'codconv',
                    'guiaauto',
                    'tipocr',
                    'tipocs',
                    'empcs_id',
                    'empcr_id',
                    'guiaautomanual',
                    'verifmatric',
                    'modulo11',
                    'naoautoinc',
                    'impest',
                    'qtdchar',
                    'chkcodconv',
                    'chknumaut',
                    'chkagrupa',
                    'chkguia',
                    'chkguia100',
                    'chkcid',
                    'chkversao',
                    'naovenc',
                    'agrupatiss',
                    'qtdchar2',
                    'qtdchar3',
                    'condominio',
                    'obsnf',
                    'boletoemail',
                    'im',
                    'endcob',
                    'repre',
                    'emitenf',
                    'chkguiaope',
                    'financ',
                    'chkseparafilme',
                    'chkguia70',
                    'codconvcon',
                    'dia',
                    'qtdcharguia',
                    'qtdcharguia2',
                    'qtdcharguia3',
                    'exibmattiss',
                    'chkguia50',
                    'diasent',
                    'usadiasent',
                    'senhainter',
                    'login',
                    'gerainter',
                    'todos_exa_urg',
                    'tiss_ordem_alfa',
                    'dtemissaoguia',
                    'dtautguia',
                    'chkguiaprinc',
                    'depara',
                    'pl_contas_id',
                    'ccusto_id',
                    'labap_id',
                    'caminho_arqapoiado',
                    'gerainter_codigoctrl',
                    'exige_codigoctrl',
                    'chkpronturg',
                    'chkguiaout',
                    'qtdout',
                    'chknaoexeccomp',
                    'postopermconv',
                    'guiamatfilme',
                    'cabrtfconv',
                    'rodrtfconv',
                    'fchrtfconv',
                    'exame0_cab',
                    'exame0_fch',
                    'exame0_rdp',
                    'cabeca_bmp',
                    'rodape_bmp',
                    'fundo_bmp',
                    'examema0_cab',
                    'examema0_fch',
                    'examema0_rdp',
                    'validadorunimed',
                    'postob2b',
                    'qtdexamsg',
                    'lotecon',
                    'conffat_exige_depara3',
                    'conffat_exige_cbos',
                    'avisa_exa_cad_dias',
                    'diasexaage_conv',
                    'lotexml',
                    'cmdunimed',
                    'retemperc',
                    'retempercrps',
                    'posto_id',
                    [`trim(coalesce("Convenio"."tiss_loginprest",''))`,'tiss_loginprest'],
                    'tiss_senhaprest',
                    'usaorizon',
                    'loginorizon',
                    'senhaorizon',
                    'enderecoorizon',
                    'partorizon',
                    'contato',
                    'guia_tiss_logo_key',
                    'guia_tiss_logo_url',
                    'guia_tiss_logo_type'
                ],
                include: [
                    { model: Plano, as: 'plano', attributes: ['descricao'] },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                        attributes: ['descricao', 'codigo'],
                    },
                    {
                        model: Envio,
                        as: 'envio',
                        attributes: ['descricao', 'codigo'],
                    },
                    { model: Contato, as: 'contatos', attributes: ['nome'] },
                    {
                        model: Empresa,
                        as: 'empresa_cr',
                        attributes: ['razao', ['id', 'codigo']],
                    },
                    {
                        model: Empresa,
                        as: 'empresa_cs',
                        attributes: ['razao', ['id', 'codigo']],
                    },
                    {
                        model: ConvenioTiss,
                        as: 'convenio_tiss',
                        attributes: ['arquivo',],
                    },
                    {
                        model: ConvenioSus,
                        as: 'conveniosusexame',
                        attributes: [
                            'id',
                            'exame_id',
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
                        model: ConvenioLembrete,
                        as: 'conveniolembreteexame',
                        attributes: [
                            'id',
                            'exame_id',
                            'convenio_id',
                            'idopera_ultacao',
                            'lembrete',
                        ],
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

            if (!convenio) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum convenio encontrado' });
            }

            convenio.fantasia = convenio.fantasia
                ? convenio.fantasia.trim()
                : '';
            convenio.razao = convenio.razao ? convenio.razao.trim() : '';
            convenio.login = convenio.login ? convenio.login.trim() : '';
            convenio.senhainter = convenio.senhainter ? convenio.senhainter.trim() : '';
            convenio.depara = convenio.depara ? convenio.depara.trim() : '';
            convenio.motina.descricao = convenio.motina.descricao.trim();
            return res.status(200).json(convenio);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const {
                Convenio,
                Contato,
                ConvenioSus,
                ConvenioLembrete,
                Plano,
                Descoberto,
                Valespec,
                Naofatura,
                Limite,
                Planodes,
                Convenio_espec,
            } = Database.getModels(req.database);
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
                const convenio = await Convenio.findByPk(req.body.id, {
                    include: [
                        {
                            model: Plano,
                            as: 'plano',
                            include: [
                                { model: Descoberto, as: 'descoberto' },
                                { model: Valespec, as: 'valespec' },
                                { model: Naofatura, as: 'naofatura' },
                                { model: Limite },
                                { model: Planodes, as: 'planodes' },
                                { model: Convenio_espec, as: 'convenio_espec' },
                            ]
                        },
                        { model: Contato, as: 'contatos' },
                        { model: ConvenioSus, as: 'conveniosusexame' },
                        {
                            model: ConvenioLembrete,
                            as: 'conveniolembreteexame',
                        },
                    ],
                });

                if (!convenio) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const convenioPlanoDelta = getDelta(convenio.plano, req.body.planos);

                const conveniocontatoDelta = getDelta(
                    convenio.contatos,
                    req.body.contatos
                );

                const convenioSusExameDelta = getDelta(
                    convenio.conveniosusexame,
                    req.body.conveniosusexame
                );

                const convenioLembreteExameDelta = getDelta(
                    convenio.conveniolembreteexame,
                    req.body.conveniolembreteexame
                );

                await Convenio.sequelize
                    .transaction(async transaction => {
                        // Update plano
                        await Promise.all([
                            // plano
                            convenioPlanoDelta.added.map(async planoData => {
                                const {id: plano_id} = await Plano.create(planoData, {
                                    transaction,
                                }).catch(Convenio.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });

                                planoData.descoberto.map(async (item) => {
                                    await Descoberto.create({...item, plano_id: plano_id}, {
                                        transaction,
                                    }).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                })

                                planoData.valespec.map(async (item) => {
                                    await Valespec.create({...item, plano_id: plano_id}, {
                                        transaction,
                                    }).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                })

                                planoData.naofatura.map(async (item) => {
                                    await Naofatura.create({...item, plano_id: plano_id}, {
                                        transaction,
                                    }).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                })

                                planoData.Limites.map(async (item) => {
                                    await Limite.create({...item, plano_id: plano_id}, {
                                        transaction,
                                    }).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                })

                                planoData.planodes.map(async (item) => {
                                    await Planodes.create({...item, plano_id: plano_id}, {
                                        transaction,
                                    }).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                })

                                planoData.convenio_espec.map(async (item) => {
                                    await Convenio_espec.create({...item, plano_id: plano_id}, {
                                        transaction,
                                    }).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                })
                            }),
                            convenioPlanoDelta.changed.map(async planoData => {
                                const planoFront = req.body.planos.find(
                                    _plano => _plano.id === planoData.id
                                );

                                if(planoFront.descoberto && planoFront.descoberto.length >= 0){

                                    const planoDescobertoDelta = getDelta(
                                        planoData.descoberto,
                                        planoFront.descoberto
                                    );

                                    await Promise.all([
                                        planoDescobertoDelta.added.map(async descobertoD => {
                                            await Descoberto.create({...descobertoD, plano_id: planoData.id}, {
                                                transaction,
                                            }).catch(Plano.sequelize, err => {
                                                return res
                                                    .status(400)
                                                    .json({ error: err.message });
                                            });
                                        }),
                                        planoDescobertoDelta.deleted.map(async descobertoDel => {
                                            await descobertoDel
                                                .destroy({ transaction })
                                                .catch(err => {
                                                    return res
                                                        .status(400)
                                                        .json({ error: err.message });
                                                });
                                        })
                                    ]);
                                }

                                if(planoFront.valespec && planoFront.valespec.length >= 0){
                                    const planoValespDelta = getDelta(
                                        planoData.valespec,
                                        planoFront.valespec
                                    );

                                    await Promise.all([
                                        planoValespDelta.added.map(async valespecD => {
                                            await Valespec.create({...valespecD, plano_id: planoData.id}, {
                                                transaction,
                                            }).catch(Plano.sequelize, err => {
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
                                        })
                                    ]);
                                }

                                if(planoFront.naofatura && planoFront.naofatura.length >= 0){
                                    const planoNaofaturaDelta = getDelta(
                                        planoData.naofatura,
                                        planoFront.naofatura
                                    );

                                    await Promise.all([
                                        planoNaofaturaDelta.added.map(async naofaturaD => {
                                            await Naofatura.create({...naofaturaD, plano_id: planoData.id}, {
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
                                        )
                                    ]);
                                }

                                if(planoFront.Limites && planoFront.Limites.length >= 0){
                                    const planoLimiteDelta = getDelta(
                                        planoData.Limites,
                                        planoFront.Limites
                                    );

                                    await Promise.all([
                                        planoLimiteDelta.added.map(async limiteD => {
                                            await Limite.create({...limiteD, plano_id: planoData.id}, {
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
                                    ]);
                                }

                                if(planoFront.planodes && planoFront.planodes.length >= 0){
                                    const planodesDelta = getDelta(
                                        planoData.planodes,
                                        planoFront.planodes
                                    );

                                    await Promise.all([
                                        planodesDelta.added.map(async planodesD => {
                                            await Planodes.create({...planodesD, plano_id: planoData.id}, {
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
                                    ])
                                }

                                if(planoFront.convenio_espec && planoFront.convenio_espec.length >= 0){
                                    const planoConvEspecDelta = getDelta(
                                        planoData.convenio_espec,
                                        planoFront.convenio_espec
                                    );

                                    await Promise.all([
                                        planoConvEspecDelta.added.map(
                                            async planoconv_especD => {
                                                await Convenio_espec.create(
                                                    {...planoconv_especD, plano_id: planoData.id},
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
                                        planoConvEspecDelta.deleted.map(
                                            async planoconv_especDel => {
                                                await planoconv_especDel
                                                    .destroy({ transaction })
                                                    .catch(err => {
                                                        return res
                                                            .status(400)
                                                            .json({ error: err.message });
                                                    });
                                            }
                                        )
                                    ]);
                                }


                                await Plano.update(planoFront, {
                                    where: { id: planoFront.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            convenioPlanoDelta.deleted.map(async planoDel => {
                                await planoDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            // contato
                            conveniocontatoDelta.added.map(async contatoD => {
                                await Contato.create(contatoD, {
                                    transaction,
                                }).catch(Convenio.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            conveniocontatoDelta.changed.map(
                                async contatoData => {
                                    const contato = req.body.contatos.find(
                                        _contato =>
                                            _contato.id === contatoData.id
                                    );
                                    await Contato.update(contato, {
                                        where: { id: contato.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            conveniocontatoDelta.deleted.map(
                                async contatoDel => {
                                    await contatoDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            // Sus Exame
                            convenioSusExameDelta.added.map(
                                async convenioSusExameD => {
                                    await ConvenioSus.create(
                                        convenioSusExameD,
                                        {
                                            transaction,
                                        }
                                    ).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            convenioSusExameDelta.changed.map(
                                async conveniosusexameData => {
                                    const conveniosusexame = req.body.conveniosusexame.find(
                                        _conveniosusexame =>
                                            _conveniosusexame.id ===
                                            conveniosusexameData.id
                                    );
                                    await ConvenioSus.update(conveniosusexame, {
                                        where: { id: conveniosusexame.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            convenioSusExameDelta.deleted.map(
                                async convenioSusExameDel => {
                                    await convenioSusExameDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            // Lembrete Exame
                            convenioLembreteExameDelta.added.map(
                                async convenioLembreteExameD => {
                                    await ConvenioLembrete.create(
                                        convenioLembreteExameD,
                                        {
                                            transaction,
                                        }
                                    ).catch(Convenio.sequelize, err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            convenioLembreteExameDelta.changed.map(
                                async conveniolembreteexameData => {
                                    const conveniolembreteexame = req.body.conveniolembreteexame.find(
                                        _conveniolembreteexame =>
                                            _conveniolembreteexame.id ===
                                            conveniolembreteexameData.id
                                    );
                                    await ConvenioLembrete.update(
                                        conveniolembreteexame,
                                        {
                                            where: {
                                                id: conveniolembreteexame.id,
                                            },
                                            transaction,
                                        }
                                    ).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            convenioLembreteExameDelta.deleted.map(
                                async convenioLembreteExameDel => {
                                    await convenioLembreteExameDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                        ]);

                        await Convenio.update(req.body, {
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
                    razao,
                    status,
                    plano,
                    contato,
                    conveniosusexame,
                    conveniolembreteexame,
                } = req.body;
                return res.status(200).json({
                    razao,
                    status,
                    plano,
                    contato,
                    conveniosusexame,
                    conveniolembreteexame,
                });
            }

            const {
                id,
                razao,
                status,
                plano,
                contatos,
                conveniosusexame,
                conveniolembreteexame,
            } = await Convenio.create(req.body, {
                include: [
                    { model: Plano, as: 'plano',
                        include: [
                            { model: Descoberto, as: 'descoberto' },
                            { model: Valespec, as: 'valespec' },
                            { model: Naofatura, as: 'naofatura' },
                            { model: Limite },
                            { model: Planodes, as: 'planodes' },
                            { model: Convenio_espec, as: 'convenio_espec' },
                        ]
                    },
                    { model: Contato, as: 'contatos' },
                    { model: ConvenioSus, as: 'conveniosusexame' },
                    {
                        model: ConvenioLembrete,
                        as: 'conveniolembreteexame',
                    },
                ],
            })
                .then(x => {
                    Object.keys(x.rawAttributes)
                    return Convenio.findByPk(x.get('id'), {
                        include: [
                            { model: Plano, as: 'plano' },
                            { model: Contato, as: 'contatos' },
                            { model: ConvenioSus, as: 'conveniosusexame' },
                            {
                                model: ConvenioLembrete,
                                as: 'conveniolembreteexame',
                            },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                razao,
                status,
                plano,
                contatos,
                conveniosusexame,
                conveniolembreteexame,
            });
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

    async validaVencimento(req, res) {
        try {
            // 2023-07-31
            const { Convenio, Operador } = Database.getModels(req.database);
            const convenio = await Convenio.findOne({
                where: { id: req.params.id },
                attributes: ['naovenc'],
            }).catch(err => {
                throw new Error(err.message);
            });

            const getParam = await Operador.sequelize
                .query(`select dt_banco from param, param2`, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    throw new Error(err.message);
                });
            const { dt_banco } = getParam[0];

            const dtPlano = req.body.valplano
                ? parseISO(req.body.valplano)
                : null;
            const dtAtual = await PegaData(req, dt_banco);

            let retorno = {
                valido: true,
            };

            if (convenio.naovenc === '1') {
                if (dtPlano && dtPlano < dtAtual) {
                    retorno = {
                        valido: false,
                        mensagem:
                            'Data de validade da carteirinha expirada não será possivel cadastrar o atendimento com esse prontuário',
                        codigo: 1,
                    };
                }
            } else if (dtPlano && dtPlano < dtAtual) {
                retorno = {
                    valido: false,
                    mensagem: 'Data de validade da carteirinha expirada',
                    codigo: 2,
                };
            }

            res.status(200).json(retorno);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async validaConvenio(req, res) {
        try {
            const { Convenio } = Database.getModels(req.database);
            const convperm =
                req.query.convperm !== '' ? req.query.convperm : '';

            let where = ` WHERE ("convenio"."codigo" = '${req.params.id}') `;

            if (convperm) {
                where += ` AND ("convenio"."codigo" in ('${convperm.replace(
                    /,/gi,
                    "','"
                )}'))`;
            }

            const convenios = await Convenio.sequelize
                .query(
                    `SELECT convenio.bairro,
                        convenio.bairrobol,
                        convenio.bairronot,
                        convenio.bairroout,
                        convenio.cep,
                        convenio.cepbol,
                        convenio.cepnot,
                        convenio.cepout,
                        convenio.cgc_cpf,
                        convenio.cidade,
                        convenio.cidadebol,
                        convenio.cidadenot,
                        convenio.cidadeout,
                        convenio.codeletron,
                        convenio.codigo,
                        convenio.comprova,
                        convenio.conta2,
                        convenio.contato,
                        convenio.contatobol,
                        convenio.contatonf,
                        convenio.contatoout,
                        convenio.contrato,
                        convenio.controle,
                        convenio.database_,
                        convenio.dataf,
                        convenio.datai,
                        convenio.diapgto,
                        convenio.email,
                        convenio.endereco,
                        convenio.entrega_id,
                        convenio.envio_id,
                        convenio.fantasia,
                        convenio.fax,
                        convenio.fone,
                        convenio.fone2,
                        convenio.guia,
                        convenio.id,
                        convenio.ie,
                        convenio.impriconta,
                        convenio.infcid,
                        convenio.informa,
                        convenio.limite,
                        convenio.lis,
                        convenio.locconve,
                        convenio.lote,
                        convenio.marca,
                        convenio.matricula,
                        convenio.modulo,
                        convenio.motivo,
                        convenio.obs,
                        convenio.ordemnf,
                        convenio.orides,
                        convenio.ramal,
                        convenio.ramalf,
                        convenio.razao,
                        convenio.remessa,
                        convenio.requisicao,
                        convenio.responsa,
                        convenio.ruabol,
                        convenio.ruanot,
                        convenio.ruaout,
                        convenio.senha,
                        convenio.site,
                        convenio.status,
                        convenio.tamanhomat,
                        convenio.tipopg,
                        convenio.tiposub,
                        convenio.tiposub2,
                        convenio.tiposub3,
                        convenio.uf,
                        convenio.ufbol,
                        convenio.ufnot,
                        convenio.ufout,
                        convenio.validade,
                        convenio.valorcontr,
                        convenio.dia_base,
                        convenio.prazo_pag,
                        convenio.tipo_pes,
                        envio.codigo as cod_envio,
                        envio.descricao as desc_envio,
                        entrega.codigo as cod_entrega,
                        entrega.descricao as desc_entrega,
                        convenio.registro,
                        convenio.numtra,
                        convenio.valaut,
                        convenio.usatiss,
                        convenio.cabecalho,
                        convenio.codconv,
                        convenio.guiaauto,
                        convenio.tipocr,
                        convenio.tipocs,
                        convenio.empcr_id,
                        cr.fantasia as fancr,
                        convenio.empcs_id,
                        cs.fantasia as fancs,
                        convenio.guiaautomanual,
                        convenio.verifmatric,
                        convenio.modulo11,
                        convenio.naoautoinc,
                        convenio.impest,
                        convenio.qtdchar,
                        convenio.chkcodconv,
                        convenio.chknumaut,
                        convenio.chkagrupa,
                        convenio.chkguia,
                        convenio.chkguia100,
                        convenio.chkcid,
                        convenio.chkversao,
                        convenio.naovenc,
                        convenio.agrupatiss,
                        convenio.qtdchar2,
                        convenio.qtdchar3,
                        convenio.chkguiaope,
                        chkguia50,
                        convenio.diasent,
                        convenio.usadiasent,
                        convenio.gerainter,
                        convenio.login,
                        convenio.senhainter,
                        convenio.todos_exa_urg,
                        convenio.tiss_ordem_alfa,
                        convenio.dtemissaoguia,
                        convenio.dtautguia,
                        convenio.chkguiaprinc,
                        convenio.depara,
                        convenio.labap_id,
                        convenio.caminho_arqapoiado,
                        convenio.gerainter_codigoctrl,
                        convenio.exige_codigoctrl,
                        convenio.chkpronturg,
                        convenio.chkguiaout,
                        convenio.qtdout,
                        convenio.chknaoexeccomp,
                        postopermconv,
                        cabrtfconv,
                        rodrtfconv,
                        fchrtfconv,
                        exame0_cab,
                        exame0_fch,
                        exame0_rdp,
                        examema0_cab,
                        examema0_fch,
                        examema0_rdp,
                        convenio.cabeca_bmp,
                        rodape_bmp,
                        fundo_bmp,
                        validadorunimed,
                        postob2b,
                        qtdexamsg,
                        conffat_exige_depara3,
                        conffat_exige_cbos,
                        avisa_exa_cad_dias,
                        cmdunimed,
                        convenio.tiss_loginprest,
                        convenio.tiss_senhaprest,
                        convenio.usaorizon,
                        convenio.loginorizon,
                        convenio.senhaorizon,
                        convenio.enderecoorizon,
                        convenio.partorizon,
                        convenio.OrizonUrlCanGuia,
                        usatissnew,
                        USACM,
                        CMUSUARIO,
                        CMSENHA,
                        CMAPIKEY,
                        CMURL
                    FROM convenio
                    LEFT JOIN envio ON envio.id = convenio.envio_id
                    LEFT JOIN entrega ON entrega.id = convenio.entrega_id
                    LEFT JOIN empresa cr ON cr.id = convenio.empcr_id
                    LEFT JOIN empresa cs ON cs.id = convenio.empcs_id
                    ${where}
                `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    throw new Error(err.message);
                });

            const convenios_trim = convenios.map(convenio => {
                convenio.fantasia = convenio.fantasia.trim();
                convenio.razao = convenio.razao.trim();
                return convenio;
            });

            return res.status(200).json(convenios_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async estatistica(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const {
            postos,
            convenios,
            dataini,
            datafim,
            chkfmnc,
            chkentrada,
            consideraExamesInclusos,
            modelo,
            color
        } = req.body;
        try {
            let select = 'SELECT ';
            let tipoData = chkentrada === '1' ? 'DATAENTRA': 'DTCOLETA';

            if (modelo === 'data') {
                select +=
                    `MOVEXA.${tipoData} AS DTCOLETA,
                        MOVEXA.CONVENIO_ID,
                        CONVENIO.FANTASIA AS DESCCONV,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                        FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID `
            }else {
                select +=
                        `MOVEXA.CONVENIO_ID,
                        CONVENIO.FANTASIA AS DESCCONV,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                        FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID `
            }

            let where = 'WHERE '
            if (consideraExamesInclusos === '0')
                where +=  `MOVEXA.EXAMEINC = 0 AND `;

            if (chkfmnc === '1')
                where += `MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND `;

            const periodo =
                ` MOVEXA.${tipoData} BETWEEN
                '${format(new Date(dataini), 'yyyy-MM-dd')}'
                AND '${format(new Date(datafim), 'yyyy-MM-dd')}' `

            where += `
                MOVEXA.POSTO IN (${postos}) AND
                MOVEXA.CONVENIO_ID IN (${convenios})
                AND ${periodo}`

            let groupBy = 'GROUP BY ';
            let orderBy = 'ORDER BY ';
            if (modelo === 'data') {
                groupBy += `MOVEXA.${tipoData}, MOVEXA.CONVENIO_ID, CONVENIO.FANTASIA `
                orderBy += `movexa.${tipoData}, TOTPAC DESC`
            }else {
                groupBy += `MOVEXA.CONVENIO_ID, CONVENIO.FANTASIA `
                orderBy += `TOTPAC DESC`
            }
            let limit = ' LIMIT 100001'

            select += where;
            select += groupBy;
            select += orderBy;
            select += limit


            const dados = await Movexa.sequelize
            .query( select, {
                type: QueryTypes.SELECT,
            });

            if (dados.length > 100000) {
                throw new RangeError('Quantidade acima do limite')
            }

            const selectTotalGeral =  `
                SELECT CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                    FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID
                ${where}`;

            const totalGeralDeExamesEPacientes = await Movexa.sequelize.query(
                selectTotalGeral, {
                    type: QueryTypes.SELECT,
                })

            const total = {
                totalGeralDeExames: totalGeralDeExamesEPacientes[0].totexa,
                totalGeralDePacientes: totalGeralDeExamesEPacientes[0].totpac,
            };

            const dadosDeExamesMaisTotalGeral = {
                dados,
                total,
            }

            return res.status(200).json(dadosDeExamesMaisTotalGeral);
        } catch (error) {
            return res.status(400).json({error: error.message});
        }
    }

    async gerarRelatorio(req, res) {
        const { dados, dataini, datafim, color, profile, logo } = req.body;

        try {
            let dadosTratadosDeExames = [];
            if (dados.modelo === 'data') {
                dados.exames.forEach(dado => {
                    let achou = false;
                    const dataFormatada = format(parseISO(dado.dtcoleta), 'dd/MM/yyyy');
                    dadosTratadosDeExames.forEach((dadoDeExame) => {
                        if (dataFormatada === dadoDeExame.dataDeColeta) {
                            achou = true;
                            dadoDeExame.convenios.push({
                                codigo: dado.convenio_id,
                                nome: dado.descconv,
                                quantidadeExames: parseInt(dado.totexa),
                                quantidadePacientes: parseInt(dado.totpac),
                            });

                            dadoDeExame.totalDeExamesDia += parseInt(dado.totexa);
                            dadoDeExame.totalDePacientesDia += parseInt(dado.totpac);
                        }
                    });
                    if (!achou) {
                        dadosTratadosDeExames.push({
                            dataDeColeta: dataFormatada,
                            totalDeExamesDia: parseInt(dado.totexa),
                            totalDePacientesDia: parseInt(dado.totpac),
                            convenios: [
                                {
                                    codigo: dado.convenio_id,
                                    nome: dado.descconv,
                                    quantidadeExames: parseInt(dado.totexa),
                                    quantidadePacientes: parseInt(dado.totpac),
                                }
                            ],
                        });
                    }
                });
            }else {
                dadosTratadosDeExames = dados.exames;
            }

            const dadosDeExamesMaisTotalGeral = {
                dadosTratadosDeExames,
                total: dados.totais,
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/convenios/${dados.modelo === 'data' ? 'data': 'geral'}`,
                data: {
                    registros: dadosDeExamesMaisTotalGeral,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte
                },
                profile,
                logo,
                startDate: format(new Date(dataini), 'yyyy-MM-dd'),
                endDate: format(new Date(datafim), 'yyyy-MM-dd'),
                color: `#${color}`
            })
            return res.send(html)
        } catch (error) {
            console.log(error)
            return res.status(400).json({error: error.message})
        }
    }

    async saveFile(req, res) {
        try {
            const { key, Location: url, mimetype } = req.file;
            const { Convenio } = Database.getModels(req.database);

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            const columnFile = {
                guia_tiss_logo_key: key || '',
                guia_tiss_logo_url: newUrl || '',
                guia_tiss_logo_type: mimetype,
            }

            await Convenio.update(columnFile, {
                where: {
                    id: req.params.id
                }
            });

            return res.status(200).json({
                key,
                url: newUrl,
                mimetype
            });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async deleteFile(req, res) {
        try {
            const { key, id } = req.params;
            const { Convenio } = Database.getModels(req.database);

            const params = { Bucket: 'sialab', Key: key };

            s3.deleteObject(params, function(err, _) {
                if (err) {
                    console.log(err);
                } else {
                    return res.status(200).json('Arquivo Excluído com sucesso!');
                }
            });

            const columnFile = {
                guia_tiss_logo_key: null,
                guia_tiss_logo_url: null,
                guia_tiss_logo_type: null,
            }

            await Convenio.update(columnFile, {
                where: {
                    id: id,
                }
            });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Convenio"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Convenio"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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

export default new ConvenioController();
