import { Sequelize } from 'sequelize';
import { format, subDays } from 'date-fns';
import Database from '../../database';

import {
    PegaData,
    PegaHora,
    DataEnt,
    convertDate,
    transhora,
    retornahora,
    calculaDiasMovpacPorParametro
} from './functions/functions';

class RecmatController {
    async index(req, res) {
        try {
            const {
                Movpac,
                Prontuario,
                Convenio,
                Operador,
                MedicoRea,
            } = Database.getModels(req.database);
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
                    where = ` (Unaccent(upper(trim(coalesce("Movpac"."descricao",'')))) LIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Movpac"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
                }
            } else {
                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += RecmatController.handleFilters(
                            filters[i].id,
                            filters[i].value,
                            date
                        );
                    }
                } else {
                    where = RecmatController.handleFilters(
                        filter,
                        filtervalue,
                        date
                    );
                }

                if (postoperm !== '') {
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

                if (convperm !== '') {
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

            const pacientes = await Movpac.findAll({
                attributes: ['id', 'posto', 'amostra', 'dataentra', 'total'],
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
                            attributes: ['id', 'nome', 'convenio_id'],
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

    async indexOne(req, res) {
        try {
            const {
                Prontuario,
                Movpac,
                Movexa,
                Exame,
                Operador,
                Material,
            } = Database.getModels(req.database);

            const exames = await Movexa.findAll({
                attributes: {
                    include: [
                        [
                            Movexa.sequelize.literal('descstatus(statusexm)'),
                            'statusexm_descricao',
                        ],
                        [
                            Movexa.sequelize.literal(
                                'desccorstatus(statusexm)'
                            ),
                            'statusexm_cor',
                        ],
                        [
                            Movexa.sequelize.literal(
                                'descresul(statusresultado)'
                            ),
                            'statusresultado_descricao',
                        ],
                    ],
                },
                where: { movpac_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: [
                            'codigo',
                            'ori_coleta',
                            'descricao',
                            'folha',
                            'ordem',
                            'imagem',
                            'jejum',
                        ],
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome'],
                    },
                    {
                        model: Material,
                        as: 'material',
                        attributes: [['descricao', 'descmat']],
                    },
                    {
                        model: Movpac,
                        as: 'movpac',
                        attributes: [['id', 'prontuario_id']],
                        include: [
                            {
                                model: Prontuario,
                                as: 'prontuario',
                                attributes: ['id', 'nome'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
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

    async controleColetaEntrega(req, res) {
        try {
            const { Movpac, Posto } = Database.getModels(req.database);
            const movpac = await Movpac.findOne({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const posto = await Posto.findOne({
                where: { codigo: movpac.posto },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const controleColetaEntrega = posto.controla_coleta_entrega;

            return res.status(200).json(controleColetaEntrega);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async descStatus(req, res) {
        const { Param } = Database.getModels(req.database);
        try {
            const descStatus = await Param.findOne({
                attributes: ['desc_fm', 'desc_tr', 'desc_fu', 'desc_nc'],
                raw: true,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(descStatus);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async trtofm(req, res) {
        try {
            const {
                Movpac,
                Operador,
                Movexa,
                Exame,
                Triagem,
            } = Database.getModels(req.database);

            const exames = req.body;

            const movpac = await Movpac.findOne({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            // const posto = await Posto.findOne({
            //     where: { codigo: movpac.posto },
            // }).catch(err => {
            //     return res.status(400).json({ error: err.message });
            // });

            // const controleColetaEntrega = posto.controla_coleta_entrega;

            // Faz validação dos parametros
            const campo = 'usaleitubo, naodtentgeralfm, geraintlib_somente';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: Sequelize.QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const {
                usaleitubo,
                naodtentgeralfm,
                geraintlib_somente,
            } = getParam[0];

            await Movexa.sequelize.transaction(async transaction => {
                if (usaleitubo === '1') {
                    for (const item of exames) {
                        const newExame = {
                            statusexm: 'FM',
                            veio: '0',
                            idopera_ultacao: req.userId,
                        };
                        await Movexa.update(
                            newExame,
                            {
                                where: { id: item.id },
                            },
                            { transaction }
                        )
                            .then(
                                await Triagem.update(
                                    {
                                        triado: '0',
                                        idopera_ultacao: req.userId,
                                    },
                                    {
                                        where: { movexa_id: item.id },
                                    },
                                    { transaction }
                                ).catch(Movexa.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                })
                            )
                            .catch(Movexa.sequelize, err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                    }
                } else {
                    for (const item of exames) {
                        const newExame = {
                            statusexm: 'FM',
                            veio: '0',
                            dtcoleta: null,
                            hrcoleta: null,
                            dtentrega: null,
                            idopera_ultacao: req.userId,
                        };
                        await Movexa.update(
                            newExame,
                            {
                                where: { id: item.id },
                            },
                            { transaction }
                        ).catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                }

                // salva o rastreamento das alterações.
                for (const item of exames) {
                    await Movexa.sequelize
                        .query(
                            `insert into rastrea (id,movexa_id,data,hora,operador_id,acao,maquina) values (nextval('rastrea_id_seq'),${
                                item.id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'FALTA MATERIAL STATUS: ${item.statusexm.trim()}','${
                                req.headers.host
                            }')`
                        )
                        .catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                }

                const urg_prio_pac = movpac.urg_prio_pac || '0';

                if (urg_prio_pac === '0') {
                    const getMaxdtentrega = await Movexa.sequelize
                        .query(
                            `
                                    SELECT MAX(DTENTREGA) AS DTENTREGA FROM MOVEXA WHERE movpac_id = ${req.params.id}
                                    `,
                            {
                                type: Sequelize.QueryTypes.SELECT,
                            }
                        )
                        .catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });

