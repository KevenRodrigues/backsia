import { QueryTypes } from 'sequelize';
import { format, subDays } from 'date-fns';
import * as Yup from 'yup';
import Database from '../../database';

import { calculaDiasMovpacPorParametro } from './functions/functions';

class LiberaController {
    async index(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Movpac, Prontuario } = Models;

            const { page = 1, limit = 10 } = req.query;

            const date = await calculaDiasMovpacPorParametro(req);

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
            // eslint-disable-next-line prefer-const
            let whereexa = '';

            if (req.query.search && req.query.search.length > 0) {
                where = ` "Material"."status" = 0 and (Unaccent(upper(trim(coalesce("Material"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Material"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += LiberaController.handleFilters(
                            filters[i].id,
                            filters[i].value,
                            req.query,
                            whereexa,
                            date
                        );
                    }
                } else {
                    where = LiberaController.handleFilters(
                        filter,
                        filtervalue,
                        req.query,
                        whereexa,
                        date
                    );
                }
            }

            if (postoperm !== '') {
                where +=
                    where === ''
                        ? ` where ("Movpac"."posto" in ('${postoperm.replace(
                              /,/gi,
                              "','"
                          )}'))`
                        : ` and ("Movpac"."posto" in ('${postoperm.replace(
                              /,/gi,
                              "','"
                          )}'))`;
            }

