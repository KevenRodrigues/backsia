import { QueryTypes } from 'sequelize';
import { format, subDays } from 'date-fns';
import Database from '../../database';
import {
    PegaData,
    PegaHora,
    convertDate,
    rangerStringToObject,
    stringToDecimalNumber,
    calculaDiasMovpacPorParametro
} from './functions/functions';

import _ from 'lodash';

const { QueryTypes } = require('sequelize');

class LancamentoResultadoController {
    // Listagem - Movpac
    async index(req, res) {
        try {
            const {
                Movpac,
                Prontuario,
                Convenio,
                Operador,
                MedicoRea,
            } = await Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const date = await calculaDiasMovpacPorParametro(req);

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            const convperm =
                req.query.convperm !== '' ? req.query.convperm : '';

            const postoperm =
                req.query.postoperm !== '' ? req.query.postoperm : '';

            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';
            const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];
            if (req.query.search && req.query.search.length > 0) {
                if (postoperm !== '') {
                    where +=
                        where === ''
                            ? ` ("Prontuario"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("Prontuario"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                } else {
                    where = ` (Unaccent("Movpac"."descricao") ILIKE Unaccent('${search}%')) or (CAST("Movpac"."id" AS TEXT) ILIKE '${search}%')`;
                }
            } else {
                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0) where += ' AND ';

                        where += LancamentoResultadoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = LancamentoResultadoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }

                if (
                    postoperm !== '' &&
                    postoperm !== undefined &&
                    postoperm !== null
                ) {
                    where +=
                        where === ''
                            ? ` ("Movpac"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("Movpac"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                }

                if (
                    convperm !== '' &&
                    convperm !== undefined &&
                    convperm !== null
                ) {
                    where +=
                        where === ''
                            ? ` ("prontuario->convenio"."codigo" in ('${convperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("prontuario->convenio"."codigo" in ('${convperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                }
            }

            if (filters.findIndex(f => f.id === 'dataentra') < 0) {
                if (where === '') {
                    where += ` ("Movpac"."dataentra" >= '${date}')`;
                } else {
                    where += ` AND ("Movpac"."dataentra" >= '${date}')`;
                }
            }

            const pacientes = await Movpac.findAll({
                attributes: [
                    'id',
                    'posto',
                    'amostra',
                    'dataentra',
                    'codigoctrl',
                    'diferenca',
                    'total',
                    'idade',
                    'mes',
                    'dia',
                    'dtentrega',
                    'dum',
                    'horaentra'
                ],
                order: Movpac.sequelize.literal(`${order} ${orderdesc}`),
                where: Movpac.sequelize.literal(where),
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            'id',
                            'posto',
                            'prontuario',
                            'nome',
                            'sexo',
                            'data_nasc',
                            'convenio_id',
                            ['fone1', 'fone'],
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['codigo'],
                            },
                        ],
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome'],
                    },
                    {
                        model: MedicoRea,
                        as: 'medicorea',
                        attributes: ['crm', 'nome_medrea', 'id'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            let total_count = 0;
            if (parseInt(req.query.totalpage) === 0) {
                total_count = await Movpac.count({
                    where: Movpac.sequelize.literal(where),
                    include: [
                        {
                            model: Prontuario,
                            as: 'prontuario',
                            attributes: [
                                'id',
                                'posto',
                                'prontuario',
                                'nome',
                                'sexo',
                                'data_nasc',
                                'convenio_id',
                                ['fone1', 'fone'],
                            ],
                            include: [
                                {
                                    model: Convenio,
                                    as: 'convenio',
                                    attributes: ['codigo'],
                                },
                            ],
                        },
                        {
                            model: Operador,
                            as: 'operador',
                            attributes: ['nome'],
                        },
                    ],
                });
            }

            try {
                if (pacientes.length > 0) {
                    pacientes[0].total =
                        total_count > 0
                            ? total_count.toString()
                            : req.query.totalpage;
                }
                return res.status(200).json(pacientes);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    // Listagem Exames - Movexa
    async indexOne(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            let exame = '';

            if (req.query.exame_codigo) {
                exame = ` AND exame.codigo = '${req.query.exame_codigo}' AND movexa.id IN (${req.query.movexa_ids}) `;
            } else {
                exame = 'ORDER BY folha, ordem, sequencia';
            }

            const select = `
                SELECT
                    descstatus(statusexm) as statusexm_descricao,
                    desccorstatus(statusexm) as statusexm_cor,
                    descresul(statusresultado) as statusresultado_descricao,
                    cast(valresul(movexa.resultado) as varchar(250)) as valresul,
                    movexa.hora_lanres,
                    movexa.rangerlan,
                    movexa.responsaveltecnicodoc,
                    movexa.qtdexame,
                    movexa.resultadohash,
                    movexa.data_lanres,
                    movexa.resultado_antes_er,
                    movexa.formulalan,
                    movexa.formulalanweb,
                    movexa.graflau,
                    movexa.apoio_id,
                    movexa.medico_id,
                    movexa.dtentrega,
                    movexa.amostra,
                    movexa.movpac_id,
                    movexa.responsaveltecnico,
                    movexa.rascunho,
                    movexa.resultadotxt,
                    movexa.medicorea_id,
                    movexa.hrcoleta,
                    movexa.horalib,
                    movexa.apoioresu,
                    movexa.datalib,
                    movexa.mascaralan,
                    movexa.temgrafico,
                    movexa.material_id,
                    movexa.resultado,
                    movexa.assina_ope,
                    movexa.exame_id,
                    movexa.dtcoleta,
                    movexa.posto,
                    movexa.id,
                    movexa.layout_id,
                    movexa.statusexm,
                    movexa.resultadortf,
                    movexa.resrtf,
                    movexa.usarangerlan,
                    movexa.usarangertextolan,
                    movexa.statusresultado,
                    movexa.operador_id_lanres,
                    movexa.internome,
                    movexa.medicorea_id2,
                    movexa.layout_sia_parametros,
                    exame.codigo,
                    exame.rtf,
                    exame.enviawww as enviawwwexa,
                    exame.setor_id,
                    exame.imagem,
                    exame.descricao,
                    exame.folha,
                    exame.ordem,
                    operador.nome as assope,
                    operador.nomecomp,
                    operador.assinaturaope_bmp as assopeimg,
                    layout.mascara,
                    layout.formula,
                    layout.formulaweb,
                    layout.ranger,
                    layout.id as codlay,
                    layout.usaranger,
                    layout.usarangertexto,
                    layout.vrblocob2b,
                    layout.notab2b,
                    layout.vrblocob2b_sia,
                    layout.notab2b_sia,
                    layout.metodo_id,
                    entrega.gerainter,
                    entrega.naoimprime,
                    entrega.impbmp,
                    entrega.naogeradeve,
                    entrega.naogerapac,
                    convenio.codigo as codconv,
                    convenio.fantasia as descconv,
                    convenio.login,
                    convenio.senhainter,
                    convenio.gerainter as gerainterconv,
                    convenio.cabrtfconv,
                    convenio.fchrtfconv,
                    convenio.rodrtfconv,
                    convenio.cabecalho,
                    movpac.prontuario_id,
                    movpac.idade,
                    movpac.mes,
                    movpac.dia,
                    movpac.entrega_id,
                    movpac.diferenca,
                    movpac.obsfat,
                    movpac.obs,
                    movpac.dataentra as dataentrapac,
                    movpac.net,
                    movpac.horaentra as horaentrapac,
                    movpac.medicament,
                    movpac.jejum,
                    movpac.dum,
                    medicorea.crm as crmrea,
                    medicorea.nome_medrea,
                    medico.enviawww as enviawwwmed,
                    medico.login as loginmed,
                    medico.senha as senhamed,
                    medico.crm,
                    medico.nome_med,
                    material.descricao as descmat,
                    plano.codigo as codplano,
                    plano.descricao as descplano,
                    prontuario.sexo,
                    prontuario.nome,
                    b.nome as nomeope_lanres,
                    c.deixavazio,
                    c.tira_colchete,
                    0 as imprime
                FROM movexa
                LEFT JOIN movpac on movpac.id = movexa.movpac_id
                LEFT JOIN prontuario on prontuario.id = movpac.prontuario_id
                LEFT JOIN exame on exame.id = movexa.exame_id
                LEFT JOIN operador on operador.id = movexa.assina_ope
                LEFT JOIN layout on layout.id = exame.layout_id
                LEFT JOIN entrega on entrega.id = movpac.entrega_id
                LEFT JOIN medico on medico.id = movexa.medico_id
                LEFT JOIN convenio on convenio.id = movexa.convenio_id
                LEFT JOIN plano on plano.id = movexa.plano_id
                LEFT JOIN operador b on b.id = movexa.operador_id_lanres
                LEFT JOIN medicorea on medicorea.id = movexa.medicorea_id
                LEFT JOIN material on material.id = movexa.material_id
                LEFT JOIN layout c on c.id = movexa.layout_id
                WHERE movexa.movpac_id = ${req.params.id}
                ${exame}
                `;

            const exames = await Movexa.sequelize
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

    // Listagem Exames - Movexa apenas para exibir
    async indexOne2(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            let exame = '';

            if (req.query.exame_codigo) {
                exame = ` AND exame.codigo = '${req.query.exame_codigo}' AND movexa.id IN (${req.query.movexa_ids}) `;
            } else {
                exame = 'ORDER BY folha, ordem, sequencia';
            }

            const select = `
                    SELECT
                          movexa.id,
                          movexa.statusexm,
                          exame.codigo,
                          exame.descricao
                    FROM movexa
                    LEFT JOIN exame on exame.id = movexa.exame_id
                    WHERE movexa.movpac_id = ${req.params.id}
                    ${exame}
                    `;

            const exames = await Movexa.sequelize
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

    // Lança Resultado
    async updateResultado(req, res) {
        try {
            const { Movexa, Operador, Layoutparamsia, Material, Metodo, Layout } = Database.getModels(req.database);

            if (req.body) {
                try {
                    let data = {};
                    let acao = 'RESULTADO INGRESSADO STATUS: ';
                    if (req.body.volta_status) {
                        const campo = 'OBRIGA_MOTIVO_EXAME';
                        const getParam = await Operador.sequelize
                            .query(`select ${campo} from param, param2`, {
                                type: QueryTypes.SELECT,
                            })
                            .catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        const { obriga_motivo_exame } = getParam[0];

                        if (obriga_motivo_exame === '1') {
                            await Movexa.sequelize
                                .query(
                                    `INSERT INTO TAB_LOGEXA (ID,MOVEXA_ID,DATA,HORA,OPERA_ID,ACAO,MAQUINA,MOVPAC_ID,EXAME_ID,MOTIVO) values (nextval('tab_logexa_id_seq'),${
                                        req.body.movexa_id
                                    },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                        req.userId
                                    },'VOLTA STATUS','${
                                        req.headers.host
                                    }', '${parseInt(
                                        req.body.movexa.movpac_id
                                    )}','${parseInt(
                                        req.body.movexa.exame_id
                                    )}','${req.body.motivo}')`
                                )
                                .catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                        }

                        data = {
                            statusexm: 'TR',
                            resultado: null,
                            resultadortf: null,
                            layout_sia_parametros: null,
                            resrtf: 0,
                            statusresultado: '',
                            mascaralan: '',
                            formulalan: '',
                            rangerlan: '',
                            usarangerlan: 0,
                            imprime: 0,
                            temgrafico: 0,
                            apoioresu: 0,
                            graflau: null,
                            assina_ope: null,
                            layout_id: null,
                            assope: '',
                            datalib: null,
                            horalib: null,
                            internome: null,
                            data_lanres: null,
                            hora_lanres: null,
                            operador_id_lanres: null,
                            responsaveltecnico: null,
                            responsaveltecnicodoc: null,
                            resultadotxt: null,
                            resultadohash: null,
                            rascunho: 0,
                            formulalanweb: '',
                            usarangertextolan: 0,
                            nomeope_lanres: '',
                        };
                    } else if (req.body.marca_faturamento) {
                        data = {
                            statusexm: 'SF',
                            statusresultado: 'NO',
                            resultado: null,
                            resultadortf: null,
                            layout_sia_parametros: null,
                            mascaralan: '',
                            formulalan: '',
                            imprime: 0,
                            assina_ope: null,
                            assope: '',
                            idopera_ultacao: req.userId,
                        };
                        acao = 'EXAME MARCADO COMO SÓ FATURAMENTO: ';
                    } else {
                        const campo = 'dt_banco';
                        const getParam = await Operador.sequelize
                            .query(`select ${campo} from param, param2`, {
                                type: QueryTypes.SELECT,
                            })
                            .catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        const { dt_banco } = getParam[0];

                        const getLayoutId = req.body.newValues.layout_id;

                        const getLayoutSiaParametro = await Layoutparamsia.findAll({
                            where:{layout_id: getLayoutId},
                            include: [
                                {
                                    model: Material,
                                    as: 'material',
                                    attributes: ['id', 'descricao'],
                                },
                                {
                                    model: Metodo,
                                    as: 'metodo',
                                    attributes: ['id', 'descricao'],
                                },
                                {
                                    model: Layout,
                                    as: 'layout',
                                    attributes: ['id', 'usaranger', 'usarangertexto'],
                                },
                            ],
                        }).catch(err => {
                            return res
                                .status(400)
                                .json({ error: err.message });
                        })

                        data = {
                            ...req.body.newValues,
                            layout_sia_parametros: JSON.stringify(getLayoutSiaParametro),
                            idopera_ultacao: req.userId,
                            data_lanres: convertDate(
                                await PegaData(req, dt_banco)
                            ),
                            hora_lanres: await PegaHora(req, dt_banco),
                            operador_id_lanres: req.userId,
                            nomeope_lanres: req.userName,
                        };
                    }

                    await Movexa.update(data, {
                        where: { id: req.body.movexa_id },
                    }).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await Movexa.sequelize
                        .query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                req.body.movexa_id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'${acao + data.statusexm.trim()}','${
                                req.headers.host
                            }')`
                        )
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                    return res.status(200).json(req.body);
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

    // Assina Exames
    async assinaExames(req, res) {
        try {
            const { Movexa, Operador } = Database.getModels(req.database);

            try {
                if (req.body.exames.length <= 0) {
                    return res
                        .status(400)
                        .json({ error: 'Nenhum exame para assinar!' });
                }

                const campo = 'dt_banco,geraintlib';
                const getParam = await Operador.sequelize
                    .query(`select ${campo} from param, param2`, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                const { dt_banco } = getParam[0];

                await Movexa.sequelize
                    .transaction(async transaction => {
                        for (let i = 0; i < req.body.exames.length; i++) {
                            const item = req.body.exames[i];

                            const data = {
                                statusexm: 'CF',
                                apoioresu: 0,
                                assina_ope: req.userId,
                                assope: req.body.assope,
                                datalib: convertDate(
                                    await PegaData(req, dt_banco)
                                ),
                                horalib: await PegaHora(req, dt_banco),
                                idopera_ultacao: req.userId,
                            };

                            await Promise.all([
                                await Movexa.update(data, {
                                    where: { id: item.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                }),
                                await Movexa.sequelize
                                    .query(
                                        `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${item.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'RESULTADO LIBERADO STATUS: CF','${req.headers.host}')`
                                    )
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    }),
                            ]);
                        }
                        // if(geraintlib === '1'){
                        //     if(req.body.exames[0].gerainter){
                        //         await Movexa.sequelize.query(
                        //             `UPDATE MOVPAC SET GERA_INTER = 1 WHERE MOVPAC.ID ${req.body.exames[0].movpac_id}`,
                        //             {
                        //                 transaction
                        //             }
                        //         ).catch(err => {
                        //             return res.status(400).json({ error: err.message });
                        //         })
                        //     }
                        // }
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(req.body.exames);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    // Imprimir Resultado
    async imprimirResultado(req, res) {
        const sequelize = Database.instances[req.database];
        const Models = Database.getModels(req.database);
        const { Movexa, Layoutparamsia, SetorImpressao, Posto, SetorFila, Motina, Material, Metodo, Layout, Entrega } = Models;

        const ca_lanca = req.body;

        const visLaudo = '0';

        try{

            // PEGAR OS PARAMETROS
            const campos_parametros = 'medicorea_lanca,voltasf,obriga_motivo_exame,libera_lp,msgpaglib,nao_lib_com_obsfat,geraintlib,gera_arq_web,nao_res_dev,lib_res_obsfat,usa_comp_imp,usa_crmrj,fundo_bmp,bloqexa, naoseparaconv, separa_imp_ope';

            let parametros = await sequelize
                .query(`select ${campos_parametros} from param, param2, paramf`, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            parametros = parametros[0];

            // PEGAR OPERADOR
            const campos_operador = 'setorimpressao_id,naolancares,naovoltastatus,nao_libera_exa, bloqexa, bloqexame,nao_reimprime_exa';

            let operador = await sequelize
                .query(
                    `select ${campos_operador} from operador, operador2, operador3 where operador.id = ${req.userId} AND operador2.operador_id = ${req.userId} AND operador3.operador_id = ${req.userId}`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            const entrega = await Entrega.findAll({
                attributes: ['id', 'descricao'],
                where: {
                    naoimprime: '1',
                },
            })

            if (entrega.length) {
                ca_lanca.forEach(c => {
                    // exist_imp_bloq = existe bloqueio de impressão no cadastro de entrega
                    const exist_imp_bloq = entrega.find(
                        en => en.id === c.entrega_id
                    );
                    if (exist_imp_bloq) {
                        return res.status(400).json({error: `Impressão bloqueada para entrega cadastrada: ${exist_imp_bloq.dataValues.descricao} após geração para internet`});
                    }
                });
            }

            operador = operador[0];

            const {
                nao_res_dev,
                lib_res_obsfat,
                usa_crmrj,
                fundo_bmp,
                naoseparaconv,
                separa_imp_ope,
                bloqexa
              } = parametros;

            const { usa_comp_imp } = parametros;
            const { setorimpressao_id, nao_reimprime_exa } = operador;

            const bloqexame = operador.bloqexame.trim();

            let exameImp = '';
            let exameImprtf = '';

            const { diferenca, obsfat } = ca_lanca[0];

            // if (bloqexa === '1') {
            //     const examesBloqueados = await Exame.findAll({
            //         attributes: ['bloqexa', 'codigo'],
            //         where: {
            //             bloqexa: '1'
            //         }
            //     });

            //     ca_lanca.forEach(ex => {
            //         const constaBloqueioDeExame = examesBloqueados.find(eb => eb.codigo === ex.codigo);
            //         if (constaBloqueioDeExame)
            //             return res.status(400).json({error: `Você não tem permissão para visualizar este exame. (Exame: ${ex.codigo})`})
            //     });
            // }

            // VERIFICA SE O EXAME ESTA BLOQUEADO
            if (bloqexame) {
                const examesBloqueados = bloqexame.split(',');
                for (const item of ca_lanca) {
                    for (const exm of examesBloqueados) {
                        if (exm === item.codigo.trim()) {
                            return res.status(400).json({error: `Você não tem permissão para visualizar este exame. (Exame: ${item.codigo})`})
                        }
                    }
                }
            }

            if (nao_reimprime_exa === '1') {
                for (const item of ca_lanca) {
                    if (item.statusexm.trim() === 'IM' || item.statusexm.trim() === 'EP'|| item.statusexm.trim() === 'EM') {
                        return res.status(400).json({error: `Operador não possui permissão para reimpressão de exames`})
                    }
                }
            }

            // VERIFICA SE É RASCUNHO
            // if (rascunhoLau === '1') {
            //     selecionados.map(item => {
            //     if (item.statusexm !== 'LP') {
            //         item.imprime = 0;
            //     }
            //     return item;
            //     });
            // } else {
            //     selecionados.map(item => {
            //     if (item.statusexm === 'LP') {
            //         item.imprime = 0;
            //     }
            //     return item;
            //     });
            // }

            // VALIDA VISUALIZAÇÃO DO LAUDO
            let visu_laudoimp = null;

            const setor = await SetorImpressao.findOne({
                where: { id: setorimpressao_id },
                include: [
                    {
                        model: Posto,
                    },
                    {
                        model: SetorFila,
                    },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
            });

            const { vislau } = setor;

            if (vislau === '1' || usa_comp_imp === '1') {
                if (visLaudo === '1') {
                    visu_laudoimp = true;
                } else {
                    visu_laudoimp = false;
                }
            } else {
                visu_laudoimp = false;
            }

            //
            //
            // AQUI CHAMA O GRAVA EXAMES COM ALTERAÇÕES
            //
            //

            // CONSULTA SALDO DEVEDOR
            if (nao_res_dev === '1' && parseInt(diferenca) !== 0) {
                return res.status(400).json({error: 'Paciente não liberado para impressão do resultado pois está com saldo devedor.'});
            }

            // CONSULTA OBSERVAÇÃO DE FATURAMENTO
            if (lib_res_obsfat === '1' && obsfat) {
                return res.status(400).json({error: 'Paciente não liberado para impressão do resultado pois o mesmo está com observações de faturamento.'});
            }

            // const amostra = [];

            // amostra.push({
            //     posto: data.posto,
            //     amostra: data.amostra,
            //     postoamostra: `${data.posto}${data.amostra}`,
            //     cliente: data.nome,
            // });

            // CRIA O ARRAY DE RESULTADO
            const resul = [];

            // CRIA O ARRAY DE CURSOR TEMPORARIO
            let seq = 1;
            const curtemp = [];

            ca_lanca.map(item => {
                const newObj = {
                    ...item,
                    codigoexm: item.codigo.trim(),
                    codigo: item.exame_id.toString(),
                    sequencia: '',
                    resultado: item.resultado,
                    imptemp: item.imprime === false ? 'NÃO' : 'SIM',
                    material: '',
                    rt: item.responsaveltecnico,
                    rtd: item.responsaveltecnicodoc,
                };

                return curtemp.push(newObj);
            });

            // VALIDAÇÃO DO CRM DO MÉDICO
            for (const item of curtemp) {
                item.crm = item.crm ? item.crm.trim() : '0';
                if (usa_crmrj === '1') {
                    item.crm = item.crm.toString().padStart(10, '0');
                } else {
                    item.crm = item.crm.toString().padStart(8, '0');
                }
                item.sequencia = seq.toString().padStart(3, '0');
                resul.push(item);
                seq += 1;
            }

            for (const item of resul) {
                if (item.imptemp === 'SIM' && (item.resrtf ? item.resrtf : '0') === '0') {
                    exameImp += `${exameImp}#${item.codigo}${item.sequencia}`;
                }
                if (item.imptemp === 'SIM' && (item.resrtf ? item.resrtf : '0') === '1') {
                    if (usa_comp_imp === '1') {
                        // eslint-disable-next-line no-unused-expressions
                        `/n/n+${item.descricao.substr(0, 54)}+/n+#RESEMRTF#${item.id}#/n`;
                        exameImprtf += `${exameImprtf}#${item.codigo}${item.sequencia}`;
                    }
                }
            }

            const resultado = [];
            const exmsFalhaLayout = [];

            if (exameImp + exameImprtf) {
                if (resul[0].naoimprime === '1') {
                    resul.map(item => {
                    if (
                        exameImp.includes(item.codigo + item.sequencia) ||
                        exameImprtf.includes(item.codigo + item.sequencia)
                    ) {
                        item.resul = 'IM';
                    }
                    return item;
                    });
                } else {
                    if (!exameImp && exameImprtf && usa_comp_imp === '1') {
                        exameImp = '';
                    }
                    if (usa_comp_imp === '1') {
                        // thisform.laudo1.imprime_paci(RESUL.POSTO+RESUL.AMOSTRA,M.EXAMEIMP + M.EXAMEIMPRTF,IIF(thisform.chkfiglaudo.Value = 1,.T.,IIF(NVL(RESUL.IMPBMP,0)=1,.T.,.T.)))
                        // GeraLaudo({ fundo_bmp, resul });
                    } else {
                        // thisform.laudo1.imprime_paci(RESUL.POSTO+RESUL.AMOSTRA,M.EXAMEIMP,IIF(thisform.chkfiglaudo.Value = 1,.T.,IIF(NVL(RESUL.IMPBMP,0)=1,.T.,.F.)))
                    }

                    if (usa_comp_imp === '1') {
                        resultado.map(item => {
                            // M.RESRTF = PROCSQL("MOVEXA","RESRTF",ALLTRIM(STR(RESULTADO.MOVEXA_ID)),"ID")
                            // M.STATUSEXM = PROCSQL("MOVEXA","STATUSEXM",ALLTRIM(STR(RESULTADO.MOVEXA_ID)),"ID")
                            // IF NVL(M.RESRTF,0) = 1
                            //     IF INLIST(M.STATUSEXM,"TR","NC","FM","FU","AP") OR (M.STATUSEXM  = "LA" AND NVL(M.OPARAM.USA_LIB,0) = 1 )
                            //         REPLACE RESULTADO.RESRTF WITH 0, RESULTADORTF WITH "" IN RESULTADO
                            //     ELSE
                            //         M.RESULTADORTF = PROCSQL("MOVEXA","RESULTADORTF",ALLTRIM(STR(RESULTADO.MOVEXA_ID)),"ID")
                            //         REPLACE RESULTADO.RESRTF WITH 1, RESULTADORTF WITH M.RESULTADORTF IN RESULTADO
                            //     ENDIF
                            // ELSE
                            //     REPLACE RESULTADO.RESRTF WITH 0 IN RESULTADO
                            // ENDIF
                            // REPLACE RESULTADO.RESULTADO WITH STRTRAN(RESULTADO.RESULTADO,"#linhagrafico#",REPLICATE(" ",14)) IN RESULTADO
                            return item;
                        });
                    } else {
                        resultado.map(item => {
                            // REPLACE RESULTADO.RESULTADO WITH STRTRAN(RESULTADO.RESULTADO,"#linhagrafico#",REPLICATE(" ",14)) IN RESULTADO
                            return item;
                        });
                        // thisform.metodo_pad.txtext_geralau(2)
                    }

                    // CHAMA A GRAVAÇÃO DO BANCO
                    // DO WHILE !EOF("RESUL")
                    //   IF RESUL.IMPTEMP = "SIM" AND NVL(RESUL.RESRTF,0) = 0
                    //     SELECT CRS_LANCA
                    //     LOCATE FOR CRS_LANCA.ID == RESUL.ID
                    //     IF _screen.rascunho_lau = 0
                    //       thisform.metodo_pad.rastrea_exa(CRS_LANCA.ID,"IMPRESSÃO DO RESULTADO STATUS: IM")
                    //       REPLACE STATUSEXM WITH RESUL.STATUSEXM IN CRS_LANCA
                    //     ENDIF
                    //   ENDIF
                    //   IF _screen.rascunho_lau = 1 AND RESUL.IMPTEMP = "SIM"
                    //     thisform.metodo_pad.rastrea_exa(CRS_LANCA.ID,"IMPRESSÃO DO RASCUNHO DO RESULTADO LANÇADO PARCIAL STATUS: LP")
                    //     REPLACE RASCUNHO WITH 1 IN CRS_LANCA
                    //   ENDIF
                    //   SKIP IN RESUL
                    // ENDDO


                    for (let i = 0; i < resul.length;i++) {
                        const exame = resul[i];

                        let layout_sia = null;

                        if(!exame.layout_sia_parametros){
                            const getLayoutSia = await Layoutparamsia.findAll({
                                where:{layout_id: exame.codlay},
                                include: [
                                    {
                                        model: Material,
                                        as: 'material',
                                        attributes: ['id', 'descricao'],
                                    },
                                    {
                                        model: Metodo,
                                        as: 'metodo',
                                        attributes: ['id', 'descricao'],
                                    },
                                    {
                                        model: Layout,
                                        as: 'layout',
                                        attributes: ['id', 'usaranger', 'usarangertexto'],
                                    },
                                ],
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            })
                            layout_sia = JSON.stringify(getLayoutSia);
                            layout_sia = JSON.parse(layout_sia);
                        }else {
                            layout_sia = JSON.parse(exame.layout_sia_parametros)
                        }

                        if(layout_sia.length === 0){
                            resul.splice(i, 1);
                            i -= 1;
                            exmsFalhaLayout.push(exame.codigoexm.trim());
                            // return res.status(400).json({ error: `Exame ${exame.descricao.trim()} sem layout Sia pré-definido!` });
                        }

                        const resultados = exame.resultado.match(/(?<=\[)(.*?)(?=\])/g);

                        const rangerData = rangerStringToObject(exame.rangerlan);

                        for (const resul of layout_sia) {

                            const resultado = resul.resultado && resul.resultado.trim() ? resultados[parseInt(resul.resultado.trim())] : '';
                            const ranger = resul.resultado && resul.resultado.trim() ? rangerData[parseInt(resul.resultado.trim())] : {};
                            const resultado2 = resul.resultado2 && resul.resultado2.trim() ? resultados[parseInt(resul.resultado2.trim())] : '';
                            const ranger2 = resul.resultado2 && resul.resultado2.trim() ? rangerData[parseInt(resul.resultado2.trim())] : {};

                            resul.resultado = resultado.trim();
                            resul.resultado2 = resultado2.trim();

                            const validaRanger = (tipores,resultado,rangerAtual) => {
                                const resultadoTexto = /^[a-zA-Z]+$/.test(resultado);
                                if (resultadoTexto) {
                                    if (
                                        resultado.toString().toUpperCase() !==
                                        rangerAtual.nMin.toUpperCase()
                                    ) {
                                        return 'alterado';
                                    } else {
                                        return 'normal';
                                    }
                                } else{
                                    if(! /^[a-zA-Z]+$/.test(rangerAtual.nMin) && ! /^[a-zA-Z]+$/.test(rangerAtual.nMax)){
                                        if (stringToDecimalNumber(resultado) < stringToDecimalNumber(rangerAtual.nMin)){
                                            return 'abaixo';
                                        } else if(stringToDecimalNumber(resultado) > stringToDecimalNumber(rangerAtual.nMax)){
                                            return 'acima';
                                        } else {
                                            return 'normal';
                                        }
                                    }
                                    return 'nenhum';
                                }
                            }

                            if(resul.layout.usaranger === '1' || resul.layout.usarangertexto === '1'){
                                resul.rangerResul = resultado && ranger ? validaRanger(resul.tipores.trim(),resultado.trim(),ranger) : 'nenhum';
                                resul.rangerResul2 = resultado2 && ranger2 ? validaRanger(resul.tipores.trim(),resultado2.trim(),ranger2) : 'nenhum';
                            }

                        }

                        exame.layoutsia = _.orderBy(layout_sia,'linha');
                    }

                }
            }

            if (!exmsFalhaLayout.length) {
                resul.forEach(async ca => {
                    if (ca.statusexm !== 'LP') {
                        await Movexa.update(
                            { statusexm: 'IM' },
                            {
                                where: {
                                    id: ca.id,
                                },
                            }
                        );
                    }
                });
            }

            return res.status(200).json({
                params:{fundo_bmp, naoseparaconv, separa_imp_ope},
                exmsFalhaLayout,
                resul
            });

        } catch (err) {
                return res.status(400).json({error: err.message});
        }
    }

    async escolherFundoImpressao(req, res) {
        const { codconv, codposto } = req.query;

        try {
            const { Param2, Convenio, Posto } = Database.getModels(req.database);
            const [parametros] = await Param2.findAll({
                attributes: ['fundo_bmp', 'fundo_geral', 'opcao_fundo', 'usa_figura_web']
            })
            const { fundo_geral, opcao_fundo, fundo_bmp, usa_figura_web } = parametros.dataValues;

            if (fundo_geral !== '1' || opcao_fundo !== '1')
                return res.status(200).json({ fundo: '' });


            const fundoConvenio = await Convenio.findOne({
                attributes: ['fundo_bmp', 'cabecalho'],
                where: {
                    codigo: codconv,
                },
            });

            if (fundoConvenio.dataValues.fundo_bmp && fundoConvenio.dataValues.cabecalho === '1')
                return res.status(200).json({fundo:fundoConvenio.dataValues.fundo_bmp});

            const fundoPosto = await Posto.findOne({
                attributes: ['fundo_bmp_pos', 'usa_fundo_posto'],
                where: {
                    codigo: codposto
                }
            })

            if (fundoPosto.dataValues.fundo_bmp_pos && fundoPosto.dataValues.usa_fundo_posto === '1')
                return res.status(200).json({fundo:fundoPosto.dataValues.fundo_bmp_pos});

            if (usa_figura_web === '1')
                return res.status(200).json({ fundo: '' });

            return res.status(200).json({fundo: fundo_bmp});
        } catch (err) {
            return res.status(400).json(err);
        }
    }

    // Auto completar
    async autoCompletar(req,res){

        const { Frase, Fungos, Parasitas } = Database.getModels(req.database);

        const {tpbusca,codbusca} = req.query;
        let resultado = '';

        switch(tpbusca){
            case 'H':
                resultado = await Frase.findOne({where:{id: codbusca}}).then(response => {
                    return response && response.dataValues.descricao.trim() || codbusca
                }).catch(err => {
                    return `error: ${err.message}`;
                });
                break;
            case 'F':
                resultado = await Frase.findOne({where:{codalfa: codbusca}}).then(response => {
                    return response && response && response.dataValues.descricao.trim() || codbusca
                }).catch(err => {
                    return `error: ${err.message}`;
                });
                break;
            case 'P':
                resultado = await Parasitas.findOne({where:{id: codbusca}}).then(response => {
                    return response && response.dataValues.descricao.trim() || codbusca
                }).catch(err => {
                    return `error: ${err.message}`;
                });
                break;
            case 'B':
                resultado = await Fungos.findOne({where:{id: codbusca}}).then(response => {
                    return response && response.dataValues.descricao.trim() || codbusca
                }).catch(err => {
                    return `error: ${err.message}`;
                });
                break;
            default:
                resultado = codbusca;
                break;
        }

        return res.status(200).json(resultado);

    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'prontuario.nome':
                filter = ` (Unaccent("prontuario"."nome") ILIKE Unaccent('${filterValue}%'))`;
                break;
            case 'prontuario.convenio_id':
                filter = ` "prontuario"."convenio_id" = '${filterValue}'`;
                break;
            case 'operador.nome':
                filter = ` (Unaccent("operador"."nome") ILIKE Unaccent('${filterValue}%')) `;
                break;
            case 'motina.descricao':
                filter = ` (Unaccent("motina"."descricao") ILIKE Unaccent('${filterValue}%'))`;
                break;
            case 'amostra': {
                if (filterValue.indexOf('{') === -1) {
                    filter = ` (Unaccent("Movpac"."amostra") ILIKE Unaccent('${filterValue}%'))`;
                } else {
                    const { firstField, lastField } = JSON.parse(
                        filterValue
                    );

                    if (
                        firstField !== '' &&
                        firstField !== undefined &&
                        lastField !== '' &&
                        lastField !== undefined
                    ) {
                        filter = ` ("Movpac"."amostra" >= '${firstField}' AND "Movpac"."amostra" <= '${lastField}' )`;
                    } else if (
                        firstField !== '' &&
                        firstField !== undefined
                    ) {
                        filter = ` ("Movpac"."amostra" >= '${firstField}' )`;
                    } else if (
                        lastField !== '' &&
                        lastField !== undefined
                    ) {
                        filter = ` ("Movpac"."amostra" <= '${lastField}' )`;
                    }
                }
                break;
            }
            case 'codigoctrl': {
                if (!JSON.parse(filterValue)) {
                    filter = ` (Unaccent("Movpac"."codigoctrl") ILIKE Unaccent('${filterValue}%'))`;
                } else {
                    const { firstField, lastField } = JSON.parse(
                        filterValue
                    );

                    if (
                        firstField !== '' &&
                        firstField !== undefined &&
                        lastField !== '' &&
                        lastField !== undefined
                    ) {
                        filter = ` ("Movpac"."codigoctrl" >= '${firstField}' AND "Movpac"."codigoctrl" <= '${lastField}' )`;
                    } else if (
                        firstField !== '' &&
                        firstField !== undefined
                    ) {
                        filter = ` ("Movpac"."codigoctrl" >= '${firstField}' )`;
                    } else if (
                        lastField !== '' &&
                        lastField !== undefined
                    ) {
                        filter = ` ("Movpac"."codigoctrl" <= '${lastField}' )`;
                    }
                }
                break;
            }
            case 'id':
                filter = ` "Movpac"."id" = ${filterValue.toUpperCase()}`;
                break;
            case 'dataentra':
                filter = ` "Movpac"."dataentra" between '${filterValue}'`;
                break;
            case 'prontuario.data_nasc':
                filter = ` "prontuario"."data_nasc" between '${filterValue}'`;
                break;
            case 'intervalo_amostras':
                filter = ` "Movpac"."amostra" between '${filterValue.primeira}' and '${filterValue.segunda}'`;
                break;
            default:
                filterName !== '' && filterName !== undefined
                    ? (filter = ` (Unaccent("Movpac"."${filterName}") ILIKE Unaccent('${filterValue}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new LancamentoResultadoController();