                    const setMaxentrega = getMaxdtentrega[0];

                    const maxdtentrega = setMaxentrega.dtentrega;

                    if (naodtentgeralfm === '1') {
                        const statusexm = async () => {
                            if (usaleitubo === '1') {
                                await Movexa.findAll({
                                    where: {
                                        movpac_id: req.params.id,
                                        statusexm: 'FU',
                                    },
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            } else {
                                await Movexa.findAll({
                                    where: {
                                        movpac_id: req.params.id,
                                        statusexm: 'FM',
                                    },
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }
                        };
                        if (statusexm.length > 0) {
                            // REPLACE DTENTREGA WITH NULL IN CRMOVPACB
                            await Movpac.update(
                                {
                                    dtentrega: null,
                                    idopera_ultacao: req.userId,
                                },
                                {
                                    where: { id: req.params.id },
                                    transaction,
                                }
                            ).catch(Movpac.sequelize, err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        } else {
                            // REPLACE DTENTREGA WITH ENTREGA.DTENTREGA IN CRMOVPACB
                            await Movpac.update(
                                {
                                    dtentrega: maxdtentrega,
                                    idopera_ultacao: req.userId,
                                },
                                {
                                    where: { id: req.params.id },
                                    transaction,
                                }
                            ).catch(Movpac.sequelize, err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }
                    } else {
                        // SELECT MAX(DTENTREGA) AS DTENTREGA FROM CRMOVEXA INTO CURSOR ENTREGA
                        await Movpac.update(
                            {
                                dtentrega: maxdtentrega,
                                idopera_ultacao: req.userId,
                            },
                            {
                                where: { id: req.params.id },
                                transaction,
                            }
                        ).catch(Movpac.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                }
            });

            if (geraintlib_somente === '1') {
                // thisform.metodo_pad.gera_inter(CRMOVEXA.MOVPAC_ID)
            }

            const updated = await Movexa.findAll({
                where: { movpac_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'ori_coleta'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!updated) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(updated);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async fmtofu(req, res) {
        try {
            const { Movpac, Operador, Movexa, Exame } = Database.getModels(
                req.database
            );

            const exames = req.body;

            // const movpac = await Movpac.findOne({
            //     where: { id: req.params.id },
            // }).catch(err => {
            //     return res.status(400).json({ error: err.message });
            // });

            // const posto = await Posto.findOne({
            //     where: { codigo: movpac.posto },
            // }).catch(err => {
            //     return res.status(400).json({ error: err.message });
            // });

            // const controleColetaEntrega = posto.controla_coleta_entrega;

            // Faz validação dos parametros
            const campo = 'usaleitubo, naodtentgeralfm, geraintlib_somente';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: Sequelize.QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const {
                usaleitubo,
                naodtentgeralfm,
                geraintlib_somente,
            } = getParam[0];

            await Movexa.sequelize.transaction(async transaction => {
                if (usaleitubo === '1') {
                    // IF NVL(PROCSQL("MOVEXA","COLETA_ID",ALLTRIM(STR(CRMOVEXA.ID)),"ID"),0) = 0 OR NVL(CRMOVEXA.STATUSEXM,'') = 'NC'
                    for (const item of exames) {
                        if (
                            (item.coleta_id ?? '0') === '0' ||
                            item.statusexm === 'NC'
                        ) {
                            await Movexa.update(
                                {
                                    statusexm: 'FU',
                                    veio: '2',
                                    dtcoleta: null,
                                    hrcoleta: null,
                                    malote_id: null,
                                    dtentrega: null,
                                    hentrega: null,
                                    idopera_ultacao: req.userId,
                                },
                                {
                                    where: { id: item.id },
                                },
                                { transaction }
                            ).catch(Movexa.sequelize, err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }
                    }
                }

                // salva o rastreamento das alterações.
                for (const item of exames) {
                    await Movexa.sequelize
                        .query(
                            `insert into rastrea (id,movexa_id,data,hora,operador_id,acao,maquina) values (nextval('rastrea_id_seq'),${
                                item.id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'MARCADO COMO FUTURA COLETA STATUS: ${item.statusexm.trim()}','${
                                req.headers.host
                            }')`
                        )
                        .catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                }

                const getMaxdtentrega = await Movexa.sequelize
                    .query(
                        `
                                    SELECT MAX(DTENTREGA) AS DTENTREGA FROM MOVEXA WHERE movpac_id = ${req.params.id}
                                    `,
                        {
                            type: Sequelize.QueryTypes.SELECT,
                        }
                    )
                    .catch(Movexa.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });
                const setMaxentrega = getMaxdtentrega[0];
                const maxdtentrega = setMaxentrega.dtentrega;

                if (naodtentgeralfm === '1') {
                    const statusexm = async () => {
                        if (usaleitubo === '1') {
                            await Movexa.findAll({
                                where: {
                                    movpac_id: req.params.id,
                                    statusexm: 'FU',
                                },
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        } else {
                            await Movexa.findAll({
                                where: {
                                    movpac_id: req.params.id,
                                    statusexm: 'FM',
                                },
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }
                    };
                    if (statusexm.length > 0) {
                        // REPLACE DTENTREGA WITH NULL IN CRMOVPACB
                        await Movpac.update(
                            { dtentrega: null, idopera_ultacao: req.userId },
                            {
                                where: { id: req.params.id },
                                transaction,
                            }
                        ).catch(Movpac.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    } else {
                        // REPLACE DTENTREGA WITH ENTREGA.DTENTREGA IN CRMOVPACB
                        await Movpac.update(
                            {
                                dtentrega: maxdtentrega,
                                idopera_ultacao: req.userId,
                            },
                            {
                                where: { id: req.params.id },
                                transaction,
                            }
                        ).catch(Movpac.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                } else {
                    // SELECT MAX(DTENTREGA) AS DTENTREGA FROM CRMOVEXA INTO CURSOR ENTREGA
                    await Movpac.update(
                        {
                            dtentrega: maxdtentrega,
                            idopera_ultacao: req.userId,
                        },
                        {
                            where: { id: req.params.id },
                            transaction,
                        }
                    ).catch(Movpac.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });
                }
            });

            if (geraintlib_somente === '1') {
                // thisform.metodo_pad.gera_inter(CRMOVEXA.MOVPAC_ID)
            }

            const updated = await Movexa.findAll({
                where: { movpac_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'ori_coleta'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!updated) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(updated);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async recebefmnc(req, res) {
        try {
            const { Movpac, Operador, Movexa, Exame } = Database.getModels(
                req.database
            );

            const exames = req.body;

            const movpac = await Movpac.findOne({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            // const posto = await Posto.findOne({
            //     where: { codigo: movpac.posto },
            // }).catch(err => {
            //     return res.status(400).json({ error: err.message });
            // });

            // const controleColetaEntrega = posto.controla_coleta_entrega;

            // Faz validação dos parametros
            const campo =
                'usaleitubo, naodtentgeralfm, geraintlib_somente, dt_banco';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: Sequelize.QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const {
                usaleitubo,
                naodtentgeralfm,
                // geraintlib_somente,
                dt_banco,
            } = getParam[0];

            await Movexa.sequelize.transaction(async transaction => {
                for (const item of exames) {
                    let newExame;
                    let dtentrega;
                    let hentrega;

                    const data = await PegaData(req, dt_banco);
                    const hora = await PegaHora(req, dt_banco);

                    if (item.urg_prio_exa === '1') {
                        dtentrega = item.dtentrega;
                        hentrega = item.hentrega;
                    } else {
                        dtentrega = await DataEnt(
                            data,
                            item.exame_id,
                            hora,
                            item.urgenteexm,
                            req
                        );
                        hentrega = item.hentrega;
                    }

                    if (item.statusexm === 'NC') {
                        newExame = {
                            ...newExame,
                            statusexm: 'TR',
                            labapoio: '0',
                            codpedapoio: '',
                            etiquetaws_id: null,
                        };
                    } else if (!item.codpedapoio && item.apoio) {
                        newExame = {
                            ...newExame,
                            statusexm: 'AP',
                        };
                    } else {
                        newExame = {
                            ...newExame,
                            statusexm: 'TR',
                        };
                    }

                    newExame = {
                        ...newExame,
                        exportado: '0',
                        impgra: '0',
                        veio: '1',
                        dtcoleta: convertDate(await PegaData(req, dt_banco)),
                        hrcoleta: await PegaHora(req, dt_banco),
                        motivo_descoleta: null,
                        dtentrega,
                        hentrega,
                        idopera_ultacao: req.userId,
                    };

                    await Movexa.update(
                        newExame,
                        {
                            where: { id: item.id },
                        },
                        { transaction }
                    ).catch(Movexa.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });

                    // salva o rastreamento das alterações.
                    await Movexa.sequelize
                        .query(
                            `insert into rastrea (id,movexa_id,data,hora,operador_id,acao,maquina) values (nextval('rastrea_id_seq'),${
                                item.id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'RECEBIMENTO DE MATERIAL STATUS: ${item.statusexm.trim()}','${
                                req.headers.host
                            }')`,
                            {
                                type: Sequelize.QueryTypes.INSERT,
                                transaction,
                            }
                        )
                        .catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                }

                const urg_prio_pac = movpac.urg_prio_pac || '0';

                if (urg_prio_pac === '0') {
                    const getMaxdtentrega = await Movexa.sequelize
                        .query(
                            `
                                    SELECT MAX(DTENTREGA) AS DTENTREGA FROM MOVEXA WHERE movpac_id = ${req.params.id}
                                    `,
                            {
                                type: Sequelize.QueryTypes.SELECT,
                            }
                        )
                        .catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });

                    const setMaxentrega = getMaxdtentrega[0];

                    const maxdtentrega = setMaxentrega.dtentrega;

                    if (naodtentgeralfm === '1') {
                        let curstatusexm;
                        // IF LEITURA DE TUBO
                        if (usaleitubo === '1') {
                            // SELECT STATUSEXM FROM CRMOVEXA WHERE STATUSEXM = 'FU' INTO CURSOR CURSTATUSEXM
                            curstatusexm = await Movexa.findAll({
                                where: {
                                    movpac_id: req.params.id,
                                    statusexm: 'FU',
                                },
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        } else {
                            // SELECT STATUSEXM FROM CRMOVEXA WHERE STATUSEXM = 'FM' INTO CURSOR CURSTATUSEXM
                            curstatusexm = await Movexa.findAll(
                                {
                                    where: {
                                        movpac_id: req.params.id,
                                        statusexm: 'FM',
                                    },
                                },
                                { transaction }
                            ).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }

                        // IF CONTAGEM DO CURSTATUSEXM
                        if (curstatusexm.length > 0) {
                            // REPLACE DTENTREGA WITH NULL IN CRMOVPACB
                            // REPLACE DTENTREGA WITH NULL IN CRMOVPACM
                            await Movpac.update(
                                {
                                    dtentrega: null,
                                    idopera_ultacao: req.userId,
                                },
                                {
                                    where: { id: req.params.id },
                                },
                                { transaction }
                            ).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        } else {
                            await Movpac.update(
                                {
                                    dtentrega: maxdtentrega,
                                    idopera_ultacao: req.userId,
                                },
                                {
                                    where: { id: req.params.id },
                                },
                                { transaction }
                            ).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }
                    } else {
                        await Movpac.update(
                            {
                                dtentrega: maxdtentrega,
                                idopera_ultacao: req.userId,
                            },
                            {
                                where: { id: req.params.id },
                            },
                            { transaction }
                        ).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                }
            });

            // retorna os dados atualizados.
            const updated = await Movexa.findAll({
                where: { movpac_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'ori_coleta'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!updated) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(updated);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async recebefu(req, res) {
        try {
            const { Movpac, Operador, Movexa, Exame } = Database.getModels(
                req.database
            );

            const exames = req.body;

            const movpac = await Movpac.findOne({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            // Faz validação dos parametros
            const campo =
                'usaleitubo, naodtentgeralfm, geraintlib_somente,dt_banco,urg_prio_tempo';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: Sequelize.QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const {
                usaleitubo,
                naodtentgeralfm,
                geraintlib_somente,
                dt_banco,
                urg_prio_tempo,
            } = getParam[0];

            const m = {};
            const data = await PegaData(req, dt_banco);
            const hora = await PegaHora(req, dt_banco);

            if (
                (movpac.urg_prio_pac ?? '0' === '1') &&
                (urg_prio_tempo ?? '0' > '0') &&
                convertDate(data) === exames[0].dataentra
            ) {
                res.status(200).json({
                    msg: `Existem exames desse atendimento que serão realizados em urgência prioritária e deverão ficar prontos em até ${urg_prio_tempo} minutos.`,
                });
            }

            m.hora_fin = exames[0].hentrega;
            if ((urg_prio_tempo ?? 0) > 0) {
                m.hora_atu = transhora(hora, false);
                m.urg_prio_tempo_seg = urg_prio_tempo ?? 0 * 60;
                m.hora_fin = retornahora(
                    Number(m.hora_atu) + Number(m.urg_prio_tempo_seg)
                );
            }

            await Movexa.sequelize.transaction(async transaction => {
                for (const item of exames) {
                    let crmovexa = item;

                    if (
                        (crmovexa.urg_prio_exa ?? '0') === '1' &&
                        convertDate(data) === crmovexa.dataentra
                    ) {
                        m.dtentrega = convertDate(data);
                        m.hentrega = m.hora_fin;
                    } else {
                        m.dtentrega = await DataEnt(
                            data,
                            crmovexa.exame_id,
                            hora,
                            crmovexa.urgenteexm ?? '0',
                            req
                        );
                        m.hentrega = crmovexa.hentrega;
                    }

                    crmovexa = {
                        ...crmovexa,
                        statusexm: 'FM',
                        exportado: '0',
                        veio: '0',
                        malote_id: null,
                        dtcoleta:
                            (usaleitubo ?? '0') === '0'
                                ? null
                                : convertDate(data),
                        hrcoleta: (usaleitubo ?? '0') === '0' ? null : hora,
                        motivo_descoleta: null,
                        dtentrega: m.dtentrega,
                        hentrega: m.hentrega,
                        idopera_ultacao: req.userId,
                    };

                    await Movexa.update(
                        crmovexa,
                        {
                            where: { id: crmovexa.id },
                        },
                        { transaction }
                    ).catch(Movexa.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });
                }
                // salva o rastreamento das alterações.
                for (const item of exames) {
                    await Movexa.sequelize
                        .query(
                            `insert into rastrea (id,movexa_id,data,hora,operador_id,acao,maquina) values (nextval('rastrea_id_seq'),${
                                item.id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'PASSADO PARA FALTA MATERIAL STATUS: ${item.statusexm.trim()}','${
                                req.headers.host
                            }')`,
                            {
                                type: Sequelize.QueryTypes.UPDATE,
                                transaction,
                            }
                        )
                        .catch(Movexa.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                }

                const getMaxdtentrega = await Movexa.sequelize
                    .query(
                        `SELECT MAX(DTENTREGA) AS DTENTREGA FROM MOVEXA WHERE movpac_id = ${req.params.id}`,
                        {
                            type: Sequelize.QueryTypes.SELECT,
                        }
                    )
                    .catch(Movexa.sequelize, err => {
                        return res.status(400).json({ error: err.message });
                    });
                const setMaxentrega = getMaxdtentrega[0];
                const maxdtentrega = setMaxentrega.dtentrega;

                if ((naodtentgeralfm ?? '0') === '1') {
                    const statusexm = async () => {
                        if (usaleitubo === '1') {
                            await Movexa.findAll({
                                where: {
                                    movpac_id: req.params.id,
                                    statusexm: 'FU',
                                },
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        } else {
                            await Movexa.findAll({
                                where: {
                                    movpac_id: req.params.id,
                                    statusexm: 'FM',
                                },
                            }).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        }
                    };
                    if (statusexm.length > 0) {
                        movpac.dtentrega = null;
                    } else {
                        movpac.dtentrega = maxdtentrega;
                    }
                } else {
                    movpac.dtentrega = maxdtentrega;
                }

                const urg_prio_pac = movpac.urg_prio_pac ?? '0';
                if (urg_prio_pac === '1') {
                    m.hrentrega = movpac.hrentrega;
                    m.hrentrega = !m.hrentrega ? m.hora_fin : m.hrentrega;
                    m.dtentrega = convertDate(data);
                    movpac.dtentrega = m.dtentrega;
                }

                movpac.idopera_ultacao = req.userId;

                await Movpac.update(
                    movpac,
                    {
                        where: { id: movpac.id },
                    },
                    {
                        transaction,
                    }
                ).catch(Movpac.sequelize, err => {
                    return res.status(400).json({ error: err.message });
                });
            });

            if ((geraintlib_somente ?? '0') === '1') {
                // thisform.metodo_pad.gera_inter(CRMOVEXA.MOVPAC_ID)
            }

            const updated = await Movexa.findAll({
                where: { movpac_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'ori_coleta'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!updated) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(updated);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async acertaColetarReceber(req, res) {
        try {
            const {
                Movpac,
                Movexa,
                Exame,
                Posto,
                Operador,
            } = Database.getModels(req.database);
            const opccolrec = req.query.number;
            const exames = req.body;

            const movpac = await Movpac.findOne({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const posto = await Posto.findOne({
                where: { codigo: movpac.posto },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const controleColetaEntrega = posto.controla_coleta_entrega;

            // Faz validação dos parametros
            const campo = 'etq_fu, usaleitubo, dt_banco';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: Sequelize.QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const { etq_fu, usaleitubo, dt_banco } = getParam[0];

            await Movexa.sequelize.transaction(async transaction => {
                if (
                    (controleColetaEntrega ?? '0') === '1' &&
                    (usaleitubo ?? '0') === '1'
                ) {
                    for (const item of exames) {
                        const crmovexa = item;
                        if (item.statusexm === 'FU') {
                            const getCurexa = await Movexa.sequelize
                                .query(
                                    `
                                    SELECT EXAME.ID, EXAME.CODIGO, EXAME.DESCRICAO, EXAME.DEPARA, EXAME.MATERIAL_ID, EXAME.STATUS, MATERIAL.DESCRICAO AS DESCMAT, PERM_COLETAR, PERM_RECEBER, TRIAGEMELE, ROTURG_ID FROM EXAME LEFT JOIN MATERIAL ON MATERIAL.ID = EXAME.MATERIAL_ID WHERE EXAME.ID = '${item.exame_id}'
                                        `,
                                    {
                                        type: Sequelize.QueryTypes.SELECT,
                                    },
                                    { raw: true }
                                )
                                .catch(Movexa.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });

                            const curexa = getCurexa[0];

                            if (
                                parseInt(curexa.perm_coletar) +
                                    parseInt(curexa.perm_receber) ===
                                    2 &&
                                (opccolrec === '1' || opccolrec === '2')
                            ) {
                                if (crmovexa.coletar === '1') {
                                    if (opccolrec === '2') {
                                        crmovexa.coletar = '0';
                                    }
                                } else if (crmovexa.entregue === '0') {
                                    crmovexa.coletar = '1';
                                }
                            } else if (
                                curexa.perm_coletar === '1' &&
                                curexa.perm_receber === '0' &&
                                (opccolrec === '1' || opccolrec === '2')
                            ) {
                                if (crmovexa.coletar === '1') {
                                    if (opccolrec === '2') {
                                        crmovexa.coletar = '0';
                                    }
                                } else if (opccolrec === '1') {
                                    crmovexa.coletar = '1';
                                }
                            } else if (
                                parseInt(curexa.perm_coletar) +
                                    parseInt(curexa.perm_receber) ===
                                    2 &&
                                (opccolrec === '3' || opccolrec === '4')
                            ) {
                                if (crmovexa.entregue === '1') {
                                    if (opccolrec === '4') {
                                        crmovexa.entregue = '0';
                                    }
                                } else if (crmovexa.coletar === '0') {
                                    if (opccolrec === '3') {
                                        crmovexa.entregue = '1';
                                    }
                                }
                            } else if (
                                curexa.perm_coletar === '0' &&
                                curexa.perm_receber === '1' &&
                                (opccolrec === '3' || opccolrec === '4')
                            ) {
                                if (crmovexa.entregue === '1') {
                                    if (opccolrec === '4') {
                                        crmovexa.entregue = '0';
                                    }
                                } else if (opccolrec === '3') {
                                    crmovexa.entregue = '1';
                                }
                            }

                            if (
                                (etq_fu ?? '0') === '1' &&
                                (usaleitubo ?? '0') === '1'
                            ) {
                                if (
                                    (crmovexa.statusexm ?? '' === 'FU') &&
                                    parseInt(crmovexa.coletar ?? 0) +
                                        parseInt(crmovexa.entregue ?? 0) >
                                        0
                                ) {
                                    const data = await PegaData(req, dt_banco);
                                    const hora = await PegaHora(req, dt_banco);
                                    const dtentrega = await DataEnt(
                                        data,
                                        crmovexa.exame_id,
                                        hora,
                                        crmovexa.urgenteexm,
                                        req
                                    );
                                    crmovexa.dtentrega = dtentrega;
                                }
                                if (
                                    (crmovexa.statusexm ?? '' === 'FU') &&
                                    parseInt(crmovexa.coletar ?? 0) +
                                        parseInt(crmovexa.entregue ?? 0) ===
                                        0
                                ) {
                                    crmovexa.dtentrega = null;
                                }
                            }

                            crmovexa.idopera_ultacao = req.userId;

                            await Movexa.update(crmovexa, {
                                where: { id: crmovexa.id },
                                transaction,
                            }).catch(Movexa.sequelize, err => {
                                return res.status(400).json({
                                    error: err.message,
                                });
                            });
                        }
                    }
                }

                if ((etq_fu ?? '0') === '1' && (usaleitubo ?? '0') === '1') {
                    const urg_prio_pac = movpac.urg_prio_pac ?? '0';

                    if (urg_prio_pac === '0') {
                        const getMaxdtentrega = await Movexa.sequelize
                            .query(
                                `
                                    SELECT MAX(DTENTREGA) AS DTENTREGA FROM MOVEXA WHERE movpac_id = ${req.params.id}
                                    `,
                                {
                                    type: Sequelize.QueryTypes.SELECT,
                                }
                            )
                            .catch(Movexa.sequelize, err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        const setMaxentrega = getMaxdtentrega[0];
                        const maxdtentrega = setMaxentrega.dtentrega;
                        await Movpac.update(
                            {
                                dtentrega: maxdtentrega,
                                idopera_ultacao: req.userId,
                            },
                            {
                                where: { id: req.params.id },
                                transaction,
                            }
                        ).catch(Movpac.sequelize, err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                }
                return null;
            });

            // retorna os dados atualizados.
            const updated = await Movexa.findAll({
                where: { movpac_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'ori_coleta'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!updated) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(updated);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue, date) {
        let filter = '';
        switch (filterName) {
            case 'prontuario.nome':
                filter = ` (Unaccent(upper(trim(coalesce("prontuario"."nome",'')))) LIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'prontuario.convenio_id':
                filter = ` "prontuario"."convenio_id" = '${filterValue}'`;
                break;
            case 'operador.nome':
                filter = ` (Unaccent(upper(trim(coalesce("operador"."nome",'')))) LIKE Unaccent('%${filterValue.toUpperCase()}%')) `;
                break;
            case 'amostra': {
                if (filterValue.indexOf('{') === -1) {
                    filter = ` (Unaccent(upper(trim(coalesce("Movpac"."amostra",'')))) LIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                } else {
                    const { firstField, lastField } = JSON.parse(filterValue);

                    if (
                        firstField !== '' &&
                        firstField !== undefined &&
                        lastField !== '' &&
                        lastField !== undefined
                    ) {
                        filter = ` ("Movpac"."amostra" >= '${firstField}' AND "Movpac"."amostra" <= '${lastField}' )`;
                    } else if (firstField !== '' && firstField !== undefined) {
                        filter = ` ("Movpac"."amostra" >= '${firstField}' )`;
                    } else if (lastField !== '' && lastField !== undefined) {
                        filter = ` ("Movpac"."amostra" <= '${lastField}' )`;
                    }
                }
                break;
            }
            case 'codigoctrl': {
                if (!JSON.parse(filterValue)) {
                    filter = ` (Unaccent(upper(trim(coalesce("Movpac"."codigoctrl",'')))) LIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                } else {
                    const { firstField, lastField } = JSON.parse(filterValue);

                    if (
                        firstField !== '' &&
                        firstField !== undefined &&
                        lastField !== '' &&
                        lastField !== undefined
                    ) {
                        filter = ` ("Movpac"."codigoctrl" >= '${firstField}' AND "Movpac"."codigoctrl" <= '${lastField}' )`;
                    } else if (firstField !== '' && firstField !== undefined) {
                        filter = ` ("Movpac"."codigoctrl" >= '${firstField}' )`;
                    } else if (lastField !== '' && lastField !== undefined) {
                        filter = ` ("Movpac"."codigoctrl" <= '${lastField}' )`;
                    }
                }
                break;
            }
            case 'dataentra':
                filter = ` "Movpac"."dataentra" between '${filterValue}'`;
                break;
            case 'id':
                filter = ` "Movpac"."id" = ${filterValue.toUpperCase()}`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            case 'intervalo_amostras':
                filter = ` "Movpac"."amostra" between '${filterValue.primeira}' and '${filterValue.segunda}'`;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Movpac"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : (filter += ` ("Movpac"."dataentra" >= '${date}')`);
        }

        return filter;
    }
}

export default new RecmatController();
