import { QueryTypes } from 'sequelize';
import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';
import { DataEnt, geraId, procSQL, valorExa } from './functions/functions';
import Sequelize from 'sequelize';
import { format, parseISO } from 'date-fns';
import { gerarRelatorioHtml } from './functions/functions';

class ExameController {
    async index(req, res) {
        try {
            const { Exame, Motina, Setor } = Database.getModels(req.database);
            const { page = 1 } = req.query;

            let { limit = 10 } = req.query;

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
                req.query.search.includes('%') ? (limit = 500) : null;
                where = ` "Exame"."status" = 0 and (Unaccent(upper(trim(coalesce("Exame"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Exame"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += ExameController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = ExameController.handleFilters(filter, filtervalue);
                }
            }

            const exames = await Exame.findAll({
                order: Exame.sequelize.literal(`${order} ${orderdesc}`),
                where: Exame.sequelize.literal(where),
                attributes: [
                    'id',
                    'codigo',
                    'descricao',
                    'setor_id',
                    'fantasia',
                    'status',
                    'preparo',
                    'idopera_ultacao',
                    [Exame.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    { model: Setor, as: 'setor', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const exames_trim = exames.map(exame => {
                    if (exame) {
                        try {
                            exame.descricao = exame.descricao
                                ? exame.descricao.trim()
                                : '';
                            if (exame.status >= 0) {
                                exame.motina
                                    ? (exame.motina.descricao = exame.motina
                                          .descricao
                                          ? exame.motina.descricao.trim()
                                          : '')
                                    : null;
                            }
                        } catch (err) {
                            return res.status(400).json({ error: err.message });
                        }
                    }

                    return exame;
                });
                return res.status(200).json(exames_trim);
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
                Exame,
                Motina,
                Setor,
                Esptab,
                Apoio,
                Layout,
                Rotina,
                Recip,
                Material,
                Linha,
                Matriz,
                Metodo,
                Examealt,
                Examematperm,
                Exameinc,
                Examecusto,
                Produto,
                Examatmed,
                Matmed,
            } = Database.getModels(req.database);

            const exames = await Exame.findOne({
                where: { id: req.params.id },
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    { model: Setor, as: 'setor', attributes: ['descricao'] },
                    {
                        model: Esptab,
                        as: 'esptab',
                        attributes: ['codigo', 'descricao'],
                    },
                    { model: Apoio, as: 'apoio', attributes: ['razao'] },
                    { model: Layout, as: 'layout', attributes: ['descricao'] },
                    { model: Rotina, as: 'rotnor', attributes: ['descricao'] },
                    { model: Rotina, as: 'roturg', attributes: ['descricao'] },
                    { model: Recip, as: 'recipcol', attributes: ['descricao'] },
                    { model: Recip, as: 'reciptri', attributes: ['descricao'] },
                    {
                        model: Material,
                        as: 'materials',
                        attributes: ['descricao', 'id'],
                    },
                    { model: Linha, as: 'linha', attributes: ['descricao'] },
                    { model: Matriz, as: 'matriz', attributes: ['descricao'] },
                    { model: Metodo, as: 'metodo', attributes: ['descricao'] },
                    {
                        model: Examatmed,
                        as: 'examatmed',
                        attributes: [
                            'id',
                            'exame_id',
                            'matmed_id',
                            'valor',
                            'qtd',
                            'marca',
                            'unid',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Matmed,
                                as: 'matmed',
                                attributes: ['id', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Examealt,
                        as: 'examealt',
                        attributes: [
                            'id',
                            'exame_id',
                            'layout_id',
                            'apoio_id',
                            'material_id',
                            'idade_ini',
                            'mes_ini',
                            'dia_ini',
                            'idade_fin',
                            'mes_fin',
                            'dia_fin',
                            'sexo',
                            'alterna',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Layout,
                                as: 'layout',
                                attributes: ['id', 'descricao'],
                            },
                            {
                                model: Apoio,
                                as: 'apoio',
                                attributes: ['id', 'razao'],
                            },
                            {
                                model: Material,
                                as: 'material',
                                attributes: ['id', 'codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Examematperm,
                        as: 'examematperm',
                        attributes: [
                            'id',
                            'exame_id',
                            'material_id',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Material,
                                as: 'examematperm',
                                attributes: ['id', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Exameinc,
                        as: 'exameinc',
                        attributes: [
                            'id',
                            'exame_id',
                            'exame_id_inc',
                            'fatura',
                            'naofatura',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Exame,
                                as: 'exame_inc',
                                attributes: ['id', 'codigo', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Examecusto,
                        as: 'examecusto',
                        attributes: [
                            'id',
                            'exame_id',
                            'produto_id',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Produto,
                                as: 'produto',
                                attributes: ['id', 'descricao'],
                            },
                        ],
                    },
                ],
            });
            if (!exames) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            exames.descricao = exames.descricao ? exames.descricao.trim() : '';
            exames.motina.descricao = exames.motina.descricao
                ? exames.motina.descricao.trim()
                : '';
            return res.status(200).json(exames);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexResultadosAnteriores(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);
            const {
                prontuario_id,
                movpac_id,
                exame_id,
                layout_id,
                semana,
            } = req.query;

            let select = `
                SELECT
                    PRONTUARIO.ID,
                    MOVEXA.DTCOLETA,
                    MOVPAC.HORAENTRA,
                    MOVEXA.MOVPAC_ID,
                    MOVEXA.EXAME_ID,
                    MOVEXA.STATUSEXM,
                    MOVEXA.RESULTADO,
                    MOVEXA.POSTO,
                    MOVEXA.AMOSTRA,
                    0.00 AS VALOR,
                    0.00 AS VALOR2,
                    0.00 AS VALOR3,
                    0.00 AS VALOR4,
                    0.00 AS VALOR5,
                    0.00 AS VALOR6,
                    0.00 AS VALOR7,
                    0.00 AS VALOR8,
                    0.00 AS VALOR9,
                    MOVEXA.LAYOUT_ID,
                    MOVEXA.DATA_LANRES,
                    MOVEXA.HORA_LANRES
                    FROM MOVEXA
                    LEFT JOIN MOVPAC     ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME      ON EXAME.ID  = MOVEXA.EXAME_ID
                    LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                WHERE PRONTUARIO.ID = ${prontuario_id}
                    AND MOVEXA.MOVPAC_ID <> ${movpac_id}
                    AND (MOVEXA.EXAME_ID = ${exame_id} OR MOVEXA.LAYOUT_ID = ${layout_id})
                    AND ((COALESCE(EXAME.ANT_LAYOUT_ID_DIFERENTE,0) = 1) OR MOVEXA.LAYOUT_ID = ${layout_id})
                    AND (MOVEXA.STATUSEXM IN ('IM','EN','EP','CF'))
                GROUP BY PRONTUARIO.ID, MOVEXA.DTCOLETA, MOVPAC.HORAENTRA, MOVEXA.MOVPAC_ID, MOVEXA.EXAME_ID, MOVEXA.STATUSEXM, MOVEXA.RESULTADO, MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.LAYOUT_ID, MOVEXA.DATA_LANRES, MOVEXA.HORA_LANRES
                ORDER BY MOVEXA.DTCOLETA DESC,MOVPAC.HORAENTRA DESC
            `;
            if (semana === '1') {
                select += 'LIMIT 0';
            } else {
                select += 'LIMIT 5';
            }

            const exames = await Movexa.sequelize
                .query(select, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(exames);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexExamesByCodigo(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            const { depara } = req.query;

            let where = '';
            if (depara || depara === 'true') {
                where = ` WHERE EXAME.DEPARA = '${req.params.codigo}' AND (COALESCE(EXAME.TRAVAEXA,0) = 0 OR COALESCE(EXAME.TRAVAEXA,0) = 1) `;
            } else {
                where = ` WHERE EXAME.CODIGO = '${req.params.codigo}' AND (COALESCE(EXAME.TRAVAEXA,0) = 0 OR COALESCE(EXAME.TRAVAEXA,0) = 1) `;
            }

            const select = `
                SELECT EXAME.ID,
                    EXAME.CODIGO,
                    EXAME.DESCRICAO,
                    EXAME.DEPARA,
                    EXAME.MATERIAL_ID,
                    EXAME.STATUS,
                    MATERIAL.DESCRICAO AS DESCMAT,
                    MATERIAL.CODIGO AS CODMAT,
                    PERM_COLETAR,
                    PERM_RECEBER,
                    TRIAGEMELE,
                    ROTURG_ID,
                    EXAME.EXM_COVID19
                FROM EXAME
                LEFT JOIN MATERIAL ON MATERIAL.ID = EXAME.MATERIAL_ID
            	${where}
            `;

            const exames = await Movexa.sequelize
                .query(select, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(exames);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getDataEntregaExame(req, res) {
        try {
            const { data, hora, urgente } = req.query;
            const dt_entrega = await DataEnt(
                parseISO(`${data}T00:00:00-03:00`),
                req.params.id,
                hora,
                urgente,
                req
            );

            return res.status(200).json(dt_entrega);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getValorExa(req, res) {
        try {
            const { plano_id, tipo, reducao } = req.query;
            let valorexa = await valorExa(
                req,
                plano_id,
                req.params.id,
                tipo,
                reducao
            );

            if (!isNaN(parseFloat(valorexa))) {
                valorexa = parseFloat(valorexa).toFixed(2);
            }

            return res.status(200).json(valorexa);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getExamesInclusos(req, res) {
        try {
            const { Exameinc, Exame, Material } = Database.getModels(
                req.database
            );

            const result = await Exameinc.findAll({
                where: { exame_id: req.params.id },
                include: [
                    {
                        model: Exame,
                        as: 'exame_inc',
                        attributes: ['codigo', 'descricao', 'material_id'],
                        include: [
                            {
                                model: Material,
                                as: 'materials',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async validaDescoberto(req, res) {
        try {
            const { Descoberto } = Database.getModels(req.database);

            const result = await Descoberto.findOne({
                attributes: ['id', 'exame_id', 'motivo_desc'],
                where: {
                    plano_id: req.params.plano_id,
                    exame_id: req.params.exame_id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async validaNaoFatura(req, res) {
        try {
            const { Naofatura } = Database.getModels(req.database);

            const result = await Naofatura.findOne({
                attributes: ['id', 'exame_id'],
                where: {
                    plano_id: req.params.plano_id,
                    exame_id: req.params.exame_id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async limiteExames(req, res) {
        try {
            const { Limite } = Database.getModels(req.database);

            // SELECT ID, EXAME_ID, QTD FROM LIMITE WHERE EXAME_ID = ?ALLTRIM(STR(__EXAME_ID)) AND PLANO_ID = ?ALLTRIM(STR(__PLANO_ID))

            const result = await Limite.findAll({
                attributes: ['id', 'exame_id', 'qtd'],
                where: {
                    plano_id: req.params.plano_id,
                    exame_id: req.params.exame_id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getRotinasExame(req, res) {
        try {
            const { Exame, Rotina } = Database.getModels(req.database);

            // SELECT URG_PRIO_PERMITE, ROTPRIOR_ID, ROTINA.HORAS, ROTINA.QTDIAS FROM EXAME LEFT JOIN ROTINA ON ROTINA.ID = EXAME.ROTPRIOR_ID WHERE EXAME.CODIGO = ?THISFORM.CNT_EXAME.TEXTBOX_PADRAO1.VALUE

            const result = await Exame.findOne({
                attributes: [
                    'urg_prio_permite',
                    'rotnor_id',
                    'roturg_id',
                    'rotprior_id',
                ],
                where: { codigo: req.params.codigo },
                include: [
                    {
                        model: Rotina,
                        as: 'rotnor',
                        attributes: ['horas', ['qtdias', 'dias']],
                    },
                    {
                        model: Rotina,
                        as: 'roturg',
                        attributes: ['horas', ['qtdias', 'dias']],
                    },
                    {
                        model: Rotina,
                        as: 'rotprior',
                        attributes: ['horas', ['qtdias', 'dias']],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getGuiasExames(req, res) {
        try {
            const { Exame, Operador } = Database.getModels(req.database);
            let { exames } = req.query;

            exames = JSON.parse(exames);

            const campo = 'GUIA_EXA';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const { guia_exa } = getParam[0];

            if (guia_exa === '1') {
                for (let i = 0; i < exames.length; i++) {
                    const exame = exames[i];

                    exame.requisicao = exame.requisicao
                        ? exame.requisicao.trim()
                        : exame.requisicao;

                    if (!exame.requisicao) {
                        let curseqguiaexa = [];
                        let currequisicao = [];
                        do {
                            await Exame.sequelize
                                .transaction(
                                    {
                                        type:
                                            Sequelize.Transaction.TYPES
                                                .EXCLUSIVE,
                                    },
                                    async transaction => {
                                        await Exame.sequelize
                                            .query(
                                                'LOCK TABLE EXAME IN ACCESS EXCLUSIVE MODE',
                                                {
                                                    type: QueryTypes.SELECT,
                                                    transaction,
                                                }
                                            )
                                            .catch(err => {
                                                return res.status(400).json({
                                                    error: err.message,
                                                });
                                            });

                                        await Exame.sequelize
                                            .query(
                                                `UPDATE EXAME SET SEQGUIA = COALESCE(EXAME.SEQGUIA,0) + 1 WHERE EXAME.ID = ${exame.exame_id}`,
                                                {
                                                    type: QueryTypes.UPDATE,
                                                    transaction,
                                                }
                                            )
                                            .catch(err => {
                                                return res.status(400).json({
                                                    error: err.message,
                                                });
                                            });

                                        curseqguiaexa = await Exame.sequelize
                                            .query(
                                                `SELECT SEQGUIA FROM EXAME WHERE EXAME.ID = ${exame.exame_id}`,
                                                {
                                                    type: QueryTypes.SELECT,
                                                    transaction,
                                                }
                                            )
                                            .catch(err => {
                                                return res.status(400).json({
                                                    error: err.message,
                                                });
                                            });
                                    }
                                )
                                .error(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });

                            const currequisicao = await Exame.sequelize
                                .query(
                                    `SELECT TRIM(REQUISICAO) AS REQUISICAO FROM MOVEXA WHERE TRIM(MOVEXA.REQUISICAO) = '${curseqguiaexa[0]
                                        .seqguia || 0}' AND MOVEXA.EXAME_ID = ${
                                        exame.exame_id
                                    }`,
                                    { type: QueryTypes.SELECT }
                                )
                                .catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });

                            if (!currequisicao.length > 0) {
                                break;
                            }
                        } while (true);
                        exame.requisicao = curseqguiaexa[0].seqguia;
                    }
                }
            } else {
                const currequi = [];
                exames = exames.map(exame => {
                    const itemLocalizado = currequi.filter(
                        item =>
                            item.requisicao === exame.requisicao ? exame.requisicao.trim() : '' &&
                            item.convenio_id === exame.convenio_id
                    );

                    if (itemLocalizado.length === 0) {
                        currequi.push({
                            requisicao: exame.requisicao ? exame.requisicao.trim() : '',
                            convenio_id: exame.convenio_id,
                        });
                    }

                    return { ...exame, requisicao: exame.requisicao ? exame.requisicao.trim() : ''};
                });

                for (let i = 0; i < currequi.length; i++) {
                    const item = currequi[i];
                    if (
                        (await procSQL(req, 'convenio', 'guiaautomanual', {
                            id: item.convenio_id,
                        })) === '1'
                    ) {
                        if ((item.requisicao || '').length < 3) {
                            const newIDRequisicao = await geraId(
                                req,
                                'guiaauto_seq'
                            );
                            for (let i = 0; i < exames.length; i++) {
                                const exame = exames[i];
                                if (exame.requisicao === item.requisicao) {
                                    exame.requisicao = newIDRequisicao;
                                }
                            }
                        }
                    } else if (
                        (await procSQL(req, 'convenio', 'guiaauto', {
                            id: item.convenio_id,
                        })) === '1'
                    ) {
                        const newIDRequisicao = await geraId(
                            req,
                            'guiaauto_seq'
                        );
                        for (let i = 0; i < exames.length; i++) {
                            const exame = exames[i];
                            if (exame.requisicao === item.requisicao) {
                                exame.requisicao = newIDRequisicao;
                            }
                        }
                    }
                }
            }

            return res.status(200).json(exames);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getQuestionariosExames(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            let { exames } = req.query;

            exames = JSON.parse(exames).join("','");
            exames = ` AND QUESTAOEXA.EXAME_ID IN ('${exames}') `;

            const result = await sequelize
                .query(
                    `
                    SELECT
                        DISTINCT(QUESTAO.ID),
                        QUESTAO.DESCRICAO,
                        QUESTAO.OBRIGA
                    FROM QUESTAOEXA
                    LEFT JOIN QUESTAO ON QUESTAO.ID = QUESTAOEXA.QUESTAO_ID
            	    WHERE QUESTAO.STATUS = 0 ${exames}
                `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const {
                Exame,
                Examealt,
                Examematperm,
                Exameinc,
                Examecusto,
                Examatmed,
            } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                // razao: Yup.string()
                //     .transform(v => (v === null ? '' : v))
                //     .required('Campo razao obrigatorio'),
                // apoioexa: Yup.array().of(
                //     Yup.object().shape({
                //         exame_id: Yup.number()
                //             .transform(value =>
                //                 Number.isNaN(value) ? undefined : value
                //             )
                //             .required('Obrigatorio informar o exame.'),
                //     })
                // ),
                // apoiopos: Yup.array().of(
                //     Yup.object().shape({
                //         posto_id: Yup.number()
                //             .transform(value =>
                //                 Number.isNaN(value) ? undefined : value
                //             )
                //             .required('Obrigatorio informar o posto.'),
                //     })
                // ),
            });
            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            const where = ` (CAST("Exame"."codigo" AS TEXT) = '${req.body.codigo
                .trim()
                .toUpperCase()}')`;
            const exameExists = await Exame.findOne({
                where: Exame.sequelize.literal(where),
                attributes: ['id', 'codigo'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (req.body.id) {
                if (exameExists && req.body.id !== `${exameExists.id}`) {
                    return res
                        .status(400)
                        .json({ error: 'Exame com código já cadastrado.' });
                }
                const exame = await Exame.findByPk(req.body.id, {
                    include: [
                        { model: Examatmed, as: 'examatmed' },
                        { model: Examealt, as: 'examealt' },
                        { model: Exameinc, as: 'exameinc' },
                        { model: Examecusto, as: 'examecusto' },
                        { model: Examematperm, as: 'examematperm' },
                    ],
                });
                if (!exame) {
                    return res.status(400).json({
                        error: `Nenhum exame encontrado com este id ${req.body.id}`,
                    });
                }
                const examatmedDelta = getDelta(
                    exame.examatmed,
                    req.body.examatmed
                );
                const examealtDelta = getDelta(
                    exame.examealt,
                    req.body.examealt
                );
                const exameincDelta = getDelta(
                    exame.exameinc,
                    req.body.exameinc
                );
                const examecustoDelta = getDelta(
                    exame.examecusto,
                    req.body.examecusto
                );
                const examematpermDelta = getDelta(
                    exame.examematperm,
                    req.body.examematperm
                );
                await Exame.sequelize
                    .transaction(async transaction => {
                        // Update
                        await Promise.all([
                            examatmedDelta.added.map(async examatmedD => {
                                await Examatmed.create(examatmedD, {
                                    transaction,
                                }).catch(Examatmed.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            examealtDelta.added.map(async examealtD => {
                                await Examealt.create(examealtD, {
                                    transaction,
                                }).catch(Examealt.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            exameincDelta.added.map(async exameincD => {
                                await Exameinc.create(exameincD, {
                                    transaction,
                                }).catch(Exameinc.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            examematpermDelta.added.map(async examematpermD => {
                                await Examematperm.create(examematpermD, {
                                    transaction,
                                }).catch(Examematperm.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            examecustoDelta.added.map(async examecustoD => {
                                await Examecusto.create(examecustoD, {
                                    transaction,
                                }).catch(Examecusto.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            examatmedDelta.changed.map(async examatmedData => {
                                const examatmed = req.body.examatmed.find(
                                    _examatmed =>
                                        _examatmed.id === examatmedData.id
                                );
                                await Examatmed.update(examatmed, {
                                    where: { id: examatmed.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            examematpermDelta.changed.map(
                                async examematpermData => {
                                    const examematperm = req.body.examematperm.find(
                                        _examematperm =>
                                            _examematperm.id ===
                                            examematpermData.id
                                    );
                                    await Examematperm.update(examematperm, {
                                        where: { id: examematperm.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            examealtDelta.changed.map(async examealtData => {
                                const examealt = req.body.examealt.find(
                                    _examealt =>
                                        _examealt.id === examealtData.id
                                );
                                await Examealt.update(examealt, {
                                    where: { id: examealt.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            exameincDelta.changed.map(async exameincData => {
                                const exameinc = req.body.exameinc.find(
                                    _exameinc =>
                                        _exameinc.id === exameincData.id
                                );
                                await Exameinc.update(exameinc, {
                                    where: { id: exameinc.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            examecustoDelta.changed.map(
                                async examecustoData => {
                                    const examecusto = req.body.examecusto.find(
                                        _examecusto =>
                                            _examecusto.id === examecustoData.id
                                    );
                                    await Examecusto.update(examecusto, {
                                        where: { id: examecusto.id },
                                        transaction,
                                    }).catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                                }
                            ),
                            examatmedDelta.deleted.map(async examatmedDel => {
                                await examatmedDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            examealtDelta.deleted.map(async examealtDel => {
                                await examealtDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            exameincDelta.deleted.map(async exameincDel => {
                                await exameincDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                            examematpermDelta.deleted.map(
                                async examematpermDel => {
                                    await examematpermDel
                                        .destroy({ transaction })
                                        .catch(err => {
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        });
                                }
                            ),
                            examecustoDelta.deleted.map(async examecustoDel => {
                                await examecustoDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Exame.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
                // Finally update apoio
                const { descricao, status } = req.body;
                return res.status(200).json({
                    descricao,
                    status,
                });
            }

            if (exameExists) {
                return res
                    .status(400)
                    .json({ error: 'Exame com codigo ja cadastrado.' });
            }
            req.body.codigo = req.body.codigo.toUpperCase();
            const { id, descricao, status } = await Exame.create(req.body, {
                include: [
                    { model: Examatmed, as: 'examatmed' },
                    { model: Examealt, as: 'examealt' },
                    { model: Exameinc, as: 'exameinc' },
                    { model: Examecusto, as: 'examecusto' },
                    { model: Examematperm, as: 'examematperm' },
                ],
            })
                .then(x => {
                    return Exame.findByPk(x.get('id'), {
                        include: [
                            { model: Examatmed, as: 'examatmed' },
                            { model: Examealt, as: 'examealt' },
                            { model: Exameinc, as: 'exameinc' },
                            { model: Examecusto, as: 'examecusto' },
                            { model: Examematperm, as: 'examematperm' },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            return res.status(200).json({
                id,
                descricao,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Exame } = Database.getModels(req.database);
            await Exame.destroy({
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

    async estatistica(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const {
            postos,
            exames,
            convenios,
            dataini,
            datafim,
            chkfmnc,
            chkfatura,
            consideraExames,
            modelo,
        } = req.body;

        try {
            let tipoData = chkfatura === '1' ? 'DTFATURA' : 'DTCOLETA';
            let select = '';
            if (modelo === 'data') {
                select += `
                    SELECT
                        MOVEXA.${tipoData} AS DTCOLETA,
                        MOVEXA.EXAME_ID,
                        EXAME.DESCRICAO AS DESCEXA,
                        EXAME.CODIGO AS CODEXA,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        SUM(MOVEXA.VALCONV + MOVEXA.VALPAC) AS VALEXA
                        FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    WHERE `;
            } else {
                select += `
                    SELECT
                        MOVEXA.EXAME_ID,
                        EXAME.DESCRICAO AS DESCEXA,
                        EXAME.CODIGO AS CODEXA,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        SUM(MOVEXA.VALCONV + MOVEXA.VALPAC) AS VALEXA
                        FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    WHERE `;
            }

            if (consideraExames !== '1') {
                select += ` MOVEXA.EXAMEINC = 0 AND `;
            }

            if (chkfmnc === '1') {
                select += ` MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND `;
            }

            const periodo = `${format(new Date(dataini), 'yyyy-MM-dd')}'
                AND '${format(new Date(datafim), 'yyyy-MM-dd')}`;

            let where = `
                MOVPAC.POSTO IN (${postos}) AND
                MOVEXA.EXAME_ID IN (${exames}) AND
                MOVEXA.CONVENIO_ID IN (${convenios}) AND
                ${
                    chkfatura === '1'
                        ? ' COALESCE(MOVEXA.NAOFATURA,0) = 0 AND '
                        : ''
                }
                MOVEXA.${tipoData}
                BETWEEN '${periodo}' `;

            select += where;

            let groupBy = '';
            let orderBy = '';

            if (modelo === 'data') {
                groupBy = ` GROUP BY MOVEXA.${tipoData},
                    MOVEXA.EXAME_ID,
                    EXAME.DESCRICAO,
                    EXAME.CODIGO `;
                orderBy = `ORDER BY MOVEXA.${tipoData}, TOTEXA DESC`;
            } else {
                groupBy = ` GROUP BY MOVEXA.EXAME_ID,
                    EXAME.DESCRICAO,
                    EXAME.CODIGO `;
                orderBy = ` ORDER BY TOTEXA DESC`;
            }

            let limit = ' LIMIT 100001';

            select += groupBy;
            select += orderBy;
            select += limit;

            const dados = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
            });

            if (dados.length > 100000) {
                throw new RangeError('Quantidade de registros acima do limite');
            }

            return res.status(200).json(dados);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorio(req, res) {
        const { dados, dataini, datafim, profile, logo, color } = req.body;
        const { valor, tipoDeData } = dados.resto;
        try {
            const dadosDeExames = [];
            if (dados.modelo === 'data') {
                if (valor === 'sem valores') {
                    dados.exames.forEach(dado => {
                        let achou = false;
                        const dataFormatada = format(
                            parseISO(dado.dtcoleta),
                            'dd/MM/yyyy'
                        );
                        dadosDeExames.forEach(dadoDeExame => {
                            if (dataFormatada === dadoDeExame.data) {
                                achou = true;
                                dadoDeExame.itens.push({
                                    codigo: dado.codexa.trim(),
                                    descricao: dado.descexa.trim(),
                                    total: parseInt(dado.totexa),
                                });

                                dadoDeExame.totalDeExames += parseInt(
                                    dado.totexa
                                );
                            }
                        });
                        if (!achou) {
                            dadosDeExames.push({
                                data: dataFormatada,
                                totalDeExames: parseInt(dado.totexa),
                                itens: [
                                    {
                                        codigo: dado.codexa.trim(),
                                        descricao: dado.descexa.trim(),
                                        total: parseInt(dado.totexa),
                                    },
                                ],
                            });
                        }
                    });
                } else {
                    dados.exames.forEach(dado => {
                        let achou = false;
                        const dataFormatada = format(
                            parseISO(dado.dtcoleta),
                            'dd/MM/yyyy'
                        );
                        dadosDeExames.forEach(dadoDeExame => {
                            if (dataFormatada === dadoDeExame.data) {
                                achou = true;
                                dadoDeExame.itens.push({
                                    codigo: dado.codexa.trim(),
                                    descricao: dado.descexa.trim(),
                                    totalDeExames: parseInt(dado.totexa),
                                    totalDeValor: parseFloat(dado.valexa),
                                });

                                dadoDeExame.totalDeExamesDia += parseInt(
                                    dado.totexa
                                );
                                dadoDeExame.totalDeValorDia += parseFloat(
                                    dado.valexa
                                );
                            }
                        });
                        if (!achou) {
                            dadosDeExames.push({
                                data: dataFormatada,
                                totalDeExamesDia: parseInt(dado.totexa),
                                totalDeValorDia: parseFloat(dado.valexa),
                                itens: [
                                    {
                                        codigo: dado.codexa.trim(),
                                        descricao: dado.descexa.trim(),
                                        totalDeExames: parseInt(dado.totexa),
                                        totalDeValor: parseFloat(dado.valexa),
                                    },
                                ],
                            });
                        }
                    });
                }
            } else {
                if (valor === 'sem valores') {
                    dados.exames.forEach(dado => {
                        dadosDeExames.push({
                            codigo: dado.codexa.trim(),
                            descricao: dado.descexa.trim(),
                            totalDeExames: parseInt(dado.totexa),
                        });
                    });
                } else {
                    dados.exames.forEach(dado => {
                        dadosDeExames.push({
                            codigo: dado.codexa.trim(),
                            descricao: dado.descexa.trim(),
                            totalDeExames: parseInt(dado.totexa),
                            totalDeValor: parseFloat(dado.valexa),
                        });
                    });
                }
            }

            let dadosDeExamesMaisTotalGeral = {};
            let totalGeral = 0;
            if (dados.modelo === 'data') {
                if (valor === 'sem valores') {
                    dadosDeExames.forEach(a => (totalGeral += a.totalDeExames));
                    dadosDeExamesMaisTotalGeral = {
                        dadosDeExames,
                        totalGeral,
                    };
                } else {
                    totalGeral = {
                        exames: 0,
                        valor: 0,
                    };
                    dadosDeExames.forEach(a => {
                        totalGeral.exames += a.totalDeExamesDia;
                        totalGeral.valor += a.totalDeValorDia;
                    });

                    dadosDeExamesMaisTotalGeral = {
                        dadosDeExames,
                        totalGeral,
                    };
                }
            } else {
                if (valor === 'sem valores') {
                    dadosDeExames.forEach(a => (totalGeral += a.totalDeExames));
                    dadosDeExamesMaisTotalGeral = {
                        dadosDeExames,
                        totalGeral,
                    };
                } else {
                    totalGeral = {
                        exames: 0,
                        valor: 0,
                    };

                    dadosDeExames.forEach(a => {
                        totalGeral.exames += a.totalDeExames;
                        totalGeral.valor += a.totalDeValor;
                    });

                    dadosDeExamesMaisTotalGeral = {
                        dadosDeExames,
                        totalGeral,
                    };
                }
            }

            const modelPath = `/estatisticas/exames/${
                valor === 'sem valores' ? 'semvalores' : 'comvalores'
            }/${dados.modelo === 'data' ? 'data' : 'geral'}`;

            const html = await gerarRelatorioHtml({
                model: modelPath,
                data: {
                    registros: dadosDeExamesMaisTotalGeral,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte,
                    tipoDeData,
                },
                profile,
                logo,
                startDate: format(new Date(dataini), 'yyyy-MM-dd'),
                endDate: format(new Date(datafim), 'yyyy-MM-dd'),
                color: `#${color}`,
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async estatisticaLiberacao(req, res) {
        const { Movexa } = Database.getModels(req.database);

        const {
            modelo,
            postos,
            operadores,
            dataInicial,
            dataFinal,
            horaInicial,
            horaFinal,
        } = req.body;

        let select = '';

        try {
            const dataInicialcialFormatada = format(
                new Date(dataInicial),
                'yyyy-MM-dd'
            );
            const dataFinalFormatada = format(
                new Date (dataFinal),
                'yyyy-MM-dd'
            );

            if (modelo === 'sintetico') {
                select = `
                SELECT
                    MOVEXA.AMOSTRA,
                    MOVEXA.datalib as datalib,
                    movexa.datalib,
                    MOVEXA.ASSINA_OPE,
                    OPERADOR.NOME
                FROM MOVEXA
                    left JOIN OPERADOR ON MOVEXA.ASSINA_OPE = OPERADOR.ID
                WHERE
                        MOVEXA.DATALIB BETWEEN '${dataInicialcialFormatada}'
                         AND '${dataFinalFormatada}'
                AND MOVEXA.ASSINA_OPE IN (${operadores})
                AND MOVEXA.POSTO IN (${postos})
                ${(horaInicial && horaFinal)
                    ? `AND CAST(REPLACE(MOVEXA.HORALIB, ':', '') AS INTEGER)
                    BETWEEN ${horaInicial.replace(':', '')}
                    AND ${horaFinal.replace(':', '')}`: ''}
                ORDER BY
                    MOVEXA.DATALIB,
                    OPERADOR.NOME`;
            } else {
                select = `
                SELECT
                    MOVEXA.POSTO,
                    MOVEXA.AMOSTRA,
                    PRONTUARIO.NOME AS NOMEPRONTU,
                    EXAME.CODIGO,
                    EXAME.DESCRICAO,
                    MOVEXA.DATALIB,
                    MOVEXA.ASSINA_OPE,
                    OPERADOR.NOME,
                    MOVEXA.HORALIB
                FROM MOVEXA
                    INNER JOIN MOVPAC     ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    INNER JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                    INNER JOIN EXAME      ON EXAME.ID = MOVEXA.EXAME_ID
                    INNER JOIN OPERADOR   ON MOVEXA.ASSINA_OPE = OPERADOR.ID
                WHERE MOVEXA.DATALIB BETWEEN '${dataInicial}' AND '${dataFinal}'
                    AND MOVEXA.ASSINA_OPE IN (${operadores})
                    AND MOVEXA.POSTO IN (${postos})
                    ${(horaInicial && horaFinal)
                    ? `AND CAST(REPLACE(MOVEXA.HORALIB, ':', '') AS INTEGER)
                    BETWEEN ${horaInicial.replace(':', '')}
                    AND ${horaFinal.replace(':', '')}`: ''}
                    ORDER BY MOVEXA.DATALIB, OPERADOR.NOME `;
            }

            const dados = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
            });

            if (dados.length > 100000) {
                throw new RangeError('Quantidade de registros acima do limite');
            }

            return res.status(200).json({
                dados,
                total: dados.length
            });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioDeLiberacao (req, res) {
        const {
            dados,
            dataini,
            datafim,
            logo,
            profile,
            color,
        } = req.body;
        const { modelo } = dados;
        try {
            const dadosParaRelatorio = [];
            const { exames } = dados;
            if (modelo === 'analitico') {
                exames.forEach(ex => {
                    const dataFormatada = format(
                        parseISO(ex.datalib),
                        'dd/MM/yyyy'
                    );
                    const temNaMesmaData = dadosParaRelatorio.findIndex(
                        d => (d.data === dataFormatada)
                    );
                    if (temNaMesmaData === -1) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            total: 1,
                            operadores: [
                                {
                                    nome: ex.nome.trim(),
                                    assina_ope: ex.assina_ope,
                                    exames: [ex],
                                    total: 1,
                                },
                            ],
                        });
                    }
                    const objetoDestaData = dadosParaRelatorio[temNaMesmaData];
                    objetoDestaData.total += 1;
                    const temOMesmoOperador = objetoDestaData.operadores.findIndex(
                        op => op.assina_ope === ex.assina_ope
                    );
                    if (temOMesmoOperador === -1) {
                        return objetoDestaData.operadores.push({
                            nome: ex.nome.trim(),
                            assina_ope: ex.assina_ope,
                            exames: [ex],
                            total: 1,
                        });
                    }

                    const operadorEncontradoNoObjetoDestaData = objetoDestaData.operadores[temOMesmoOperador];
                    operadorEncontradoNoObjetoDestaData.total += 1;
                    operadorEncontradoNoObjetoDestaData.exames.push(ex);
                });
            } else {
                exames.forEach(ex => {
                    const dataFormatada = format(
                        parseISO(ex.datalib),
                        'dd/MM/yyyy'
                    );
                    const temNaMesmaData = dadosParaRelatorio.findIndex(
                        d => (d.data === dataFormatada)
                    );
                    if (temNaMesmaData === -1) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            total: 1,
                            operadores: [
                                {
                                    assina_ope: ex.assina_ope,
                                    nome: ex.nome.trim(),
                                    total: 1,
                                },
                            ],
                        });
                    }
                    const objetoDestaData = dadosParaRelatorio[temNaMesmaData];
                    objetoDestaData.total += 1;
                    const temOMesmoOperador = objetoDestaData.operadores.findIndex(
                        op => op.assina_ope === ex.assina_ope
                    );
                    if (temOMesmoOperador === -1) {
                        return objetoDestaData.operadores.push({
                            assina_ope: ex.assina_ope,
                            nome: ex.nome.trim(),
                            total: 1,
                        });
                    }

                    const operadorEncontradoNoObjetoDestaData = objetoDestaData.operadores[temOMesmoOperador];
                    operadorEncontradoNoObjetoDestaData.total += 1;
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/liberacaoexames/${modelo}`,
                data: {
                    exames: dadosParaRelatorio,
                    ehAUltimaParte: dados.ehAUltimaParte,
                    parte: dados.parte,
                    total: dados.totais.totalLiberados,
                },
                startDate: dataini,
                endDate: datafim,
                logo,
                profile,
                color: `#${color}`
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async getExamesLayout(req, res) {
        try {
            const { Exame } = Database.getModels(req.database);
            const examesIds = req.query.examesIds;

            let where = `"Exame"."id" IN (`;
            if (examesIds.length > 0) {
                for (let i = 0; i < examesIds.length; i++) {
                    const element = JSON.parse(examesIds[i]);
                    if (i + 1 < examesIds.length) {
                        where += `${element.id},`
                    } else {
                        where += `${element.id}`
                    }
                }
            }

            where += `)`

            const exames = await Exame.findAll({
                where: Exame.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'laymap'
                ],
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

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Exame"."codigo" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;

            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Exame"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;

            case 'fantasia':
                if (filterValue !== null) {
                    filter += ` CAST("Exame"."fantasia" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;

            case 'setor.descricao':
                if (filterValue !== null) {
                    filter += ` (Unaccent(upper(trim(coalesce("setor"."descricao",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                }
                break;

            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filter !== ''
                    ? (filter = ` (Unaccent(upper(trim(coalesce("Exame"."${filter}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new ExameController();
