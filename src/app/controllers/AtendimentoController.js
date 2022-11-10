import { QueryTypes, Op } from 'sequelize';
import { format, parseISO } from 'date-fns';

import aws from 'aws-sdk';

import Database from '../../database';
import getDelta from '../utils/getDelta';
import { PegaData, PegaHora, calculaDiasMovpacPorParametro } from './functions/functions';

import Queue from '../../lib/Queue';

import EnvioDocumento from '../jobs/EnvioDocumento';

const s3 = new aws.S3();

class AtendimentoController {
    async index(req, res) {
        try {
            const { Movpac } = Database.getModels(req.database);
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
                where += ` (Unaccent("movpac"."descricao") ILIKE Unaccent('${search}%')) or (CAST("movpac"."id" AS TEXT) ILIKE '%${search}%')`;
            } else {
                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0) where += ' AND ';

                        where += AtendimentoController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = AtendimentoController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            if (postoperm !== '') {
                where +=
                    where === ''
                        ? ` ("movpac"."posto" in ('${postoperm.replace(
                              /,/gi,
                              "','"
                          )}'))`
                        : ` and ("movpac"."posto" in ('${postoperm.replace(
                              /,/gi,
                              "','"
                          )}'))`;
            }

            if (convperm !== '') {
                where +=
                    where === ''
                        ? ` ("prontuario"."codigo" in ('${convperm.replace(
                              /,/gi,
                              "','"
                          )}'))`
                        : ` and ("prontuario"."codigo" in ('${convperm.replace(
                              /,/gi,
                              "','"
                          )}'))`;
            }

            if (filters.findIndex(f => f.id === 'dataentra') < 0) {
                if (where === '') {
                    where += ` ("movpac"."dataentra" >= '${date}')`;
                } else {
                    where += ` AND ("movpac"."dataentra" >= '${date}')`;
                }
            }

            // if (where === '') {
            //     where += ` ("movpac"."dataentra" >= '${date}')`;
            // } else if (where && req.query.ignoreFilters !== 'true') {
            //     where += ` AND ("movpac"."dataentra" >= '${date}')`;
            // }

            const atendimentos = await Movpac.sequelize
                .query(
                    `SELECT
                        varchar '' AS total,
                        movpac.posto,
                        movpac.dataentra,
                        movpac.amostra,
                        movpac.horaentra,
                        movpac.status,
                        movpac.codigoctrl,
                        movpac.id,
                        movpac.prontuario_id,
                        movpac.dtentrega,
                        movpac.operador_id,
                        movpac.diferenca,
                        movpac.entreguepor,
                        movpac.ndoc,
                        movpac.obsfat,
                        movpac.hrentrega,
                        prontuario.nome,
                        prontuario.nome_social,
                        prontuario.data_nasc,
                        prontuario.data_nasc AS dtnasc,
                        operador.nome AS nomope,
                        convenio.codigo AS codconv,
                        convenio.fantasia AS nomconv,
                        motina.descricao AS motina_descricao
                    FROM movpac
                    LEFT JOIN prontuario ON prontuario.id = movpac.prontuario_id
                    LEFT JOIN operador ON operador.id = movpac.operador_id
                    LEFT JOIN motina ON motina.id = movpac.status
                    LEFT JOIN convenio ON convenio.id = prontuario.convenio_id
                    ${where ? `WHERE ${where}` : ''}
                    ORDER BY ${order} ${orderdesc}
                    LIMIT ${limit}
                    OFFSET ${(page - 1) * limit}
                `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            let total_count = 0;
            if (parseInt(req.query.totalpage) === 0) {
                total_count = await Movpac.sequelize.query(
                    `SELECT count(*) AS "count" FROM "movpac"
                        LEFT JOIN prontuario ON prontuario.id = movpac.prontuario_id
                        LEFT JOIN operador ON operador.id = movpac.operador_id
                        LEFT JOIN convenio ON convenio.id = prontuario.convenio_id
                        ${where ? `WHERE ${where}` : ''} LIMIT 1`
                );
            }

            try {
                if (atendimentos.length > 0) {
                    atendimentos[0].total =
                        total_count !== 0
                            ? total_count[0][0].count
                            : req.query.totalpage;
                }

                return res.status(200).json(atendimentos);
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
                Movpac,
                Prontuario,
                Convenio,
                Plano,
                Medico,
                Operador,
                Envio,
                Entrega,
                Posto,
                Cid,
                Situacao,
                Empresa,
                MedicoRea,
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movpac"."id" DESC';
            if (req.params.id) {
                where += ` "Movpac"."id" = ${req.params.id} `;
            }

            let atendimentos = await Movpac.findAll({
                order: Movpac.sequelize.literal(order),
                where: Movpac.sequelize.literal(where),
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                            },
                            {
                                model: Plano,
                                as: 'plano',
                            },
                            {
                                model: Medico,
                                as: 'medico',
                            },
                        ],
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome'],
                    },
                    {
                        model: Envio,
                        as: 'envio',
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                    },
                    {
                        model: Posto,
                    },
                    {
                        model: Cid,
                        as: 'cid',
                    },
                    {
                        model: Situacao,
                        as: 'situacao',
                    },
                    {
                        model: Empresa,
                        as: 'empresa',
                    },
                    {
                        model: MedicoRea,
                        as: 'medicorea',
                        attributes: [['crm', 'crmrea'], 'nome_medrea'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const atendimento_trim = [];

                atendimentos = JSON.parse(JSON.stringify(atendimentos));

                atendimentos.map(atendimento => {
                    const newAtendimento = {
                        ...atendimento,
                        posto_id: atendimento.posto,
                        envio: {
                            ...atendimento.envio,
                            descricao: atendimento.envio.descricao.trim(),
                        },
                    };

                    atendimento_trim.push(newAtendimento);
                    return atendimento;
                });
                return res.status(200).json(atendimento_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOneByCodigo(req, res) {
        const { posto, amostra } = req.params;

        try {
            const { Movpac, Prontuario, Convenio, Motina, Operador } = Database.getModels(req.database);

            const resultado = await Movpac.findOne({
                where: {
                    posto,
                    amostra
                },
                attributes: [
                    "posto",
                    "dataentra",
                    "idade",
                    "amostra",
                    "horaentra",
                    "status",
                    "codigoctrl",
                    ["id", "codigo"],
                    "id",
                    "prontuario_id",
                    "dtentrega",
                    "operador_id",
                    "diferenca",
                    "entreguepor",
                    "ndoc",
                    "obsfat",
                    "hrentrega",
                ],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            "nome",
                            "nome_social",
                            "convenio_id",
                            ["data_nasc", "dtnasc"],
                            "data_nasc",
                        ],
                        include: {
                            model: Convenio,
                            as: 'convenio',
                            attributes: [["codigo", "codconv"], ["fantasia", "nomconv"]]
                        }
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: [["nome", "nomope"], "nome"]
                    },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: [["descricao", "motina_descricao"]]
                    },
                ]
            })

           return res.status(200).json(resultado);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOneByCodigoRaw(req, res) {
        const { posto, amostra } = req.params;

        try {
            const { Movpac } = Database.getModels(req.database);

            const query = `
                SELECT
                    varchar '' AS total,
                    movpac.posto,
                    movpac.dataentra,
                    movpac.amostra,
                    movpac.horaentra,
                    movpac.status,
                    movpac.codigoctrl,
                    movpac.id,
                    movpac.prontuario_id,
                    movpac.dtentrega,
                    movpac.operador_id,
                    movpac.diferenca,
                    movpac.entreguepor,
                    movpac.ndoc,
                    movpac.obsfat,
                    movpac.hrentrega,
                    prontuario.nome,
                    prontuario.nome_social,
                    prontuario.data_nasc,
                    prontuario.data_nasc AS dtnasc,
                    operador.nome AS nomope,
                    convenio.codigo AS codconv,
                    convenio.fantasia AS nomconv,
                    motina.descricao AS motina_descricao
                FROM movpac
                LEFT JOIN prontuario ON prontuario.id = movpac.prontuario_id
                LEFT JOIN operador ON operador.id = movpac.operador_id
                LEFT JOIN motina ON motina.id = movpac.status
                LEFT JOIN convenio ON convenio.id = prontuario.convenio_id
                WHERE movpac.posto = :posto AND movpac.amostra = :amostra`;

            const [movpac] = await Movpac.sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements: {
                    posto,
                    amostra
                }
            });

           return res.status(200).json(movpac);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexByIntervaloAmostra(req, res) {
        const { inicio, fim } = req.params;
        const { offset, limit,  } = req.query;

        try {
            const { Movpac, Prontuario, Convenio, Motina, Operador } = Database.getModels(req.database);

            const resultado = await Movpac.findAll({
                where: {
                    amostra: {
                        [Op.between]: [inicio, fim]
                    }
                },
                attributes: [
                    "posto",
                    "dataentra",
                    "idade",
                    "amostra",
                    "horaentra",
                    "status",
                    "codigoctrl",
                    ["id", "codigo"],
                    "id",
                    "prontuario_id",
                    "dtentrega",
                    "operador_id",
                    "diferenca",
                    "entreguepor",
                    "ndoc",
                    "obsfat",
                    "hrentrega",
                ],
                order: [['amostra', 'DESC']],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            "nome",
                            "nome_social",
                            "convenio_id",
                            ["data_nasc", "dtnasc"],
                            "data_nasc",
                        ],
                        include: {
                            model: Convenio,
                            as: 'convenio',
                            attributes: [["codigo", "codconv"], ["fantasia", "nomconv"]]
                        }
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: [["nome", "nomope"], "nome"]
                    },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: [["descricao", "motina_descricao"]]
                    },
                ],
                offset: Number(offset * limit),
                limit: Number(limit),
            })


            if (resultado.length) {
                const count = await Movpac.count({
                    where: {
                        amostra: {
                            [Op.between]: [inicio, fim]
                        }
                    },
                })

                resultado[0].dataValues.count = count;
            }

           return res.status(200).json(resultado);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexByIntervaloAmostraRaw(req, res) {
        const { inicio, fim } = req.params;
        const { offset, limit,  } = req.query;

        try {
            const { Movpac } = Database.getModels(req.database);


            const query = `
                SELECT
                    varchar '' AS total,
                    movpac.posto,
                    movpac.dataentra,
                    movpac.amostra,
                    movpac.horaentra,
                    movpac.status,
                    movpac.codigoctrl,
                    movpac.id,
                    movpac.prontuario_id,
                    movpac.dtentrega,
                    movpac.operador_id,
                    movpac.diferenca,
                    movpac.entreguepor,
                    movpac.ndoc,
                    movpac.obsfat,
                    movpac.hrentrega,
                    prontuario.nome,
                    prontuario.nome_social,
                    prontuario.data_nasc,
                    prontuario.data_nasc AS dtnasc,
                    operador.nome AS nomope,
                    convenio.codigo AS codconv,
                    convenio.fantasia AS nomconv,
                    motina.descricao AS motina_descricao
                FROM movpac
                LEFT JOIN prontuario ON prontuario.id = movpac.prontuario_id
                LEFT JOIN operador ON operador.id = movpac.operador_id
                LEFT JOIN motina ON motina.id = movpac.status
                LEFT JOIN convenio ON convenio.id = prontuario.convenio_id
                WHERE movpac.amostra between :inicio AND :fim
                ORDER BY movpac.amostra DESC
                offset :offset limit :limit`;

            const resultado = await Movpac.sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements: {
                    offset: Number(offset) * Number(limit),
                    limit: Number(limit),
                    inicio,
                    fim
                }
            });

            if (resultado.length) {
                const count = await Movpac.count({
                    where: {
                        amostra: {
                            [Op.between]: [inicio, fim]
                        }
                    },
                })

                resultado[0].count = count;
            }

           return res.status(200).json(resultado);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getComprovanteColetaValues(req, res) {
        try {
            const {
                Movpac,
                Prontuario,
                Convenio,
                Plano,
                Medico,
                Operador,
                Posto,
                Situacao,
                Envio,
                Movexa,
                Exame,
                Entrega
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movpac"."id" DESC';
            if (req.params.id) {
                where += ` "Movpac"."id" = ${req.params.id} `;
            }

            let atendimentos = await Movpac.findAll({
                order: Movpac.sequelize.literal(order),
                where: Movpac.sequelize.literal(where),
                attributes: [
                    'id',
                    'urgente',
                    'idade',
                    'mes',
                    'dia',
                    'dataentra',
                    'dtentrega',
                    'valtot',
                    'totpag',
                    'obs',
                    'amostra',
                ],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            'convenio_id',
                            'data_nasc',
                            'nome',
                            'plano_id',
                            'prontuario',
                            'sexo',
                            'senhawebpro',
                            'email',
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                ]
                            },
                            {
                                model: Plano,
                                as: 'plano',
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: [
                                    'nome_med'
                                ]
                            },
                        ],
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: [
                            'dataentra',
                            'valconv',
                            'veio',
                            'urgenteexm',
                            'amostra',
                            'posto',
                            'dtentrega',
                            'corstatusexm',
                            'valpac',
                            'movpac_id',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'codigo',
                                    'descricao',
                                    'reciptri_id',
                                ]
                            }
                        ]
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome'],
                    },
                    {
                        model: Posto,
                        attributes: [
                            'descricao',
                            'responsavel',
                            'endereco',
                            'bairro',
                            'cidade',
                            'uf',
                            'cep',
                            'ddd',
                            'fone',
                            'codigo',
                            'email'
                        ]
                    },
                    {
                        model: Situacao,
                        as: 'situacao',
                    },
                    {
                        model: Envio,
                        as: 'envio',
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                        attributes: [
                            'codigo',
                            'descricao',
                        ]
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const atendimento_trim = [];

                atendimentos = JSON.parse(JSON.stringify(atendimentos));

                atendimentos.map(atendimento => {
                    const newAtendimento = {
                        ...atendimento,
                        posto_id: atendimento.posto,
                        envio: {
                            ...atendimento.envio,
                            descricao: atendimento.envio.descricao.trim(),
                        },
                    };

                    atendimento_trim.push(newAtendimento);
                    return atendimento;
                });
                return res.status(200).json(atendimento_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getReciboFaturamentoValues(req, res) {
        try {
            const {
                Movpac,
                Prontuario,
                Convenio,
                Medico,
                Operador,
                Posto,
                Movexa,
                Exame,
                Cid,
                Plano
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movpac"."id" DESC';
            if (req.params.id) {
                where += ` "Movpac"."id" = ${req.params.id} `;
            }

            let atendimentos = await Movpac.findAll({
                order: Movpac.sequelize.literal(order),
                where: Movpac.sequelize.literal(where),
                attributes: [
                    'id',
                    'urgente',
                    'idade',
                    'mes',
                    'dia',
                    'dataentra',
                    'dtentrega',
                    'valtot',
                    'totpag',
                    'obsfat',
                    'amostra',
                    'descval',
                    'descperc',
                ],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            'convenio_id',
                            'data_nasc',
                            'nome',
                            'plano_id',
                            'prontuario',
                            'rg',
                            'ddd1',
                            'fone1',
                            'matric'
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                ]
                            },
                            {
                                model: Plano,
                                as: 'plano',
                                attributes: [
                                    'valch'
                                ]
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: [
                                    'nome_med'
                                ]
                            },
                        ],
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: [
                            'dataentra',
                            'valconv',
                            'amostra',
                            'posto',
                            'dtentrega',
                            'corstatusexm',
                            'valpac',
                            'movpac_id',
                            'amb',
                            'requisicao',
                            'valbruto'
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'codigo',
                                    'descricao',
                                    'reciptri_id',
                                ]
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                ]
                            },
                        ]
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome'],
                    },
                    {
                        model: Posto,
                        attributes: [
                            'descricao',
                            'responsavel',
                            'endereco',
                            'bairro',
                            'cidade',
                            'uf',
                            'cep',
                            'ddd',
                            'fone',
                            'codigo',
                            'email'
                        ]
                    },
                    {
                        model: Cid,
                        as: 'cid',
                        attributes: [
                            'descricao'
                        ]
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const atendimento_trim = [];

                atendimentos = JSON.parse(JSON.stringify(atendimentos));

                atendimentos.map(atendimento => {
                    const newAtendimento = {
                        ...atendimento,
                        posto_id: atendimento.posto,
                    };

                    atendimento_trim.push(newAtendimento);
                    return atendimento;
                });
                return res.status(200).json(atendimento_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getMapaTrabalhoValues(req, res) {
        try {
            const {
                Movpac,
                Prontuario,
                Convenio,
                Medico,
                Posto,
                Movexa,
                Exame,
                Setor,
                Entrega
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movpac"."id" DESC';
            if (req.params.id) {
                where += ` "Movpac"."id" = ${req.params.id} `;
            }

            let atendimentos = await Movpac.findAll({
                order: Movpac.sequelize.literal(order),
                where: Movpac.sequelize.literal(where),
                attributes: [
                    'id',
                    'idade',
                    'mes',
                    'dia',
                    'dataentra',
                    'dtentrega',
                    'amostra',
                ],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            'convenio_id',
                            'data_nasc',
                            'nome',
                            'plano_id',
                            'prontuario',
                            'matric',
                            'ddd1',
                            'fone1'
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                ]
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: [
                                    'nome_med'
                                ]
                            },
                        ],
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: [
                            'dataentra',
                            'valconv',
                            'amostra',
                            'posto',
                            'dtentrega',
                            'valpac',
                            'movpac_id',
                            'amb',
                            'requisicao',
                            'valbruto',
                            'statusexm',
                            'imppaci'
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'id',
                                    'codigo',
                                    'descricao',
                                ],
                                include: [
                                    {
                                        model: Setor,
                                        as: 'setor',
                                        attributes: [
                                            'impmap',
                                            'descricao',
                                        ]
                                    }
                                ]
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                ]
                            },
                        ]
                    },
                    {
                        model: Posto,
                        attributes: [
                            'descricao',
                            'responsavel',
                            'endereco',
                            'bairro',
                            'cidade',
                            'uf',
                            'cep',
                            'ddd',
                            'fone',
                            'codigo',
                            'email'
                        ]
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                        attributes: [
                            'codigo',
                            'descricao',
                        ]
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const atendimento_trim = [];

                atendimentos = JSON.parse(JSON.stringify(atendimentos));

                atendimentos.map(atendimento => {
                    const newAtendimento = {
                        ...atendimento,
                        posto_id: atendimento.posto,
                    };

                    atendimento_trim.push(newAtendimento);
                    return atendimento;
                });
                return res.status(200).json(atendimento_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getGuiaTissValues(req, res) {
        try {
            const {
                Movpac,
                Prontuario,
                Convenio,
                Plano,
                Medico,
                Movexa,
                Exame,
                Empresa,
                Espmed,
                Cid,
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movpac"."id" DESC';
            if (req.params.id) {
                where += ` "Movpac"."id" = ${req.params.id} `;
            }

            let atendimentos = await Movpac.findAll({
                order: Movpac.sequelize.literal(order),
                where: Movpac.sequelize.literal(where),
                attributes: [
                    'id',
                    'dataentra',
                ],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: [
                            'convenio_id',
                            'valplano',
                            'nome',
                            'cns',
                        ],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                    'registro',
                                    'guia_tiss_logo_key',
                                ]
                            },
                        ],
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: [
                            'id',
                            'dtautoriza',
                            'guiaprincipal',
                            'requisicao',
                            'autoriza',
                            'dtautorizae',
                            'matricula',
                            'tipocsm',
                            'dtsolic',
                            'dataentra',
                            'valconv',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'id',
                                    'codigo',
                                    'descricao',
                                ],
                            },
                            {
                                model: Plano,
                                as: 'plano',
                                attributes: [
                                    'id',
                                    'descricao',
                                ],
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: [
                                    'id',
                                    'fantasia',
                                    'agrupatiss',
                                ]
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: [
                                    'nome_med',
                                    'crm',
                                    'ufcrm',

                                ],
                                include: [
                                    {
                                        model: Espmed,
                                        as: 'espmed',
                                        attributes: [
                                            'cnes',
                                        ]
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        model: Empresa,
                        as: 'empresa',
                        attributes: [
                            'cgc_cpf',
                            'razao',
                            'cnes',
                            'logra',
                            'endereco',
                            'cidade',
                            'uf',
                            'cep',
                            'ibge',
                            'responsavel',
                            'cbos',
                        ],
                    },
                    {
                        model: Cid,
                        as: 'cid',
                        attributes: [
                            'codigo',
                            'descricao',
                        ]
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const atendimento_trim = [];

                atendimentos = JSON.parse(JSON.stringify(atendimentos));

                atendimentos.map(atendimento => {
                    const newAtendimento = {
                        ...atendimento,
                        posto_id: atendimento.posto,
                    };

                    atendimento_trim.push(newAtendimento);
                    return atendimento;
                });
                return res.status(200).json(atendimento_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getTabelaValues(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);
            const data = req.query;
            const values = [];

            for (let i = 0; i < data.values.length; i++) {
                const element = data.values[i];
                const tabelaValues = await Movexa.sequelize
                    .query(`
                        SELECT
                            mx.id AS movexa_id,
                            ex.descricao AS exame_descricao,
                            tb.id AS tabela_id,
                            tb.depara AS tabela_depara,
                            tb1.codamb AS tabela1_codamb
                        FROM movpac AS mp
                        LEFT JOIN movexa AS mx ON mx.movpac_id = mp.id
                        LEFT JOIN exame AS ex ON ex.id = mx.exame_id
                        LEFT JOIN plano AS plan ON plan.id = mx.plano_id
                        LEFT JOIN tabela AS tb ON tb.id = plan.tabela_id
                        LEFT JOIN tabela1 AS tb1 ON tb1.tabela_id = tb.id AND tb1.exame_id = ex.id
                        WHERE mx.id = ${element};
                    `, {
                        type: QueryTypes.SELECT,
                    }).catch(() => {
                        throw new Error(`Não foi possível buscar os dados das tabelas.`);
                    });

                if (tabelaValues.length > 0) {
                    values.push({
                        movexa_id: tabelaValues[0].movexa_id,
                        exame_descricao: tabelaValues[0].exame_descricao,
                        tabela_id: tabelaValues[0].tabela_id,
                        tabela_depara: tabelaValues[0].tabela_depara,
                        tabela1_codamb: tabelaValues[0].tabela1_codamb,
                    });
                }
            }

            if (!values) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            return res.status(200).json(values);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getEtiquetasExamesValues(req, res) {
        try {
            const {
                Movpac,
                Movexa,
                Exame,
                Setor,
                Posto
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movpac"."id" DESC';
            if (req.params.id) {
                where += ` "Movpac"."id" = ${req.params.id} `;
            }

            let atendimentos = await Movpac.findAll({
                order: Movpac.sequelize.literal(order),
                where: Movpac.sequelize.literal(where),
                attributes: [
                    'id',
                ],
                include: [
                    {
                        model: Posto,
                        attributes: [
                            'controla_coleta_entrega'
                        ]
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: [
                            'dataentra',
                            'valconv',
                            'amostra',
                            'posto',
                            'dtentrega',
                            'valpac',
                            'movpac_id',
                            'amb',
                            'requisicao',
                            'valbruto',
                            'statusexm',
                            'imppaci',
                            'coletar',
                            'recebeu'
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: [
                                    'id',
                                    'codigo',
                                    'descricao',
                                    'recipcol_id',
                                    'reciptri_id',
                                ],
                                include: [
                                    {
                                        model: Setor,
                                        as: 'setor',
                                        attributes: [
                                            'impmap',
                                            'descricao',
                                        ]
                                    }
                                ]
                            },
                        ]
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(atendimentos);
        } catch (error) {
            return res.tatus(400).json({ error: error.message });
        }
    }

    async getEmailEnviado(req, res) {
        try {
            const { EmailEnviadoAtendimento } = Database.getModels(req.database);
            const { movpac_id } = req.query;

            const email = await EmailEnviadoAtendimento.findOne({
                attributes: ['id', 'movpac_id', 'has_sent'],
                where: {movpac_id: movpac_id},
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(email);
        } catch (error) {
            return res.tatus(400).json({ error: error.message });
        }
    }

    async geraEtiquetasValues(req, res) {
        try {
            const { Movpac } = Database.getModels(req.database);
            const data = JSON.parse(req.query.values);
            const etiquetas = [];

            for (let i = 0; i < data.examesValues.length; i++) {
                const item = data.examesValues[i];
                const value = await Movpac.sequelize.query(
                    `select gera_etiqueta_lab('
                        ${data.movpac_id}',
                        '${data.etq_coleta}',
                        '${data.etq_triagem}',
                        '${item.recipcol_id}',
                        '${item.reciptri_id}
                    ')`,
                {
                    type: QueryTypes.SELECT,
                }).catch(Movpac.sequelize, err => {
                    return err.message;
                });

                if (value.length > 0) {
                    for (let i = 0; i < value.length; i++) {
                        const element = value[i];
                        const regExp = /\(([^)]+)\)/;
                        const matches = regExp.exec(element.gera_etiqueta_lab);
                        const newElement = matches[1].split(',');
                        const descricaoRecipiente = newElement[12].split('"')[1].trim()
                        etiquetas.push({
                            marca: newElement[0],
                            posto: newElement[1],
                            amostra: newElement[2],
                            dataentra: newElement[3],
                            horaentra: newElement[4],
                            dtcoleta: newElement[5],
                            hrcoleta: newElement[6],
                            urgente: newElement[7],
                            tubo: newElement[8],
                            nome: newElement[9],
                            movpac_id: newElement[10],
                            recip: newElement[11],
                            desc_recip: descricaoRecipiente,
                            exames: newElement[13],
                            qtdexa: newElement[14],
                            prontuario_id: newElement[15],
                            idade: newElement[16],
                            mes: newElement[17],
                            dia: newElement[18],
                        });
                    }
                }
            }

            return res.status(200).json(etiquetas);
        } catch (error) {
            return res.tatus(400).json({ error: error.message });
        }
    }

    async geraAmostra(req, res){
        try {
            const sequelize = Database.instances[req.database];
            const amostra = await sequelize
                .query(
                    `select gera_num_amostra('${req.params.posto}')`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            return res.status(200).json(amostra[0].gera_num_amostra);
        } catch(e){
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res){
        try {
            const { Movpac, Movexa, Movcai, Operador, Convenio, ConvenioLoteFat } = Database.getModels(req.database);
            const sequelize = Database.instances[req.database];
            const {movpacData, movexaData, movcaiData, conferencia, convenios_lotefat, convenios_lotefat_consulta} = req.body;

            const atendimentoData = {
                ...movpacData,
                movexa: [...movexaData],
                movcai: [...movcaiData]
            }; // Clonando objeto, para caso precisar usar o original da forma que veio do front...

            for (let i = 0; i < atendimentoData.movexa.length; i++) {
                const exame = atendimentoData.movexa[i];
                if(exame.id === null){
                    delete exame.id;
                }
                if(atendimentoData.id){
                    exame.movpac_id = atendimentoData.id
                }
            }
            for (let i = 0; i < atendimentoData.movcai.length; i++) {
                const pagamento = atendimentoData.movcai[i];
                if(pagamento.id === null){
                    delete pagamento.id;
                }
                if(atendimentoData.id){
                    pagamento.movpac_id = atendimentoData.id
                }
            }

            let campo = 'dt_banco';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: QueryTypes.SELECT,
                })
            const { dt_banco } = getParam[0];
            const data = await PegaData(req, dt_banco);
            const hora = await PegaHora(req, dt_banco);

            let newAtendimentoResponse = {};
            if (atendimentoData.id) {
                await Movpac.sequelize
                    .transaction(async transaction => {
                        if(conferencia){
                            for (let index = 0; index < convenios_lotefat.length; index++) {
                                const convenio_lotefat = convenios_lotefat[index];
                                await ConvenioLoteFat.create({
                                    ...convenio_lotefat,
                                    data,
                                    hora,
                                    operador_id: req.userId,
                                    status: 'AB',
                                    idopera_ultacao: req.userId,
                                }, {
                                    transaction
                                })

                                await Convenio.update({lote: convenio_lotefat.lotefat_id}, {
                                    where: { id: convenio_lotefat.convenio_id },
                                    transaction
                                })
                            }

                            for (let index = 0; index < convenios_lotefat_consulta.length; index++) {
                                const convenio_lotefat = convenios_lotefat_consulta[index];
                                await ConvenioLoteFat.create({
                                    ...convenio_lotefat,
                                    data,
                                    hora,
                                    operador_id: req.userId,
                                    status: 'AB',
                                    idopera_ultacao: req.userId,
                                    consulta: '1'
                                }, {
                                    transaction
                                })

                                await Convenio.update({lotecon: convenio_lotefat.lotefat_id}, {
                                    where: { id: convenio_lotefat.convenio_id },
                                    transaction
                                })
                            }
                        }

                        const oldData = await Movpac.findByPk(atendimentoData.id, {
                            include: [
                                { model: Movexa, as: 'movexa' },
                                { model: Movcai, as: 'movcai' },
                            ]
                        });

                        if (!oldData) {
                            return res.status(400).json({
                                error: `Nenhum registro encontrado com este id ${atendimentoData.id}`
                            });
                        }

                        // Métodos Delta
                        const metodos = ['added', 'changed', 'deleted'];

                        // Model // Objeto Referência // Nome Tabela Referência
                        const tabelas = [
                            { model: Movexa, obj: 'movexa', nome: `movexa` },
                            { model: Movcai, obj: 'movcai', nome: `movcai` }
                        ];

                        for (let idxTabela = 0; idxTabela < tabelas.length; idxTabela++) {
                            const tabela = tabelas[idxTabela];

                            const objDelta = getDelta(
                              oldData[tabela.nome],
                              atendimentoData[tabela.obj]
                            );

                            for (let idxMetodo = 0; idxMetodo < metodos.length; idxMetodo++) {
                                const metodo = metodos[idxMetodo];

                                for (
                                    let idxDelta = 0;
                                    idxDelta < objDelta[metodo].length;
                                    idxDelta++
                                    ) {
                                    const itemDelta = objDelta[metodo][idxDelta];

                                    switch (metodo) {
                                        case 'changed':
                                            const itemLocalizado = atendimentoData[tabela.obj].find(
                                                item => item.id === itemDelta.id
                                            );
                                            if (itemLocalizado && itemLocalizado.caixa_id === 0) {
                                                delete itemLocalizado.caixa_id;
                                            }
                                            await tabela.model
                                                .update(itemLocalizado, {
                                                    where: { id: itemLocalizado.id },
                                                    transaction
                                                })
                                                .catch(err => {
                                                    return res.status(400).json({ error: err.message });
                                                });
                                            break;

                                        case 'deleted':
                                            await itemDelta.destroy({ transaction })
                                                .catch(err => {
                                                    return res.status(400).json({ error: err.message });
                                                });
                                            break;

                                        default:
                                            await tabela.model
                                                .create(itemDelta, {
                                                    transaction
                                                })
                                                .catch(tabela.model.sequelize, err => {
                                                    return res.status(400).json({ error: err.message });
                                                });
                                            break;
                                    }
                                }
                            }
                        }

                        newAtendimentoResponse = await Movpac.update(atendimentoData, {
                            where: { id: atendimentoData.id },
                            transaction
                        }).then(x => {
                            return Movpac.findByPk(atendimentoData.id, {
                                include: [
                                    { model: Movexa, as: 'movexa' },
                                    { model: Movcai, as: 'movcai' },
                                ],
                                transaction
                            });
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    });
            } else {
                await Movpac.sequelize
                    .transaction(async transaction => {
                        newAtendimentoResponse = await Movpac.create(atendimentoData, {
                            include: [
                                { model: Movexa, as: 'movexa' },
                                { model: Movcai, as: 'movcai' },
                            ],
                            transaction
                        })
                        .then(x => {
                            Object.keys(x.rawAttributes)
                            return Movpac.findByPk(x.get('id'), {
                                include: [
                                    { model: Movexa, as: 'movexa' },
                                    { model: Movcai, as: 'movcai' },
                                ],
                                transaction
                            });
                        })
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    });
            }

            campo = 'usacalccustoexa';

            const parametros = await Operador.sequelize
                .query(`select ${campo} from param, param2, paramf`, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if(parametros[0].usacalccustoexa === '1'){
                const getCusto = async (movpac_id, movexa_id, exame_id) => {
                    const custoreal = await sequelize
                        .query(
                            `SELECT
                                PRODUTO.ID,
                                PRODUTO.DESCRICAO,
                                PRODUTO.CUSTO,
                                COUNT(EXAMECUSTO.PRODUTO_ID) AS QTDEXA,
                                ROUND(PRODUTO.CUSTO / COUNT(EXAMECUSTO.PRODUTO_ID),4) AS CUSTOREAL
                            FROM MOVEXA
                            LEFT JOIN EXAMECUSTO ON EXAMECUSTO.EXAME_ID = MOVEXA.EXAME_ID
                            LEFT JOIN PRODUTO ON PRODUTO.ID = EXAMECUSTO.PRODUTO_ID
                            WHERE MOVEXA.MOVPAC_ID = ${movpac_id}
                            GROUP BY PRODUTO.DESCRICAO, EXAMECUSTO.PRODUTO_ID, PRODUTO.CUSTO, PRODUTO.ID
                            ORDER BY EXAMECUSTO.PRODUTO_ID
                            `, {
                                type: QueryTypes.SELECT,
                            });

                    const exacus = await sequelize
                        .query(
                            `SELECT
                                PRODUTO_ID
                                FROM EXAMECUSTO
                                WHERE EXAMECUSTO.EXAME_ID = ${exame_id}
                            `, {
                                type: QueryTypes.SELECT,
                            });

                    let custouni = 0;

                    for (let i = 0; i < custoreal.length; i++) {
                        const exaCustoreal = custoreal[i];
                        const obj = exacus.find(item => {
                            item.produto_id === exaCustoreal.id
                        })
                        if(obj){
                            custouni += custoreal.custoreal;
                        }
                    }

                    sequelize
                        .query(
                            `UPDATE
                                MOVEXA
                                SET CUSTOUNIT = ${custouni}
                                WHERE MOVEXA.ID = ${movexa_id}
                            `, {
                                type: QueryTypes.UPDATE,
                            });

                    return custouni;
                }

                let custopac = 0;
                for (let i = 0; i < newAtendimentoResponse.movexa.length; i++) {
                    const movexa = newAtendimentoResponse.movexa[i];
                    custopac += await getCusto(movexa.movpac_id, movexa.id, movexa.exame_id);
                }

                console.log(custopac)
                console.log(newAtendimentoResponse.id)
                sequelize
                    .query(
                        `
                            UPDATE MOVPAC
                            SET CUSTOPAC = ${custopac}
                            WHERE MOVPAC.ID = ${newAtendimentoResponse.id}
                        `, {
                            type: QueryTypes.UPDATE,
                        });
            }

            return res.status(200).json(newAtendimentoResponse);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexExamesByAtendimento(req, res) {
        try {
            const {
                Movexa,
                Exame,
                Recip,
                Material,
                Convenio,
                Plano,
                Medico,
                Operador,
                Espmed,
                Etiquetaws,
                Movpac,
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movexa"."id"';
            if (req.params.id) {
                where += ` "Movexa"."movpac_id" = ${req.params.id} `;
            }

            let exames = await Movexa.findAll({
                order: Movexa.sequelize.literal(order),
                where: Movexa.sequelize.literal(where),
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        include: [
                            {
                                model: Recip,
                                as: 'recipcol',
                            },
                            {
                                model: Recip,
                                as: 'reciptri',
                            },
                        ],
                    },
                    {
                        model: Material,
                        as: 'material',
                    },
                    {
                        model: Convenio,
                        as: 'convenio',
                    },
                    {
                        model: Plano,
                        as: 'plano',
                    },
                    {
                        model: Medico,
                        as: 'medico',
                        include: [
                            {
                                model: Espmed,
                                as: 'espmed',
                            },
                        ],
                    },
                    {
                        model: Operador,
                        as: 'operador',
                    },
                    {
                        model: Etiquetaws,
                        as: 'etiquetaws',
                    },
                    {
                        model: Movpac,
                        as: 'movpac',
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const exames_trim = [];

                exames = JSON.parse(JSON.stringify(exames));

                exames.map(atendimento => {
                    exames_trim.push(atendimento);
                    return atendimento;
                });
                return res.status(200).json(exames_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexPagamentosByAtendimento(req, res) {
        try {
            const {
                Movcai,
                Operador,
                Banco,
                Cartao,
                Caixa,
            } = Database.getModels(req.database);

            let where = '';
            const order = ' "Movcai"."id"';
            if (req.params.id) {
                where += ` "Movcai"."movpac_id" = ${req.params.id} `;
            }

            let pagamentos = await Movcai.findAll({
                order: Movcai.sequelize.literal(order),
                where: Movcai.sequelize.literal(where),
                include: [
                    {
                        model: Operador,
                        as: 'operador',
                    },
                    {
                        model: Banco,
                        as: 'banco',
                    },
                    {
                        model: Cartao,
                        as: 'cartao',
                        attributes: {
                            include: [['id', 'codigo']],
                        },
                    },
                    {
                        model: Caixa,
                        as: 'caixa',
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const pagamentos_trim = [];

                pagamentos = JSON.parse(JSON.stringify(pagamentos));

                pagamentos.map(pagamento => {
                    pagamentos_trim.push(pagamento);
                    return pagamento;
                });
                return res.status(200).json(pagamentos_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async validaExclusao(req, res) {
        try {
            const {
                Movpac,
                Movcai,
                Posto,
                Movexa,
                Operador,
            } = Database.getModels(req.database);

            const validacoes = {
                pagamentos: false,
                exames_coletados: false,
                exames_malotes: false,
                exames_fu_sf: false,
                exames_resultados_lancados: false,
                exames_conffat: false,
                exames_autorizados_orizon: false,
            };

            // Inicio Movpac
            const movpacs = await Movpac.findAll({
                where: {
                    id: req.params.id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            // Fim Movpac

            const movpac = movpacs[0];

            // Inicio Pagamentos
            const pagamentos = await Movcai.findAll({
                where: {
                    movpac_id: req.params.id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (pagamentos.length > 0) {
                validacoes.pagamentos = pagamentos.length;
            }
            // Fim Pagamentos

            // Inicio Exames
            const posto = await Posto.findAll({
                where: {
                    codigo: movpac.posto,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const campo = 'DESCOLETA_MATERIAL, CAD_ATEND_DEL';

            const opParams = await Operador.sequelize
                .query(
                    `select ${campo} from operador, operador2, operador3 where operador.id = ${req.userId} AND operador2.operador_id = ${req.userId} AND operador3.operador_id = ${req.userId}`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const operadorParams = opParams[0];

            if (
                posto[0] &&
                posto[0].controla_coleta_entrega === '1' &&
                (operadorParams.descoleta_material !== '1' ||
                    operadorParams.cad_atend_del !== '1')
            ) {
                const exames_coletados = await Movexa.sequelize
                    .query(
                        `SELECT
                            MOVPAC_ID
                        FROM MOVEXA
                        WHERE MOVEXA.MOVPAC_ID = ${req.params.id}
                            AND COALESCE(MOVEXA.COLETA_ID,0) > 0
                        `,
                        {
                            type: QueryTypes.SELECT,
                        }
                    )
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                if (exames_coletados.length > 0) {
                    validacoes.exames_coletados = exames_coletados.length;
                }

                const exames_malotes = await Movexa.sequelize
                    .query(
                        `SELECT
                            MOVPAC_ID
                        FROM MOVEXA
                        WHERE MOVEXA.MOVPAC_ID = ${req.params.id}
                            AND COALESCE(MOVEXA.MALOTE_ID,0) > 0
                        `,
                        {
                            type: QueryTypes.SELECT,
                        }
                    )
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                if (exames_malotes.length > 0) {
                    validacoes.exames_malotes = exames_malotes.length;
                }

                const exames_fu_sf = await Movexa.sequelize
                    .query(
                        `SELECT
                            MOVPAC_ID
                        FROM MOVEXA
                        WHERE MOVEXA.MOVPAC_ID = ${req.params.id}
                            AND NOT (
                                MOVEXA.STATUSEXM = 'FU'
                                OR
                                MOVEXA.STATUSEXM = 'SF'
                            )
                        `,
                        {
                            type: QueryTypes.SELECT,
                        }
                    )
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                if (exames_fu_sf.length > 0) {
                    validacoes.exames_fu_sf = exames_fu_sf.length;
                }
            }

            const exames_resultados_lancados = await Movexa.sequelize
                .query(
                    `SELECT
                        MOVPAC_ID
                    FROM MOVEXA
                    WHERE MOVEXA.MOVPAC_ID = ${req.params.id}
                        AND (
                            MOVEXA.STATUSEXM IN ('ER','LA','CF','IM','EN','EP','LP','BL')
                        )
                    `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (exames_resultados_lancados.length > 0) {
                validacoes.exames_resultados_lancados =
                    exames_resultados_lancados.length;
            }

            const exames_conffat = await Movexa.sequelize
                .query(
                    `SELECT
                        MOVPAC_ID
                    FROM MOVEXA
                    WHERE MOVEXA.MOVPAC_ID = ${req.params.id}
                        AND MOVEXA.CONFFAT = '1'
                    `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (exames_conffat.length > 0) {
                validacoes.exames_conffat = exames_conffat.length;
            }

            const exames_autorizados_orizon = await Movexa.sequelize
                .query(
                    `SELECT
                        COUNT(*) as AUTORIZADOS
                    FROM MOVEXA
                    WHERE MOVEXA.MOVPAC_ID = ${req.params.id} AND STATUSORIZON = 1
                    `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (parseInt(exames_autorizados_orizon[0].autorizados) > 0) {
                validacoes.exames_autorizados_orizon = parseInt(
                    exames_autorizados_orizon[0].autorizados
                );
            }

            // Final Exames

            try {
                return res.status(200).json(validacoes);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async verificaAmostra(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { tabela, posto, amostra, movpac } = req.params;

            let where = '';
            if (movpac) {
                where += ` AND ${tabela}.ID <> ${movpac}`;
            }

            const data = await sequelize.query(
                `
                    SELECT POSTO, AMOSTRA FROM ${tabela} WHERE POSTO = '${posto}' AND AMOSTRA = '${amostra}' ${where}
                `,
                {
                    type: QueryTypes.SELECT,
                }
            );

            return res.status(200).json(data);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getExamesCadastradosMes(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { movexa_id, dt_fatura, exame_id, plano_id } = req.query;

            const ano = format(parseISO(dt_fatura), 'yyyy');
            const mes = format(parseISO(dt_fatura), 'MM');

            const result = await sequelize
                .query(`
                    SELECT
                        COUNT(*) AS TOTEXA,
                        EXAME_ID
                    FROM MOVEXA
                    WHERE EXAME_ID = ${exame_id}
                        AND PLANO_ID = ${plano_id}
                        AND EXTRACT(MONTH FROM DTFATURA) = '${mes}'
                        AND EXTRACT(YEAR  FROM DTFATURA) = '${ano}'
                        AND MOVEXA.ID <> ${movexa_id}
                    GROUP BY EXAME_ID
                `, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getPesoAlturaExames(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { exames_ids } = req.query;

            const where = exames_ids.join("','");

            const result = await sequelize
                .query(`
                    SELECT
                        exame.codigo,
                        exame.descricao,
                        exame.id,
                        exame.exige_peso_atend,
                        exame.exige_altura_atend
                    FROM exame
                    WHERE exame.id IN ('${where}')
                        AND (COALESCE(EXAME.EXIGE_PESO_ATEND,0) + COALESCE(EXAME.EXIGE_ALTURA_ATEND,0) > 0)
                `, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getAprovacaoPacote(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { where, dataIni, dataFin, movpac_id } = req.query;

            const result = await sequelize
                .query(`
                    SELECT
                        CAST(COUNT(movexa.id) AS NUMERIC(5)) AS total_exames,
                        plano.limite,
                        convenio.fantasia AS desc_convenio,
                        plano.descricao AS desc_plano,
                        movexa.convenio_id,
                        movexa.plano_id
                    FROM movexa
                    LEFT JOIN convenio ON (convenio.id = movexa.convenio_id)
                    LEFT JOIN plano ON (plano.convenio_id = convenio.id)
                    WHERE (COALESCE(plano.limite,0) > 0)
                        AND (COALESCE(plano.percconv,0.00) > 0.00)
                        AND (movexa.dataentra BETWEEN '${dataIni}' AND '${dataFin}')
                        AND (movexa.movpac_id <> ${movpac_id})
                        ${where || ''}
                    GROUP BY plano.limite, convenio.fantasia, plano.descricao, movexa.convenio_id, movexa.plano_id
                    ORDER BY convenio.fantasia, plano.descricao, plano.limite
                `, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async autorizaDesconto(req,res) {
        const { Operador, Operador3 } = Database.getModels(req.database);
        const { login, senha } = req.body;

        const operadorRes = await Operador.findOne({
                where: Operador.sequelize.where(
                    Operador.sequelize.fn(
                        'upper',
                        Operador.sequelize.col('nome')
                    ),
                    Operador.sequelize.fn('upper', login)
                ),
                attributes: ['id', 'nome', 'senope', 'status'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

        if(!operadorRes){
            return res.status(400).json({ error: 'Usuário ou senha inválido.' });
        }

        const senope = operadorRes.senope.trim();

        if(senha !== senope) {
            return res.status(400).json({ error: 'Usuário ou senha inválido.' });
        }

        const status = operadorRes.status;

        if(status !== 0){
            return res.status(400).json({ error: 'Usúario não consta como ativo.' });
        }

        const {id, nome} = operadorRes;

        const operador3Response = await Operador3.findOne({
            attributes: ['operador_id', 'autoriza_desconto'],
            where: {operador_id: id},
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        if(!operador3Response || operador3Response.autoriza_desconto !== '1'){
            return res.status(400).json({ error: 'Usuário sem permissão para autorizar descontos.' });
        }


        return res.status(200).json({id, nome: nome.trim(), autoriza_desconto: operador3Response.autoriza_desconto});

    }

    async justificativaDesconto(req,res) {
        const { TabLogCai } = Database.getModels(req.database);
        const log = await TabLogCai
            .create(req.body)
            .catch(tabela.model.sequelize, err => {
                return res.status(400).json({ error: err.message });
            });

        if(!log){
            return res.status(400).json({ error: 'Erro ao inserir justificativa.' });
        }

        return res.status(200).json({});
    }

    async delete(req, res) {
        try {
            const { Movpac } = Database.getModels(req.database);
            const sequelize = Database.instances[req.database];

            const movpacs = await Movpac.findAll({
                where: {
                    id: req.params.id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            // Fim Movpac

            const movpac = movpacs[0];

            await sequelize
                .transaction(async transaction => {
                    await sequelize
                        .query(
                            `INSERT INTO PACPORTAL(
                                MOVPAC_ID,
                                PRONTUARIO_ID,
                                POSTO,
                                AMOSTRA
                            ) VALUES (
                                ${movpac.id},
                                ${movpac.prontuario_id},
                                ${movpac.posto.toString()},
                                ${movpac.amostra.toString()}
                            )`,
                            { transaction }
                        )
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                    await sequelize
                        .query(
                            `DELETE FROM MOVEXA WHERE MOVEXA.MOVPAC_ID = ${movpac.id}`,
                            { transaction }
                        )
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                    await sequelize
                        .query(
                            `DELETE FROM MOVPAC WHERE MOVPAC.ID = ${movpac.id}`,
                            { transaction }
                        )
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                })
                .error(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({});
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getImageBase64Value(req, res) {
        let values = req.query.values;

        values = JSON.parse(values);

        const key = values.key;
        const params = { Bucket: 'sialab', Key: key };

        let imageBase64 = null;
        s3.getObject(params, function(err, data) {
            if (err) {
                console.log(err);
            }

            imageBase64 = data.Body.toString('base64');
            return res.status(200).json({
                base64: imageBase64
            });
        });
    }

    async enviarDocumentoEmail(req, res) {
        try {
            const data = req.body;
            const { EmailEnviadoAtendimento } = Database.getModels(req.database);

            let emailEnviado = null;
            emailEnviado = await Queue.add(EnvioDocumento.key, data);

            if (!emailEnviado) {
                return res.status(400).json({ message: 'Erro ao tentar enviar o e-mail' });
            }

            data.emailEnviadoData.has_sent = 1;
            const email = await EmailEnviadoAtendimento.create(
                data.emailEnviadoData
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(email);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'id':
                filter += ` Unaccent(CAST("movpac"."id" AS TEXT)) ILIKE Unaccent('${filterValue}%') `;
                break;
            case 'dataentra':
                filter += ` movpac.dataentra between '${filterValue}' `;
                break;
            case 'nome':
                filter += ` Unaccent(CAST("prontuario"."nome" AS TEXT)) ILIKE Unaccent('${filterValue}%') `;
                break;
            case 'data_nasc':
                filter += ` prontuario.data_nasc = '${filterValue}' `;
                break;
            case 'nomope':
                filter += ` Unaccent(CAST("operador"."nome" AS TEXT)) ILIKE Unaccent('${filterValue}%') `;
                break;
            case 'nomconv':
                filter += ` Unaccent(CAST("convenio"."fantasia" AS TEXT)) ILIKE Unaccent('${filterValue}%') `;
                break;
            case 'motina_descricao':
                filter += ` Unaccent(CAST("motina"."descricao" AS TEXT)) ILIKE Unaccent('${filterValue}%') `;
                break;
            case 'intervalo_amostras':
                filter += ` MOVPAC.AMOSTRA BETWEEN '${filterValue.primeira}' AND '${filterValue.segunda}'`;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("movpac"."${filterName}",'')))) ILIKE Unaccent('%${filterValue}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new AtendimentoController();