            const movpacs = await Movpac.findAll({
                order: Movpac.sequelize.literal(`${order} ${orderdesc}`),
                where: Movpac.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'posto',
                    "idade",
                    'amostra',
                    'dataentra',
                    'dtentrega',
                    'status',
                    'total',
                    [Movpac.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: Prontuario,
                        as: 'prontuario',
                        attributes: ['id', 'nome', 'posto'],
                    }
                ],
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(movpacs);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const {
                Movpac,
                Movexa,
                Exame,
                Prontuario,
                Material,
                Convenio,
                Plano,
                Medico,
            } = Models;

            const movpac = await Movpac.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'posto',
                    'amostra',
                    'idade',
                    'mes',
                    'dia',
                    'obs',
                    'obsfat',
                    'diferenca',
                    'idopera_ultacao',
                ],
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
                            ['fone1', 'fone'],
                        ],
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: [
                            'id',
                            'movpac_id',
                            'exame_id',
                            'valpac',
                            'valconv',
                            'material_id',
                            'convenio_id',
                            'plano_id',
                            'medico_id',
                            'matricula',
                            'dtentrega',
                            'dataentra',
                            [
                                Movpac.sequelize.literal(
                                    'descstatus(statusexm)'
                                ),
                                'statusexm',
                            ],
                            [
                                Movpac.sequelize.literal(
                                    'desccorstatus(statusexm)'
                                ),
                                'corstatusexm',
                            ],
                            [
                                Movpac.sequelize.literal(
                                    'descresul(movexa.statusresultado)'
                                ),
                                'statusresultado',
                            ],
                            [
                                Movpac.sequelize.literal(
                                    "CAST(VALRESUL(COALESCE(MOVEXA.RESULTADO,'')) AS CHAR(250))"
                                ),
                                'resultadoreduzido',
                            ],
                            [Movpac.sequelize.literal('statusexm'), 'status'],
                            'posto',
                            'amostra',
                            'valpac',
                            'valconv',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                            {
                                model: Material,
                                as: 'material',
                                attributes: ['descricao'],
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['fantasia'],
                            },
                            {
                                model: Plano,
                                as: 'plano',
                                attributes: ['descricao'],
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: ['nome_med'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!movpac) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            movpac.prontuario.nome = movpac.prontuario.nome.trim();
            movpac.movexa.map(movexa => {
                movexa.matricula = movexa.matricula
                    ? movexa.matricula.trim()
                    : null;
                if (movexa.exame) {
                    movexa.exame.codigo = movexa.exame.codigo.trim();
                    movexa.exame.descricao = movexa.exame.descricao.trim();
                    movexa.material
                        ? (movexa.material.descricao = movexa.material.descricao.trim())
                        : null;
                    movexa.convenio
                        ? (movexa.convenio.fantasia = movexa.convenio.fantasia.trim())
                        : null;
                    movexa.plano
                        ? (movexa.plano.descricao = movexa.plano.descricao.trim())
                        : null;
                    movexa.medico
                        ? (movexa.medico.nome_med = movexa.medico.nome_med.trim())
                        : null;
                }
                return movexa;
            });
            return res.status(200).json(movpac);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOneLaudo(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const {
                Movpac,
                Movexa,
                Exame,
                Prontuario,
                Material,
                Convenio,
                Plano,
                Medico,
            } = Models;

            const movpac = await Movpac.findOne({
                attributes: [
                    'id',
                    'posto',
                    'amostra',
                    'idade',
                    'mes',
                    'dia',
                    'obs',
                    'obsfat',
                    'idopera_ultacao',
                    'diferenca',
                ],
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
                            ['fone1', 'fone'],
                        ],
                    },
                    {
                        model: Movexa,
                        as: 'movexa',
                        where: { id: req.params.id },
                        attributes: [
                            'id',
                            'movpac_id',
                            'exame_id',
                            'layout_id',
                            'valpac',
                            'valconv',
                            'material_id',
                            'convenio_id',
                            'plano_id',
                            'medico_id',
                            'matricula',
                            'dataentra',
                            'dtentrega',
                            [Movpac.sequelize.literal('statusexm'), 'status'],
                            [
                                Movpac.sequelize.literal(
                                    'descstatus(statusexm)'
                                ),
                                'statusexm',
                            ],
                            [
                                Movpac.sequelize.literal(
                                    'REMOVE_DRIVE(movexa.resultado)'
                                ),
                                'resultado',
                            ],
                            [
                                Movpac.sequelize.literal(
                                    'desccorstatus(statusexm)'
                                ),
                                'corstatusexm',
                            ],
                            [
                                Movpac.sequelize.literal(
                                    'descresul(movexa.statusresultado)'
                                ),
                                'statusresultado',
                            ],
                            'dtentrega',
                            'posto',
                            'amostra',
                            'valpac',
                            'valconv',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                            {
                                model: Material,
                                as: 'material',
                                attributes: ['descricao'],
                            },
                            {
                                model: Convenio,
                                as: 'convenio',
                                attributes: ['fantasia'],
                            },
                            {
                                model: Plano,
                                as: 'plano',
                                attributes: ['descricao'],
                            },
                            {
                                model: Medico,
                                as: 'medico',
                                attributes: ['nome_med'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!movpac) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            try {
                movpac.prontuario.nome = movpac.prontuario.nome.trim();

                movpac.movexa.matricula = movpac.movexa.matricula
                    ? movpac.movexa.matricula.trim()
                    : null;
                if (movpac.movexa.exame) {
                    movpac.movexa.exame.codigo = movexa.exame.codigo.trim();
                    movpac.movexa.exame.descricao = movexa.exame.descricao.trim();
                    movpac.movexa.material
                        ? (movpac.movexa.material.descricao = movpac.movexa.material.descricao.trim())
                        : null;
                    movpac.movexa.convenio
                        ? (movpac.movexa.convenio.fantasia = movpac.movexa.convenio.fantasia.trim())
                        : null;
                    movpac.movexa.plano
                        ? (movpac.movexa.plano.descricao = movpac.movexa.plano.descricao.trim())
                        : null;
                    movpac.movexa.medico
                        ? (movpac.movexa.medico.nome_med = movpac.movexa.medico.nome_med.trim())
                        : null;
                }
                return res.status(200).json(movpac);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Movpac, Movexa } = Models;

            const schema = Yup.object().shape({
                id: Yup.number(),
                statusexm: Yup.string(),
                assina_ope: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            await Movexa.update(req.body, {
                where: { id: req.body.id },
            })
                .then(async () => {
                    const {
                        id,
                        statusexm,
                        assina_ope,
                        corstatusexm,
                        status,
                    } = await Movexa.findByPk(req.body.id, {
                        attributes: [
                            'id',
                            'statusexm',
                            'assina_ope',
                            [
                                Movexa.sequelize.literal(
                                    'desccorstatus(statusexm)'
                                ),
                                'corstatusexm',
                            ],
                            [Movpac.sequelize.literal('statusexm'), 'status'],
                            [
                                Movpac.sequelize.literal(
                                    'descstatus(statusexm)'
                                ),
                                'statusexm',
                            ],
                        ],
                    });
                    await Movexa.sequelize.query(
                        `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                            req.userId
                        },'RESULTADO LIBERADO STATUS: ${status.trim()}','${
                            req.headers.host
                        }')`
                    );
                    return res.status(200).json({
                        id,
                        statusexm,
                        assina_ope,
                        corstatusexm,
                        status,
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexAnterior(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Movexa } = Models;

            const anterior = await Movexa.sequelize
                .query(
                    "select retorna_ant(:prontuario_id,:exame_id,:layout_id,:movexa_id,'','1')",
                    {
                        replacements: {
                            prontuario_id: req.body.prontuario_id,
                            exame_id: req.body.exame_id,
                            layout_id: req.body.layout_id,
                            movexa_id: req.body.movexa_id,
                        },
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(anterior);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexgraficorastrea(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Movexa } = Models;

            const graficos = [];

            const grafico = await Movexa.sequelize
                .query(
                    'select count(*) OVER() as totpacfila from fila where datachamar isnull and data = current_date limit 1',
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            graficos.push({
                name: 'Pac Fila',
                value: grafico.length > 0 ? parseInt(grafico[0].totpacfila) : 0,
            });

            const grafico1 = await Movexa.sequelize
                .query(
                    `select count(*) OVER() as totpaccoleta from triagem left join movpac on movpac.id = triagem.movpac_id left join movexa on movexa.id = triagem.movexa_id where statusexm = 'FU' and coalesce(coletar,0) = 1 and coalesce(reciptri_id,0) > 0 and movpac.dataentra = current_date group by movpac.id limit 1`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            graficos.push({
                name: 'Pac a Coletar',
                value:
                    grafico1.length > 0
                        ? parseInt(grafico1[0].totpaccoleta)
                        : 0,
            });

            const grafico2 = await Movexa.sequelize
                .query(
                    `select count(*) OVER() as totpacmalote from triagem left join movpac on movpac.id = triagem.movpac_id left join movexa on movexa.id = triagem.movexa_id where statusexm = 'FM' and (coalesce(triagem.coletado,0) = 1 or coalesce(movexa.entregue,0) = 1) and coalesce(reciptri_id,0) > 0 and movpac.dataentra = current_date group by movpac.id limit 1`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            graficos.push({
                name: 'Pac Coletado',
                value:
                    grafico2.length > 0
                        ? parseInt(grafico2[0].totpacmalote)
                        : 0,
            });

            const grafico3 = await Movexa.sequelize
                .query(
                    `select count(*) OVER() as totpactriado from triagem left join movpac on movpac.id = triagem.movpac_id left join movexa on movexa.id = triagem.movexa_id where statusexm = 'TR' and (coalesce(triagem.triado,0) = 1) and coalesce(reciptri_id,0) > 0 and movpac.dataentra = current_date group by movpac.id limit 1`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            graficos.push({
                name: 'Pac Triado',
                value:
                    grafico3.length > 0
                        ? parseInt(grafico3[0].totpactriado)
                        : 0,
            });

            return res.status(200).json(graficos);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue, query, whereexa, date) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter += ` CAST("Movpac"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'prontuario.nome':
                if (query.parcial === 'true') {
                    whereexa = ` "movexa"."statusexm" = 'LA' `;
                    if (query.reimprime === 'true') {
                        whereexa = ` ("movexa"."statusexm" = 'LA' or "movexa"."statusexm" = 'IM' or "movexa"."statusexm" = 'EN' or "movexa"."statusexm" = 'CF') `;
                    }
                }
                filter +=
                    whereexa !== ''
                        ? ` (Unaccent("prontuario"."nome") ILIKE Unaccent('${filterValue}%')) and ${whereexa}`
                        : ` (Unaccent("prontuario"."nome") ILIKE Unaccent('${filterValue}%'))`;
                break;
            case 'dataentra':
                if (query.parcial === 'true') {
                    whereexa = ` "movexa"."statusexm" = 'LA' `;
                    if (query.reimprime === 'true') {
                        whereexa = ` ("movexa"."statusexm" = 'LA' or "movexa"."statusexm" = 'IM' or "movexa"."statusexm" = 'EN' or "movexa"."statusexm" = 'CF') `;
                    }
                }
                filter +=
                    whereexa !== ''
                        ? ` "Movpac"."dataentra" between '${filterValue}'`
                        : ` "Movpac"."dataentra" between '${filterValue}' `;

                break;
            case 'dtentrega':
                if (query.parcial === 'true') {
                    whereexa = ` "movexa"."statusexm" = 'LA' `;
                    if (query.reimprime === 'true') {
                        whereexa = ` ("movexa"."statusexm" = 'LA' or "movexa"."statusexm" = 'IM' or "movexa"."statusexm" = 'EN' or "movexa"."statusexm" = 'CF') `;
                    }
                }
                filter +=
                    whereexa !== ''
                        ? ` "Movpac"."dtentrega" between '${filterValue}'`
                        : ` "Movpac"."dtentrega" between '${filterValue}' `;
                break;
            case 'intervalo_amostras':
                filter += ` "Movpac"."amostra" between '${filterValue.primeira}' and '${filterValue.segunda}'`;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent("Movpac"."${filterName}") ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : (filter += ` ("Movpac"."dataentra" >= '${date}')`);
        }

        return filter;
    }
}

export default new LiberaController();
