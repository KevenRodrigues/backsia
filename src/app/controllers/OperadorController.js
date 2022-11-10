import { format, parseISO, intervalToDuration } from 'date-fns';
import * as Yup from 'yup';
import Database from '../../database';
import { QueryTypes } from 'sequelize';
import { gerarRelatorioHtml } from './functions/functions';

class OperadorController {
    async index(req, res) {
        try {
            const { Operador, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Operador"."nome",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Operador"."id" AS TEXT) LIKE '%${search.toUpperCase()}%') AND "Operador"."nivel" != 1`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += OperadorController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = OperadorController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const operadores = await Operador.findAll({
                order: Operador.sequelize.literal(`${order} ${orderdesc}`),
                where: Operador.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'nome',
                    'status',
                    'idopera_ultacao',
                    [Operador.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const operadores_trim = operadores.map(operador => {
                    operador.nome = operador.nome.trim();
                    operador.motina.descricao = operador.motina.descricao.trim();
                    return operador;
                });
                return res.status(200).json(operadores_trim);
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
                Operador,
                Operador2,
                Operador3,
                Operadorf,
                Motina,
                Nivel,
            } = Database.getModels(req.database);
            const operadores = await Operador.findByPk(req.params.id, {
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    { model: Operador2, as: 'operador2' },
                    { model: Operador3, as: 'operador3' },
                    { model: Operadorf, as: 'operadorf' },
                    { model: Nivel, as: 'nivelope', attributes: ['nome'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!operadores) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                operadores.nome = operadores.nome ? operadores.nome.trim() : '';
                // operadores.nivelope.nome = operadores.nivelope.nome
                //     ? operadores.nivelope.nome.trim()
                //     : '';
                operadores.motina.descricao = operadores.motina.descricao
                    ? operadores.motina.descricao.trim()
                    : '';

                return res.status(200).json(operadores);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const {
                Operador,
                Operador2,
                Operador3,
                Operadorf,
            } = Database.getModels(req.database);

            const schema = Yup.object().shape({});

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const operador = await Operador.findByPk(req.body.id, {
                    include: [
                        {
                            model: Operador2,
                            as: 'operador2',
                        },
                        {
                            model: Operador3,
                            as: 'operador3',
                        },
                        {
                            model: Operadorf,
                            as: 'operadorf',
                        },
                    ],
                });

                if (!operador) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id "${req.body.id}"`,
                    });
                }

                await Operador.sequelize.transaction(async t => {
                    await Operador.update(
                        req.body,
                        {
                            where: { id: req.body.id },
                            order: [['data', 'DESC']],
                        },
                        { transaction: t }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await Operador2.update(
                        req.body.operador2,
                        {
                            where: { id: req.body.operador2.id },
                        },
                        { transaction: t }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                    await Operador3.update(
                        req.body.operador3,
                        {
                            where: { id: req.body.operador3.id },
                        },
                        { transaction: t }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });

                    if(!req.body.operadorf.id){
                        req.body.operadorf.operador_id = req.body.id;
                        await Operadorf.create(req.body.operadorf,
                            { transaction: t }
                        ).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    } else {
                        await Operadorf.update(
                            req.body.operadorf,
                            {
                                where: { id: req.body.operadorf.id },
                            },
                            { transaction: t }
                        ).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    }
                });

                return res.status(200).json(operador);
            }
            const where = `(Unaccent(upper(trim(coalesce("Operador"."nome",'')))) = Unaccent(trim('${req.body.nome.toUpperCase()}'))) AND "Operador"."nivel" != 1`;

            const validaLogin = await Operador.findAll({
                where: Operador.sequelize.literal(where),
            });

            if (validaLogin.length > 0) {
                return res.status(400).json({
                    error: `Login já cadastrado, tente novamente!`,
                });
            }

            const operador = await Operador.create(req.body, {
                include: [
                    { model: Operador2, as: 'operador2' },
                    { model: Operador3, as: 'operador3' },
                    { model: Operadorf, as: 'operadorf' },
                ],
            })
                .then(x => {
                    return Operador.findByPk(x.get('id'), {
                        include: [
                            { model: Operador2, as: 'operador2' },
                            { model: Operador3, as: 'operador3' },
                            { model: Operadorf, as: 'operadorf' },
                        ],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(operador);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async estatisticaPorConferencia(req, res) {
        const { Movpac } = Database.getModels(req.database);
        const {
            postos,
            convenios,
            operadores,
            modelo,
            datafim,
            dataini,
        } = req.body;
        try {
            let select = '';
            let groupBy = '';
            let orderBy = '';

            if (modelo === 'analitico') {
                select = `
                    SELECT
                        MOVPAC.POSTO,
                        MOVPAC.AMOSTRA,
                        EXAME.CODIGO as EXMCOD,
                        EXAME.DESCRICAO
                        AS EXMDESC,
                        CONVENIO.CODIGO AS CONVCOD,
                        CONVENIO.FANTASIA,
                        PLANO.DESCRICAO AS PLANODESC,
                        MOVEXA.DTCONFOP,
                        MOVEXA.HRCONFOP,
                        OPERADOR.NOME,
                        MOVEXA.REQUISICAO,
                        MOVEXA.LOTEFAT_ID,
                        MOVEXA.OPER_ID_CONFOP
                    FROM MOVPAC
                        LEFT JOIN MOVEXA 	ON(MOVEXA.MOVPAC_ID = MOVPAC.ID)
                        LEFT JOIN EXAME 	ON(MOVEXA.EXAME_ID = EXAME.ID)
                        LEFT JOIN CONVENIO 	ON(MOVEXA.CONVENIO_ID = CONVENIO.ID)
                        LEFT JOIN PLANO 	ON(MOVEXA.PLANO_ID = PLANO.ID)
                        LEFT JOIN OPERADOR	ON(MOVEXA.OPER_ID_CONFOP = OPERADOR.ID) `;

                orderBy = `
                    ORDER BY
                        OPERADOR.NOME,
                        CONVENIO.CODIGO,
                        MOVEXA.REQUISICAO,
                        MOVPAC.POSTO,
                        MOVPAC.AMOSTRA,
                        EXAME.CODIGO `;
            } else {
                select = `
                    SELECT
                        MOVPAC.POSTO,
                        MOVPAC.AMOSTRA,
                        MOVEXA.DTCONFOP,
                        MOVEXA.HRCONFOP,
                        MOVEXA.OPER_ID_CONFOP as OPERADOR_ID,
                        OPERADOR.NOME,
                        CONVENIO.CODIGO AS CONVCOD,
                        CONVENIO.FANTASIA
                    FROM MOVPAC
                        LEFT JOIN MOVEXA 	ON(MOVEXA.MOVPAC_ID = MOVPAC.ID)
                        LEFT JOIN CONVENIO 	ON(MOVEXA.CONVENIO_ID = CONVENIO.ID)
                        LEFT JOIN OPERADOR	ON(MOVEXA.OPER_ID_CONFOP = OPERADOR.ID) `;

                groupBy = `
                    GROUP BY
                        OPERADOR.NOME,
                        MOVPAC.POSTO,
                        MOVPAC.AMOSTRA,
                        MOVEXA.DTCONFOP,
                        MOVEXA.HRCONFOP,
                        CONVENIO.CODIGO,
                        CONVENIO.FANTASIA,
                        MOVEXA.OPER_ID_CONFOP `;

                orderBy = `
                        ORDER BY
                            OPERADOR.NOME,
                            MOVPAC.POSTO,
                            MOVPAC.AMOSTRA,
                            MOVEXA.DTCONFOP,
                            MOVEXA.HRCONFOP,
                            CONVENIO.CODIGO `;
            }

            const dataInicialFormatada = format(
                parseISO(dataini),
                'yyyy-MM-dd'
            );
            const dataFinalFormatada = format(
                parseISO(datafim),
                'yyyy-MM-dd'
            );

            const periodo = `AND MOVEXA.DTCONFOP BETWEEN :dataInicial AND :dataFinal `;

            let where = `
                WHERE
                    MOVPAC.POSTO IN (:postos) AND
                    MOVEXA.CONVENIO_ID IN (:convenios) AND
                    MOVEXA.OPER_ID_CONFOP IN (:operadores) `;

            where += periodo;
            select += where;
            select += groupBy;

            select += orderBy;
            const data = await Movpac.sequelize.query(select, {
                replacements: {
                    dataInicial: dataInicialFormatada,
                    dataFinal: dataFinalFormatada,
                    postos,
                    convenios,
                    operadores,
                },
                type: QueryTypes.SELECT,
            });

            if (data.length > 100000) {
                throw new Error('Quantidade de registros acima do limite');
            }

            let total = 0;
            const arrayParaSoma = [];
            data.forEach(ex => {
                const temOperador = arrayParaSoma.findIndex(op => op.id === ex.operador_id);
                if (temOperador < 0) {
                    total += 1;
                    return arrayParaSoma.push({
                        id: ex.operador_id,
                        nome: ex.nome?.trim(),
                        exames: [ex],
                        total: 1,
                    });
                }

                const objetoDoOperador = arrayParaSoma[temOperador];
                const temPostoAmostra = objetoDoOperador.exames.findIndex(
                    e => e.posto === ex.posto && e.amostra === ex.amostra && e.requisicao === ex.requisicao
                );

                if (temPostoAmostra >= 0) return;

                total += 1;
                objetoDoOperador.total += 1;
                objetoDoOperador.exames.push(ex);
            });

            const dadosComSoma = {
                data,
                total,
            }

            return res.status(200).json(dadosComSoma);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioConferencia(req, res) {
        const { dados, dataini, datafim, color, profile, logo } = req.body;
        const { modelo, exames, parte, ehAUltimaParte } = dados;
        const { total } = dados.resto;

        try {
            const dadosParaRelatorio = [];
            if (modelo === 'analitico') {
                exames.forEach(ex => {
                    const temOperador = dadosParaRelatorio.findIndex(
                        op => op.id === ex.oper_id_confop
                    );
                    ex.dtconfop = format(parseISO(ex.dtconfop), 'dd/MM/yyyy');
                    if (temOperador < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.oper_id_confop,
                            nome: ex.nome?.trim(),
                            convenios: [
                                {
                                    fantasia: ex.fantasia?.trim(),
                                    codigo: ex.convcod,
                                    plano: ex.planodesc?.trim(),
                                    exames: [ex],
                                },
                            ],
                            total: 1,
                        });
                    }

                    const objetoDoOperador = dadosParaRelatorio[temOperador];
                    const temConvenio = objetoDoOperador.convenios.findIndex(
                        c => c.codigo === ex.convcod
                    );

                    if (temConvenio < 0) {
                        objetoDoOperador.total += 1;
                        return objetoDoOperador.convenios.push({
                            fantasia: ex.fantasia?.trim(),
                            codigo: ex.convcod,
                            plano: ex.planodesc?.trim(),
                            exames: [ex],
                        });
                    }

                    const objetoDoConvenio =
                        objetoDoOperador.convenios[temConvenio];
                    const temPostoAmostra = objetoDoConvenio.exames.findIndex(
                        e =>
                            e.posto === ex.posto &&
                            e.amostra === ex.amostra &&
                            e.requisicao === ex.requisicao
                    );

                    if (temPostoAmostra < 0) {
                        objetoDoOperador.total += 1;
                    }
                    objetoDoConvenio.exames.push(ex);
                });
            } else {
                exames.forEach(ex => {
                    const temOperador = dadosParaRelatorio.findIndex(
                        op => op.id === ex.operador_id
                    );
                    ex.dtconfop = format(parseISO(ex.dtconfop), 'dd/MM/yyyy');
                    if (temOperador < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.operador_id,
                            nome: ex.nome?.trim(),
                            exames: [ex],
                            total: 1,
                        });
                    }

                    const objetoDoOperador = dadosParaRelatorio[temOperador];
                    const temPostoAmostra = objetoDoOperador.exames.findIndex(
                        e => e.posto === ex.posto && e.amostra === ex.amostra
                    );

                    if (temPostoAmostra >= 0) return;

                    objetoDoOperador.total += 1;
                    objetoDoOperador.exames.push(ex);
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/conferencia/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    parte,
                    ehAUltimaParte,
                    total,
                },
                color: `#${color}`,
                logo,
                startDate: dataini,
                endDate: datafim,
                profile,
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const {
                Operador,
                Operador2,
                Operador3,
                Operadorf,
            } = Database.getModels(req.database);

            await Operador.destroy({
                where: {
                    id: req.params.id,
                },
                include: [
                    { model: Operador2, as: 'operador2' },
                    { model: Operador3, as: 'operador3' },
                    { model: Operadorf, as: 'operadorf' },
                ],
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
                    const getError = err.message.includes(
                        'violates foreign key constraint'
                    );
                    if (getError) {
                        return res.status(400).json({
                            error:
                                'Não foi possível excluir, existem cadastros relacionados a este operador.',
                        });
                    }
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return null;
    }

    async estatisticaTempoAtendimento(req, res) {
        const {
            postos,
            operadores,
            dataini,
            datafim,
            horaInicial,
            horaFinal,
            modelo
        } = req.body;
        try {
            const { Movexa } = Database.getModels(req.database);

            let select = `
                SELECT
                    ${modelo === 'data' ? 'MOVPAC.DATAENTRA,': ''}
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA,
                    MOVPAC.HORAINI,
                    MOVPAC.HORAFIM,
                    MOVPAC.HORAENTRA,
                    MOVPAC.DATAENTRA,
                    MOVPAC.NET AS SENHA_PORTAL,
                    TRIM(PRONTUARIO.NOME) AS NOME,
                    CONVENIO.CODIGO,
                    TRIM(CONVENIO.FANTASIA) AS FANTASIA,
                    OPERADOR.ID AS OPERADOR_ID,
                    TRIM(OPERADOR.NOME) AS NOMOPE
                FROM MOVPAC
                    LEFT JOIN OPERADOR ON OPERADOR.ID = MOVPAC.OPERADOR_ID
                    LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                    LEFT JOIN CONVENIO ON CONVENIO.ID = PRONTUARIO.CONVENIO_ID	`;

            let where = `
                WHERE
                    MOVPAC.OPERADOR_ID IN (:operadores) AND
                    MOVPAC.POSTO IN (:postos) AND
                    MOVPAC.DATAENTRA BETWEEN :dataInicial AND :dataFinal `;

            const dataInicialFormatada = format(parseISO(dataini), 'yyyy-MM-dd');
            const dataFinalFormatada = format(parseISO(datafim), 'yyyy-MM-dd');

            if (horaInicial && horaFinal) {
                where += `
                    AND CAST(REPLACE(MOVPAC.HORAENTRA, ':', '') as integer)
                    BETWEEN :horaInicial AND
                    :horaFinal `;
            }

            const orderBy = `
                ORDER BY
                    ${modelo === 'data' ? 'MOVPAC.DATAENTRA,': ''}
                    OPERADOR.NOME,
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA`;

            select += where;
            select += orderBy;

            const replacements = {
                postos,
                operadores,
                dataInicial: dataInicialFormatada,
                dataFinal: dataFinalFormatada,
                horaInicial: horaInicial.replace(":", ""),
                horaFinal: horaFinal.replace(":", "")
            }
            const data = await Movexa.sequelize.query(select, {
                replacements,
                type: QueryTypes.SELECT,
            });

            if (data.length > 100000) {
                throw new Error("Quantidade acima do limite")
            }

            return res.status(200).json({
                data,
                total: data.length
            });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioTempoAtendimento(req, res) {
        const {
            dados,
            dataini,
            datafim,
            logo,
            profile,
            color,
        } = req.body;
        try {

            const { exames, ehAUltimaParte, parte, modelo, resto } = dados;
            const { total } = resto;

            const dadosParaRelatorio = [];
            if (modelo === 'data') {
                exames.forEach(ex => {
                    const segundos = parseFloat(ex.horafim) - parseFloat(ex.horaini);
                    const { hours: horas , minutes: minutos } = intervalToDuration({
                        start: 0,
                        end: segundos * 1000
                    })
                    const dataFormatada = format(parseISO(ex.dataentra), 'dd/MM/yyyy');
                    const temAMesmaData = dadosParaRelatorio.findIndex(d => d.data === dataFormatada);
                    if (temAMesmaData < 0) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            operadores: [
                                {
                                    id: ex.operador_id,
                                    nome: ex.nomope,
                                    atendimentos: [
                                        {
                                            posto_codigo: ex.posto,
                                            amostra: ex.amostra,
                                            paciente: ex.nome,
                                            convenio: ex.fantasia,
                                            duracao: {
                                                horas,
                                                minutos
                                            },
                                        }
                                    ],
                                    totais: {
                                        atendimento: segundos,
                                        pacientes: 1,
                                    }
                                }
                            ],
                            totalDePacientes: 1,
                            totalDeDuracao: segundos,
                        });
                    }

                    const objetoDestaData = dadosParaRelatorio[temAMesmaData];
                    objetoDestaData.totalDePacientes += 1;
                    objetoDestaData.totalDeDuracao += segundos;

                    const temOmesmoOperador = objetoDestaData.operadores.findIndex(o => o.id === ex.operador_id);
                    if (temOmesmoOperador < 0) {
                        return objetoDestaData.operadores.push({
                            id: ex.operador_id,
                            nome: ex.nomope,
                            atendimentos: [
                                {
                                    posto_codigo: ex.posto,
                                    amostra: ex.amostra,
                                    paciente: ex.nome,
                                    convenio: ex.fantasia,
                                    duracao: {
                                        horas,
                                        minutos
                                    },
                                }
                            ],
                            totais: {
                                atendimento: segundos,
                                pacientes: 1,
                            }
                        });
                    }

                    const objetoDesteOperador = objetoDestaData.operadores[temOmesmoOperador];
                    objetoDesteOperador.totais.atendimento += segundos;
                    objetoDesteOperador.totais.pacientes += 1;

                    objetoDesteOperador.atendimentos.push({
                        posto_codigo: ex.posto,
                        amostra: ex.amostra,
                        paciente: ex.nome,
                        convenio: ex.fantasia,
                        duracao: {
                            horas,
                            minutos,
                        },
                    });
                });

                dadosParaRelatorio.forEach(d => {
                    const { hours, minutes } = intervalToDuration({
                        start: 0,
                        end: d.totalDeDuracao * 1000
                    });

                    d.totalDeDuracao = {
                        hours,
                        minutes
                    }

                    d.operadores.forEach(op => {
                        const { hours: horas, minutes: minutos } = intervalToDuration({
                            start: 0,
                            end: op.totais.atendimento * 1000
                        });

                        op.totais.atendimentos = {
                            horas,
                            minutos
                        }
                    })
                })

            }else {
                exames.forEach(ex => {
                    const temOMesmoOperador = dadosParaRelatorio.findIndex(d => d.id === ex.operador_id);
                    const segundos = parseFloat(ex.horafim) - parseFloat(ex.horaini);
                    const { hours: horas , minutes: minutos } = intervalToDuration({
                        start: 0,
                        end: segundos * 1000
                    })
                    if (temOMesmoOperador < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.operador_id,
                            nome: ex.nomope,
                            atendimentos: [
                                {
                                    posto: ex.posto,
                                    amostra: ex.amostra,
                                    senha: ex.senha_portal,
                                    convenio: ex.fantasia,
                                    paciente: ex.nome,
                                    duracao: {
                                        horas,
                                        minutos
                                    }
                                }
                            ],
                            totalDeDuracao: segundos,
                            totalDePacientes: 1,
                        })
                    }

                    const objetoDesteOperador = dadosParaRelatorio[temOMesmoOperador];
                    objetoDesteOperador.totalDePacientes += 1;
                    objetoDesteOperador.totalDeDuracao += segundos;

                    objetoDesteOperador.atendimentos.push({
                        posto: ex.posto,
                        amostra: ex.amostra,
                        senha: ex.senha_portal,
                        convenio: ex.fantasia,
                        paciente: ex.nome,
                        duracao: {
                            horas,
                            minutos
                        }
                    });
                });

                dadosParaRelatorio.forEach(d => {
                    const { hours, minutes } = intervalToDuration({
                        start: 0,
                        end: d.totalDeDuracao * 1000
                    });

                    d.totalDeDuracao = {
                        hours,
                        minutes
                    }
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/operadores/tempoAtendimento/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    parte,
                    ehAUltimaParte,
                    total,
                },
                startDate: dataini,
                endDate: datafim,
                profile,
                logo,
                color: `#${color}`
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async estatisticaConvenioAtendimento(req, res) {
        const {
            operadores,
            convenios,
            dataini,
            datafim,
            horaInicial,
            horaFinal,
            modelo
        } = req.body;
        try {
            const { Movexa } = Database.getModels(req.database);

            let select = 'SELECT ';
            let orderBy = 'ORDER BY ';
            let where = 'WHERE ';

            select += `
                    ${modelo === 'data' ? 'MOVPAC.DATAENTRA, ': ''}
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA,
                    MOVPAC.HORAINI,
                    MOVPAC.HORAFIM,
                    MOVPAC.HORAENTRA,
                    TRIM(PRONTUARIO.NOME) AS NOME,
                    CONVENIO.CODIGO,
                    CONVENIO.ID,
                    TRIM(CONVENIO.FANTASIA) AS FANTASIA,
                    TRIM(OPERADOR.NOME) AS NOMOPE,
                    OPERADOR.ID AS OPERADOR_ID
                FROM MOVPAC
                    LEFT JOIN OPERADOR ON OPERADOR.ID = MOVPAC.OPERADOR_ID
                    LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                    LEFT JOIN CONVENIO ON CONVENIO.ID = PRONTUARIO.CONVENIO_ID	`

            where += `
                MOVPAC.OPERADOR_ID IN (:operadores) AND
                CONVENIO.ID IN (:convenios) AND
                MOVPAC.DATAENTRA BETWEEN :dataInicial AND :dataFinal `;

            const dataInicialFormatada = format(parseISO(dataini), 'yyyy-MM-dd');
            const dataFinalFormatada = format(parseISO(datafim), 'yyyy-MM-dd');

            if (horaInicial && horaFinal) {
                where += `
                    AND CAST(REPLACE(MOVPAC.HORAENTRA, ':', '') as integer)
                    BETWEEN :horaInicial AND
                    :horaFinal `;
            }

            orderBy += `
                CONVENIO.ID,
                ${modelo === 'data' ? 'MOVPAC.DATAENTRA,': ''}
                OPERADOR.NOME,
                MOVPAC.POSTO,
                MOVPAC.AMOSTRA`;

            select += where;
            select += orderBy;

            const replacements = {
                convenios,
                operadores,
                dataInicial: dataInicialFormatada,
                dataFinal: dataFinalFormatada,
                horaInicial: horaInicial.replace(":", ""),
                horaFinal: horaFinal.replace(":", "")
            }
            const data = await Movexa.sequelize.query(select, {
                replacements,
                type: QueryTypes.SELECT,
            });

            if (data.length > 100000) {
                throw new Error("Quantidade acima do limite")
            }

        return res.status(200).json({
            data,
            total: data.length
        });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioConvenioAtendimento(req, res) {
        const {
            dados,
            dataini,
            datafim,
            profile,
            color,
            logo
        } = req.body;
        const { exames: atendimentos, parte, ehAUltimaParte, resto, modelo } = dados;
        const { total } = resto;
        try {
            const dadosParaRelatorio = [];
            if (modelo === 'data') {
                atendimentos.forEach(at => {
                    const segundos = parseFloat(at.horafim) - parseFloat(at.horaini);
                    const dataFormatada = format(parseISO(at.dataentra), 'dd/MM/yyyy');
                    const temOMesmoConvenio = dadosParaRelatorio.findIndex(d => d.id === at.id);
                    const { hours: horas, minutes: minutos } = intervalToDuration({
                        start: 0,
                        end: segundos * 1000
                    });
                    if (temOMesmoConvenio < 0) {
                        return dadosParaRelatorio.push({
                            id: at.id,
                            descricao: at.fantasia,
                            datas: [
                                {
                                    data: dataFormatada,
                                    operadores: [
                                        {
                                            id: at.operador_id,
                                            nome: at.nomope,
                                            atendimentos: [
                                                {
                                                    posto: at.posto,
                                                    amostra: at.amostra,
                                                    paciente: at.nome,
                                                    convenio: at.fantasia,
                                                    duracao: {
                                                        minutos,
                                                        horas,
                                                    }
                                                }
                                            ],
                                            totais: {
                                                atendimentos: 1,
                                                duracao: segundos,
                                            }
                                        }
                                    ],
                                    atendimentos: 1,
                                    duracao: segundos

                                }
                            ],
                            atendimentos: 1
                        });
                    }

                    const objetoDesteConvenio = dadosParaRelatorio[temOMesmoConvenio];
                    objetoDesteConvenio.atendimentos += 1;

                    const temAMesmaData = objetoDesteConvenio.datas.findIndex(d => d.data === dataFormatada);
                    if (temAMesmaData < 0) {
                        return objetoDesteConvenio.datas.push({
                            data: dataFormatada,
                            operadores: [
                                {
                                    id: at.operador_id,
                                    nome: at.nomope,
                                    atendimentos: [
                                        {
                                            posto: at.posto,
                                            amostra: at.amostra,
                                            paciente: at.nome,
                                            convenio: at.fantasia,
                                            duracao: {
                                                minutos,
                                                horas,
                                            }
                                        }
                                    ],
                                    totais: {
                                        atendimentos: 1,
                                        duracao: segundos,
                                    }
                                }
                            ],
                            atendimentos: 1,
                            duracao: segundos
                        });
                    }

                    const objetoDestaData = objetoDesteConvenio.datas[temAMesmaData];
                    objetoDestaData.atendimentos += 1;
                    objetoDestaData.duracao += segundos;

                    const temOMesmoOperador = objetoDestaData.operadores.findIndex(op => op.id === at.operador_id);
                    if (temOMesmoOperador < 0) {
                        return objetoDestaData.operadores.push({
                                id: at.operador_id,
                                nome: at.nomope,
                                atendimentos: [
                                    {
                                        posto: at.posto,
                                        amostra: at.amostra,
                                        paciente: at.nome,
                                        convenio: at.fantasia,
                                        duracao: {
                                            minutos,
                                            horas,
                                        }
                                    }
                                ],
                                totais: {
                                    atendimentos: objetoDestaData.atendimentos,
                                    duracao: objetoDestaData.duracao,
                                }
                        });
                    }

                    const objetoDesteOperador = objetoDestaData.operadores[temOMesmoOperador];
                    objetoDesteOperador.totais.atendimentos += 1;
                    objetoDesteOperador.totais.duracao += segundos;

                    objetoDesteOperador.atendimentos.push({
                        posto: at.posto,
                        amostra: at.amostra,
                        paciente: at.nome,
                        convenio: at.fantasia,
                        duracao: {
                            minutos,
                            horas,
                        }
                    })
                });

                dadosParaRelatorio.forEach(c => {
                    c.datas.forEach(d => {
                        d.operadores.forEach(op => {
                            const { hours: horas, minutes: minutos } = intervalToDuration({
                                start: 0,
                                end: op.totais.duracao * 1000,
                            });
                            op.totais.duracao = {
                                horas,
                                minutos
                            }
                        })
                    })
                })
            }else {
                atendimentos.forEach(ex => {
                    const segundos = parseFloat(ex.horafim) - parseFloat(ex.horaini);
                    const { hours: horas, minutes: minutos } = intervalToDuration({
                        start:0,
                        end: segundos * 1000
                    });

                    const temOMesmoConvenio = dadosParaRelatorio.findIndex(d => d.id === ex.id);
                    if (temOMesmoConvenio < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.id,
                            descricao: ex.fantasia,
                            operadores: [
                                {
                                    id: ex.operador_id,
                                    nome: ex.nomope,
                                    atendimentos: [
                                        {
                                            posto: ex.posto,
                                            amostra: ex.amostra,
                                            paciente: ex.nome,
                                            duracao: {
                                                horas,
                                                minutos
                                            }
                                        }
                                    ],
                                    totais: {
                                        atendimentos: 1,
                                        duracao: segundos
                                    }
                                }
                            ],
                            atendimentos: 1
                        });
                    }

                    const objetoDesteConvenio = dadosParaRelatorio[temOMesmoConvenio];
                    objetoDesteConvenio.atendimentos += 1;

                    const temOMesmoOperador = objetoDesteConvenio.operadores.findIndex(o => o.id === ex.operador_id);
                    if (temOMesmoOperador < 0) {
                        return objetoDesteConvenio.operadores.push({
                            id: ex.operador_id,
                            nome: ex.nomope,
                            atendimentos: [
                                {
                                    posto: ex.posto,
                                    amostra: ex.amostra,
                                    paciente: ex.nome,
                                    duracao: {
                                        horas,
                                        minutos
                                    }
                                }
                            ],
                            totais: {
                                atendimentos: 1,
                                duracao: segundos
                            }
                        });
                    }

                    const objetoDesteOperador = objetoDesteConvenio.operadores[temOMesmoOperador];
                    objetoDesteOperador.totais.atendimentos += 1;
                    objetoDesteOperador.totais.duracao += segundos;
                    objetoDesteOperador.atendimentos.push({
                        posto: ex.posto,
                        amostra: ex.amostra,
                        paciente: ex.nome,
                        duracao: {
                            horas,
                            minutos
                        }
                    });
                });

                dadosParaRelatorio.forEach(d => {
                    d.operadores.forEach(op => {
                        const { hours: horas , minutes: minutos } = intervalToDuration({
                            start: 0,
                            end: op.totais.duracao * 1000
                        })

                        op.totais.duracao = {
                            horas,
                            minutos
                        }
                    })
                })
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/operadores/tempoAtendimentoConvenio/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    parte,
                    ehAUltimaParte,
                    total
                },
                startDate: dataini,
                endDate: datafim,
                profile,
                logo,
                color: `#${color}`,
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async estatisticaOperadorConvenio(req, res) {
        const {
            operadores,
            convenios,
            dataini,
            datafim,
            modelo,
            horaInicial,
            horaFinal
        } = req.body;
        try {
            const { Movexa } = Database.getModels(req.database);
            const temData = modelo === 'data' ? 'MOVPAC.DATAENTRA,': '';
            let select = `
                SELECT
                    ${temData}
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA,
                    MOVPAC.HORAINI,
                    MOVPAC.HORAFIM,
                    MOVPAC.HORAENTRA,
                    TRIM(PRONTUARIO.NOME) AS NOME,
                    CONVENIO.ID,
                    CONVENIO.FANTASIA,
                    TRIM(OPERADOR.NOME) AS NOMOPE,
                    OPERADOR.ID AS OPERADOR_ID
                FROM MOVPAC
                    LEFT JOIN OPERADOR ON OPERADOR.ID = MOVPAC.OPERADOR_ID
                    LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                    LEFT JOIN MOVEXA ON MOVEXA.MOVPAC_ID = MOVPAC.ID
                    LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID `;

            let where = `
                WHERE
                    MOVPAC.OPERADOR_ID IN (:operadores) AND
                    CONVENIO.ID IN (:convenios) AND
                    MOVPAC.DATAENTRA BETWEEN :dataInicial AND :dataFinal `;

            if (horaInicial && horaFinal) {
                where += `
                    AND REPLACE(MOVPAC.HORAENTRA, ':', '')
                    BETWEEN :horaInicial AND
                    :horaFinal `;
            }

            const groupBy = `
                GROUP BY
                    ${temData}
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA,
                    MOVPAC.HORAINI,
                    MOVPAC.HORAFIM,
                    MOVPAC.HORAENTRA,
                    PRONTUARIO.NOME,
                    CONVENIO.CODIGO,
                    CONVENIO.FANTASIA,
                    OPERADOR.NOME,
                    CONVENIO.ID,
                    OPERADOR.ID `;

            const orderBy = `
                ORDER BY
                    CONVENIO.ID,
                    ${temData}
                    OPERADOR.NOME,
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA
            `;

            select += where;
            select += groupBy;
            select += orderBy;

            const replacements = {
                operadores,
                convenios,
                dataInicial: format(parseISO(dataini), 'yyyy-MM-dd'),
                dataFinal: format(parseISO(datafim), 'yyyy-MM-dd'),
                horaInicial: horaInicial ? horaInicial.replace(":", ""): "",
                horaFinal: horaFinal ? horaFinal.replace(":", ""): "",
            };

            const data = await Movexa.sequelize.query(select, {
                replacements,
                type: QueryTypes.SELECT
            });

            if (data.length > 100000) {
                throw new Error("Quantidade de registros acima do limite")
            }

            return res.json({
                total: data.length,
                data,
            })
        }catch(error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioOperadorConvenio(req, res) {
        const {
            dados,
            dataini,
            datafim,
            logo,
            profile,
            color
        } = req.body;
        const { exames: atendimentos, modelo, parte, ehAUltimaParte, resto } = dados;
        const { total } = resto;
        try {
            const dadosParaRelatorio = [];
            if (modelo === 'data') {
                atendimentos.forEach(at => {
                    const dataFormatada = format(parseISO(at.dataentra), 'dd/MM/yyyy');
                    const temOMesmoConvenio = dadosParaRelatorio.findIndex(d => d.id === at.id);
                    if (temOMesmoConvenio < 0) {
                        return dadosParaRelatorio.push({
                            id: at.id,
                            descricao: at.fantasia,
                            datas: [
                                {
                                    data: dataFormatada,
                                    operadores: [
                                        {
                                            id: at.operador_id,
                                            nome: at.nomope,
                                            atendimentos: [
                                                {
                                                    posto: at.posto,
                                                    amostra: at.amostra,
                                                    paciente: at.nome,
                                                    convenio: at.fantasia,
                                                }
                                            ],
                                        }
                                    ],
                                    atendimentos: 1,

                                }
                            ],
                            atendimentos: 1
                        });
                    }

                    const objetoDesteConvenio = dadosParaRelatorio[temOMesmoConvenio];
                    objetoDesteConvenio.atendimentos += 1;

                    const temAMesmaData = objetoDesteConvenio.datas.findIndex(d => d.data === dataFormatada);
                    if (temAMesmaData < 0) {
                        return objetoDesteConvenio.datas.push({
                            data: dataFormatada,
                            operadores: [
                                {
                                    id: at.operador_id,
                                    nome: at.nomope,
                                    atendimentos: [
                                        {
                                            posto: at.posto,
                                            amostra: at.amostra,
                                            paciente: at.nome,
                                            convenio: at.fantasia,
                                        }
                                    ],
                                }
                            ],
                            atendimentos: 1,
                        });
                    }

                    const objetoDestaData = objetoDesteConvenio.datas[temAMesmaData];
                    objetoDestaData.atendimentos += 1;

                    const temOMesmoOperador = objetoDestaData.operadores.findIndex(op => op.id === at.operador_id);
                    if (temOMesmoOperador < 0) {
                        return objetoDestaData.operadores.push({
                                id: at.operador_id,
                                nome: at.nomope,
                                atendimentos: [
                                    {
                                        posto: at.posto,
                                        amostra: at.amostra,
                                        paciente: at.nome,
                                        convenio: at.fantasia,
                                    }
                                ],
                        });
                    }

                    const objetoDesteOperador = objetoDestaData.operadores[temOMesmoOperador];

                    objetoDesteOperador.atendimentos.push({
                        posto: at.posto,
                        amostra: at.amostra,
                        paciente: at.nome,
                        convenio: at.fantasia,
                    })
                });
            }else {
                atendimentos.forEach(ex => {
                    const temOMesmoConvenio = dadosParaRelatorio.findIndex(d => d.id === ex.id);
                    if (temOMesmoConvenio < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.id,
                            descricao: ex.fantasia,
                            operadores: [
                                {
                                    id: ex.operador_id,
                                    nome: ex.nomope,
                                    atendimentos: [
                                        {
                                            posto: ex.posto,
                                            amostra: ex.amostra,
                                            paciente: ex.nome,
                                        }
                                    ],
                                }
                            ],
                        });
                    }

                    const objetoDesteConvenio = dadosParaRelatorio[temOMesmoConvenio];
                    const temOMesmoOperador = objetoDesteConvenio.operadores.findIndex(o => o.id === ex.operador_id);
                    if (temOMesmoOperador < 0) {
                        return objetoDesteConvenio.operadores.push({
                            id: ex.operador_id,
                            nome: ex.nomope,
                            atendimentos: [
                                {
                                    posto: ex.posto,
                                    amostra: ex.amostra,
                                    paciente: ex.nome,
                                }
                            ],
                        });
                    }

                    const objetoDesteOperador = objetoDesteConvenio.operadores[temOMesmoOperador];
                    objetoDesteOperador.atendimentos.push({
                        posto: ex.posto,
                        amostra: ex.amostra,
                        paciente: ex.nome,
                    });
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/operadores/convenio/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    parte,
                    ehAUltimaParte,
                    total,
                },
                color: `#${color}`,
                profile,
                logo,
                startDate: dataini,
                endDate: datafim,
            })

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async estatisticaProdutividade(req, res) {
        const {
            postos,
            operadores,
            dataini,
            datafim,
            horaInicial,
            horaFinal,
        } = req.body;
        try {
            const { Movexa } = Database.getModels(req.database);
            let select = `
                SELECT
                    TRIM(OPERADOR.NOME) AS NOME,
                    CAST(COUNT(MOVEXA.OPERADOR_ID_LANRES) AS INTEGER) AS QTDEXA,
                    CAST(COUNT (DISTINCT MOVPAC.PRONTUARIO_ID) AS INTEGER) AS QTDPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN OPERADOR ON OPERADOR.ID = MOVEXA.OPERADOR_ID_LANRES `;

            let where = `
             WHERE
                MOVPAC.DATAENTRA BETWEEN :dataInicial AND :dataFinal AND
                MOVEXA.OPERADOR_ID_LANRES <> 0 AND
                MOVPAC.OPERADOR_ID IN (:operadores) AND
                MOVPAC.POSTO IN (:postos) `;

            if (horaInicial && horaFinal) {
                where += `
                    AND REPLACE(MOVPAC.HORAENTRA, ':', '')
                    BETWEEN :horaInicial AND :horaFinal `;
            }

            select += where;
            select += `GROUP BY OPERADOR.NOME ORDER BY OPERADOR.NOME `;

            const replacements = {
                operadores,
                postos,
                dataInicial: format(parseISO(dataini), 'yyyy-MM-dd'),
                dataFinal: format(parseISO(datafim), 'yyyy-MM-dd'),
                horaInicial: horaInicial ? horaInicial.replace(":", "") : "",
                horaFinal: horaFinal ? horaFinal.replace(":", ""): "",
            }

            const data = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
                replacements
            })

            return res.json(data);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async gerarRelatorioProdutividade(req, res) {
        const {
            dados,
            dataini,
            datafim,
            logo,
            profile,
            color
        } = req.body;

        const totais = {
            exames: dados.exames.reduce((acc, curr) => {
                return acc + curr.qtdexa
            }, 0),
            pacientes: dados.exames.reduce((acc, curr) => {
                return acc + curr.qtdpac
            }, 0),
        }

        try {
            const html = await gerarRelatorioHtml({
                model: `/estatisticas/operadores/produtividade/index`,
                data: {
                    registros: dados.exames,
                    totais,
                },
                startDate: dataini,
                endDate: datafim,
                profile,
                logo,
                color: `#${color}`
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Operador"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%' AND "Operador"."nivel" = 0`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Operador"."descricao" AS TEXT) ILIKE '%${filterValue}%' AND "Operador"."nivel" = 0`;
                }
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}' AND "Operador"."nivel" = 0`;
                }
                break;
            case 'todos':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}' AND "Operador"."nivel" = 0`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Operador"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%') AND "Operador"."nivel" = 0)`)
                    : null;
        }

        return filter;
    }
}

export default new OperadorController();
