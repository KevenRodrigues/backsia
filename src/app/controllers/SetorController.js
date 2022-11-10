import * as Yup from 'yup';
import Database from '../../database';
import { format, parseISO } from 'date-fns';
import { QueryTypes } from 'sequelize';
import { gerarRelatorioHtml } from './functions/functions';

class SetorController {
    async index(req, res) {
        try {
            const { Setor, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Setor"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Setor"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += SetorController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = SetorController.handleFilters(filter, filtervalue);
                }
            }

            const setores = await Setor.findAll({
                order: Setor.sequelize.literal(`${order} ${orderdesc}`),
                where: Setor.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'responsavel',
                    'impmap',
                    'idopera_ultacao',
                    [Setor.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const setores_trim = setores.map(setor => {
                    setor.descricao = setor.descricao
                        ? setor.descricao.trim()
                        : '';
                    setor.impmap = setor.impmap ? setor.impmap.trim() : 0;
                    setor.responsavel = setor.responsavel
                        ? setor.responsavel.trim()
                        : '';
                    setor.motina.descricao = setor.motina.descricao
                        ? setor.motina.descricao.trim()
                        : '';
                    return setor;
                });
                return res.status(200).json(setores_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Setor, Motina } = Database.getModels(req.database);
            const setores = await Setor.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'responsavel',
                    'impmap',
                    'idopera_ultacao',
                ],
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

            if (!setores) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                setores.descricao = setores.descricao
                    ? setores.descricao.trim()
                    : '';
                setores.responsavel = setores.responsavel
                    ? setores.responsavel.trim()
                    : '';
                setores.impmap = setores.impmap ? setores.impmap.trim() : 0;
                setores.motina.descricao = setores.motina.descricao
                    ? setores.motina.descricao.trim()
                    : '';

                return res.status(200).json(setores);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Setor } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                responsavel: Yup.string().required(),
                impmap: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const {
                id,
                descricao,
                status,
                responsavel,
                impmap,
            } = await Setor.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                responsavel,
                impmap,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Setor } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                impmap: Yup.number(),
                responsavel: Yup.string(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const setorExists = await Setor.findByPk(req.body.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!setorExists) {
                return res
                    .status(400)
                    .json({ error: 'Setor com codigo nao encontrado' });
            }

            if (setorExists && req.body.id !== setorExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Setor com codigo ja cadastrado.' });
            }

            await Setor.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        responsavel: data[1].responsavel,
                        impmap: data[1].impmap,
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Setor } = Database.getModels(req.database);
            await Setor.destroy({
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

    async estatisticaGeral(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const {
            setores,
            convenios,
            dataini,
            datafim,
            filtroConsideraExamesInclusos,
            filtraPorDataDeFatura,
            desconsideraFaltaMaterialENovaColeta,
            modelo,
        } = req.body;

        try {
            let select = 'SELECT ';
            let groupBy = 'GROUP BY ';
            let orderBy = 'ORDER BY ';

            const tipoDeData =
                filtraPorDataDeFatura === '1' ? 'DTFATURA' : 'DTCOLETA';
            if (modelo === 'data') {
                select += `
                        MOVEXA.${tipoDeData} AS DTCOLETA,
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                    FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                        LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID `;

                groupBy += `
                    MOVEXA.${tipoDeData}, SETOR.ID, SETOR.DESCRICAO `;
                orderBy += `
                    movexa.${tipoDeData}, TOTPAC DESC `;
            } else if (modelo === 'geral') {
                select += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                    FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                        LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID `;

                groupBy += `
                    SETOR.ID, SETOR.DESCRICAO  `;
                orderBy += `
                    TOTPAC DESC `;
            } else {
                select += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        EXAME.CODIGO,
                        EXAME.DESCRICAO AS DESCEXA,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                        SUM(MOVEXA.VALCONV)	AS TOTRS
                    FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                        LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID `;

                groupBy += `
                    SETOR.ID, SETOR.DESCRICAO, EXAME.DESCRICAO, EXAME.CODIGO `;
                orderBy += `
                    SETOR.ID, SETOR.DESCRICAO, TOTPAC DESC `;
            }

            let where = 'WHERE ';

            if (filtroConsideraExamesInclusos === '0') {
                where += 'MOVEXA.EXAMEINC = 0 AND ';
            }

            if (desconsideraFaltaMaterialENovaColeta === '1') {
                where += `MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND `;
            }

            const validacaoDeSetores = 'EXAME.SETOR_ID IN (:setores) AND ';
            const validacaoDeConvenios =
                'MOVEXA.CONVENIO_ID IN (:convenios) AND ';
            if (filtraPorDataDeFatura === '1')
                where += 'COALESCE(MOVEXA.NAOFATURA,0) = 0 AND ';
            const validacaoDePeriodo = `MOVEXA.${tipoDeData} BETWEEN :dataInicial AND :dataFinal `;

            where += validacaoDeSetores;
            where += validacaoDeConvenios;
            where += validacaoDePeriodo;

            select += where;
            select += groupBy;
            select += orderBy;

            const dataInicialFormatada = format(
                parseISO(dataini),
                'yyyy-MM-dd'
            );
            const dataFinalFormatada = format(parseISO(datafim), 'yyyy-MM-dd');

            const replacements = {
                convenios,
                setores,
                dataInicial: dataInicialFormatada,
                dataFinal: dataFinalFormatada,
            };

            const data = await Movexa.sequelize.query(select, {
                replacements,
                type: QueryTypes.SELECT,
            });

            if (data.length > 100000) {
                throw new Error('Quantidade acima do limite');
            }

            const somaQuery = `
                SELECT
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                    SUM(MOVEXA.VALCONV)	AS TOTRS
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID ${where}`;

            const [soma] = await Movexa.sequelize.query(somaQuery, {
                replacements,
                type: QueryTypes.SELECT,
            });

            const dadosComSoma = {
                data,
                soma,
            };

            return res.json(dadosComSoma);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioGeral(req, res) {
        const { dados, dataini, datafim, profile, logo, color } = req.body;

        const { exames, parte, ehAUltimaParte, modelo, resto } = dados;
        const { total } = resto;

        const dadosParaRelatorio = [];
        try {
            if (modelo === 'data') {
                exames.forEach(ex => {
                    const dataFormatada = format(parseISO(ex.dtcoleta), 'dd/MM/yyyy');
                    const temAMesmaData = dadosParaRelatorio.findIndex(d => d.data === dataFormatada);
                    if (temAMesmaData < 0) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            setores: [
                                {
                                    id: ex.id,
                                    descricao: ex.descricao?.trim(),
                                    total: parseInt(ex.totexa)
                                }
                            ],
                            total: parseInt(ex.totexa)
                        });
                    }

                    const objetoDestaData = dadosParaRelatorio[temAMesmaData];
                    objetoDestaData.total += parseInt(ex.totexa);
                    const temOMesmoSetor = objetoDestaData.setores.findIndex(s => s.id === ex.id);
                    if (temOMesmoSetor < 0) {
                        return objetoDestaData.setores.push({
                            id: ex.id,
                            descricao: ex.descricao?.trim(),
                            total: parseInt(ex.totexa)
                        });
                    }

                    const objetoDesteSetor = objetoDestaData.setores[temOMesmoSetor];
                    objetoDesteSetor.total += parseInt(ex.totexa);
                });
            } else if (modelo === 'exames') {
                exames.forEach(ex => {
                    const temOMesmoSetor = dadosParaRelatorio.findIndex(d => d.id === ex.id);
                    ex.descricao = ex.descricao?.trim();
                    ex.descexa = ex.descexa?.trim();
                    ex.codigo = ex.codigo?.trim();
                    if (temOMesmoSetor < 0) {

                        return dadosParaRelatorio.push({
                            id: ex.id,
                            descricao: ex.descricao,
                            exames: [ex]
                        });
                    }

                    const objetoDesteSetor = dadosParaRelatorio[temOMesmoSetor];
                    objetoDesteSetor.exames.push(ex);
                });
            } else {
                exames.forEach(ex => {
                    ex.descricao = ex.descricao?.trim();
                    dadosParaRelatorio.push(ex);
                })
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/setor/geral/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    total,
                    parte,
                    ehAUltimaParte,
                    tipoData: resto.tipoData === '1' ? 'Fatura' : 'Coleta'
                },
                profile,
                logo,
                startDate: dataini,
                endDate: datafim,
                color: `#${color}`,
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async estatisticaPosto(req, res) {
        const {
            postos,
            setores,
            dataini,
            datafim,
            filtroConsideraExamesInclusos,
            filtraPorDataDeFatura,
            desconsideraFaltaMaterialENovaColeta,
            modelo,
        } = req.body;
        try {
            const { Movexa } = Database.getModels(req.database);
            let select = 'SELECT ';
            let groupBy = 'GROUP BY ';
            let orderBy = 'ORDER BY ';
            let where = 'WHERE  ';

            const tipoDeData = filtraPorDataDeFatura === '1' ? 'DTFATURA': 'DTCOLETA';

            if (modelo === 'data') {
                select += `
                    MOVEXA.${tipoDeData} AS DTCOLETA,
                    SETOR.ID,
                    TRIM(SETOR.DESCRICAO) AS DESCRICAO,
                    MOVEXA.POSTO,
                    TRIM(POSTO.DESCRICAO) as DESCRICAO_POSTO,
                    (SUM(COALESCE(MOVEXA.VALCONV,0))+SUM(COALESCE(MOVEXA.VALPAC,0))) AS TOTVALOR,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID
                    LEFT JOIN POSTO ON POSTO.CODIGO = MOVEXA.POSTO `;

                groupBy += `
                    MOVEXA.${tipoDeData},
                    MOVEXA.POSTO,
                    POSTO.DESCRICAO,
                    SETOR.ID,
                    SETOR.DESCRICAO `;

                orderBy += `
                    movexa.${tipoDeData},
                    MOVEXA.POSTO,
                    SETOR.ID,
                    TOTPAC DESC `;

            }else {
                select += `
                    SETOR.ID,
                    TRIM(SETOR.DESCRICAO) AS DESCRICAO,
                    MOVEXA.POSTO,
                    TRIM(POSTO.DESCRICAO) AS DESCRICAO_POSTO,
                    (SUM(COALESCE(MOVEXA.VALCONV,0))+SUM(COALESCE(MOVEXA.VALPAC,0))) AS TOTVALOR,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID
                    LEFT JOIN POSTO ON POSTO.CODIGO = MOVEXA.POSTO `;

                groupBy += `
                    MOVEXA.POSTO,
                    POSTO.DESCRICAO,
                    SETOR.ID,
                    SETOR.DESCRICAO `;

                orderBy += `
                    MOVEXA.POSTO,
                    POSTO.DESCRICAO,
                    SETOR.ID,
                    SETOR.DESCRICAO,
                    TOTPAC DESC `;
            }

            if (filtroConsideraExamesInclusos === '0') {
                where += 'MOVEXA.EXAMEINC = 0 AND ';
            }

            if (desconsideraFaltaMaterialENovaColeta === '1') {
                where += `MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND `;
            }

            const validacaoDeSetores = 'EXAME.SETOR_ID IN (:setores) AND ';
            const validacaoDeConvenios = 'MOVEXA.POSTO IN (:postos) AND ';

            if (filtraPorDataDeFatura === '1')
                where += 'COALESCE(MOVEXA.NAOFATURA,0) = 0 AND ';

            const validacaoDePeriodo = `MOVEXA.${tipoDeData} BETWEEN :dataInicial AND :dataFinal `;

            where += validacaoDeSetores;
            where += validacaoDeConvenios;
            where += validacaoDePeriodo;

            select += where;
            select += groupBy;
            select += orderBy;

            const dataInicialFormatada = format(
                parseISO(dataini),
                'yyyy-MM-dd'
            );
            const dataFinalFormatada = format(parseISO(datafim), 'yyyy-MM-dd');

            const replacements = {
                setores,
                postos,
                dataInicial: dataInicialFormatada,
                dataFinal: dataFinalFormatada,
            };

            const data = await Movexa.sequelize.query(select, {
                replacements,
                type: QueryTypes.SELECT,
            })

            const somaQuery = `
                SELECT
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                    (SUM(COALESCE(MOVEXA.VALCONV,0))+SUM(COALESCE(MOVEXA.VALPAC,0))) AS TOTVALOR
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME  ON EXAME.ID = MOVEXA.EXAME_ID
                ${where}`;

            const [soma] = await Movexa.sequelize.query(somaQuery, {
                type: QueryTypes.SELECT,
                replacements
            })

            const dadosComSoma = {
                data,
                soma,
            }

            return res.status(200).json(dadosComSoma);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorioPosto(req, res) {
        const {
            dados,
            dataini,
            datafim,
            profile,
            logo,
            color
        } = req.body;
        try {
            const {
                exames,
                modelo,
                parte,
                ehAUltimaParte,
                resto
            } = dados;
            const { total } = resto;

            const dadosParaRelatorio = [];
            if (modelo === 'data') {
                exames.forEach(ex => {
                    const dataFormatada = format(parseISO(ex.dtcoleta), 'dd/MM/yyyy');
                    const temAMesmaData = dadosParaRelatorio.findIndex(d => d.data ===  dataFormatada);
                    if (temAMesmaData < 0) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            setores: [
                                {
                                    id: ex.id,
                                    descricao: ex.descricao,
                                    postos: [
                                        {
                                            codigo: ex.posto,
                                            descricao: ex.descricao_posto,
                                            totalDePacientes: parseInt(ex.totpac),
                                            totalDeExames: parseInt(ex.totexa),
                                            totalDeValor: parseFloat( ex.totvalor),
                                        }
                                    ]
                                }
                            ],
                            totais: {
                                valores: parseFloat(ex.totvalor),
                                exames: parseInt(ex.totexa),
                            }
                        });
                    }

                    const objetoDestaData = dadosParaRelatorio[temAMesmaData];
                    objetoDestaData.totais.valores += parseFloat(ex.totvalor);
                    objetoDestaData.totais.exames += parseInt(ex.totexa);

                    const temOMesmoSetor = objetoDestaData.setores.findIndex(s => s.id === ex.id);
                    if (temOMesmoSetor < 0) {
                        return objetoDestaData.setores.push({
                            id: ex.id,
                            descricao: ex.descricao,
                            postos: [
                                {
                                    codigo: ex.posto,
                                    descricao: ex.descricao_posto,
                                    totalDePacientes: parseInt(ex.totpac),
                                    totalDeExames: parseInt(ex.totexa),
                                    totalDeValor: parseFloat( ex.totvalor),
                                }
                            ]
                        });
                    }

                    const objetoDesteSetor = objetoDestaData.setores[temOMesmoSetor];
                    objetoDesteSetor.postos.push({
                        codigo: ex.posto,
                        descricao: ex.descricao_posto,
                        totalDePacientes: parseInt(ex.totpac),
                        totalDeExames: parseInt(ex.totexa),
                        totalDeValor: parseFloat( ex.totvalor),
                    });
                });
            }else {
                exames.forEach(ex => {
                    const temOMesmoPosto = dadosParaRelatorio.findIndex(d => d.id === ex.posto);
                    if (temOMesmoPosto < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.posto,
                            descricao: ex.descricao_posto,
                            setores: [
                                {
                                    id: ex.id,
                                    descricao: ex.descricao,
                                    totalDeExames: ex.totexa,
                                    totalDePacientes: ex.totpac,
                                    totalDeValor: ex.totvalor,
                                }
                            ]
                        });
                    }

                    const objetoDestePosto = dadosParaRelatorio[temOMesmoPosto];
                    objetoDestePosto.setores.push({
                        id: ex.id,
                        descricao: ex.descricao,
                        totalDeExames: ex.totexa,
                        totalDePacientes: ex.totpac,
                        totalDeValor: ex.totvalor,
                    });
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/setor/posto/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    ehAUltimaParte,
                    parte,
                    total,
                    tipoData: resto.tipoData === '1' ? 'Fatura': 'Coleta',
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

    async estatisticaNovaColeta(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const {
            setores,
            convenios,
            dataini,
            datafim,
            modelo,
            filtroConsideraExamesInclusos,
        } = req.body;

        try {

            let select = 'SELECT ';
            let groupBy = 'GROUP BY ';
            let orderBy = 'ORDER BY ';

            if (modelo === 'data') {
                select += `
                        NOVACOL.DATASOLIC,
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        CAST(COUNT(NOVACOL.EXAME_ID) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO AS DESCMOTIVO
                    FROM NOVACOL
                        LEFT JOIN MOVEXA ON MOVEXA.ID = NOVACOL.MOVEXA_ID
                        LEFT JOIN MOVPAC ON MOVPAC.ID = NOVACOL.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = NOVACOL.EXAME_ID
                        LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID
                        LEFT JOIN MOTIVO ON MOTIVO.ID = NOVACOL.MOTIVO_ID `;

                groupBy += `
                    NOVACOL.DATASOLIC,
                    SETOR.ID,
                    SETOR.DESCRICAO,
                    NOVACOL.MOTIVO_ID,
                    MOTIVO.DESCRICAO `;

                orderBy += `
                    NOVACOL.DATASOLIC,
                    SETOR.ID,
                    SETOR.DESCRICAO,
                    NOVACOL.MOTIVO_ID,
                    MOTIVO.DESCRICAO,
                    TOTPAC DESC `;

            }else if (modelo === 'geral') {
                select += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        CAST(COUNT(MOVEXA.EXAME_ID) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO AS DESCMOTIVO
                    FROM NOVACOL
                        LEFT JOIN MOVEXA ON MOVEXA.ID = NOVACOL.MOVEXA_ID
                        LEFT JOIN MOVPAC ON MOVPAC.ID = NOVACOL.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = NOVACOL.EXAME_ID
                        LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID
                        LEFT JOIN MOTIVO ON MOTIVO.ID = NOVACOL.MOTIVO_ID `;

                    groupBy += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO `;

                    orderBy += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO,
                        TOTPAC DESC `;
            }else {
                select += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        EXAME.DESCRICAO AS DESCEXA,
                        EXAME.CODIGO AS CODIGO_EXAME,
                        CAST(COUNT(MOVEXA.EXAME_ID) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO AS DESCMOTIVO
                    FROM NOVACOL
                        LEFT JOIN MOVEXA ON MOVEXA.ID = NOVACOL.MOVEXA_ID
                        LEFT JOIN MOVPAC ON MOVPAC.ID = NOVACOL.MOVPAC_ID
                        LEFT JOIN EXAME ON EXAME.ID = NOVACOL.EXAME_ID
                        LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID
                        LEFT JOIN MOTIVO ON MOTIVO.ID = NOVACOL.MOTIVO_ID `;

                    groupBy += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        EXAME.DESCRICAO,
                        EXAME.CODIGO,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO `;

                    orderBy += `
                        SETOR.ID,
                        SETOR.DESCRICAO,
                        NOVACOL.MOTIVO_ID,
                        MOTIVO.DESCRICAO,
                        TOTPAC DESC `;
            }

            let where = 'WHERE ';

            if (filtroConsideraExamesInclusos === '0') {
                where += 'MOVEXA.EXAMEINC = 0 AND '
            }

            const dataInicialFormatada = format(parseISO(dataini), 'yyyy-MM-dd');
            const dataFinalFormatada = format(parseISO(datafim), 'yyyy-MM-dd');

            const periodo = 'NOVACOL.DATASOLIC BETWEEN :dataInicial AND :dataFinal AND ';
            const validacaoConvenios = 'MOVEXA.CONVENIO_ID IN (:convenios) AND ';
            const validacaoSetores = 'EXAME.SETOR_ID IN (:setores) ';

            where += periodo;
            where += validacaoConvenios;
            where += validacaoSetores;

            select += where;
            select += groupBy;
            select += orderBy;

            const data = await Movexa.sequelize.query(select, {
                replacements: {
                    dataInicial: dataInicialFormatada,
                    dataFinal: dataFinalFormatada,
                    convenios,
                    setores,
                },
                type: QueryTypes.SELECT,
            });

            if (data.length > 100000) {
                throw new Error('Quantidade acima do limite');
            }

            const somaQuery = `
                SELECT
                    CAST(COUNT(MOVEXA.EXAME_ID) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM NOVACOL
                    LEFT JOIN MOVEXA ON MOVEXA.ID = NOVACOL.MOVEXA_ID
                    LEFT JOIN MOVPAC ON MOVPAC.ID = NOVACOL.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = NOVACOL.EXAME_ID
                    LEFT JOIN SETOR ON SETOR.ID = EXAME.SETOR_ID
                ${where}`

            const [soma] = await Movexa.sequelize.query(somaQuery, {
                replacements: {
                    dataInicial: dataInicialFormatada,
                    dataFinal: dataFinalFormatada,
                    convenios,
                    setores,
                },
                type: QueryTypes.SELECT,
            });

            soma.totexa = parseInt(soma.totexa);
            soma.totpac = parseInt(soma.totpac);

            const dadosMaisSoma = {
                data,
                soma
            }

            return res.status(200).json(dadosMaisSoma);
        } catch (error) {
            return res.status(400).json({message: error.message});
        }
    }

    async gerarRelatorioNovaColeta(req, res) {
        const {
            dados,
            dataini,
            datafim,
            color,
            profile,
            logo,
        } = req.body;
        const { exames, ehAUltimaParte, parte, modelo, resto } = dados;
        const { total } = resto;
        try {

            const dadosParaRelatorio = [];
            if (modelo === 'data') {
                exames.forEach(ex => {
                    const dataFormatada = format(
                        parseISO(ex.datasolic),
                        'dd/MM/yyyy'
                    );
                    const temAMesmaData = dadosParaRelatorio.findIndex(
                        d => d.data === dataFormatada
                    );
                    if (temAMesmaData < 0) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            setores: [
                                {
                                    id: ex.id,
                                    descricao: ex.descricao?.trim(),
                                    motivos: [
                                        {
                                            id: ex.motivo_id,
                                            descricao: ex.descmotivo?.trim(),
                                            totalDeExames: parseInt(ex.totexa),
                                        },
                                    ],
                                },
                            ],
                            total: parseInt(ex.totexa),
                        });
                    }

                    const objetoDestaData = dadosParaRelatorio[temAMesmaData];
                    objetoDestaData.total += parseInt(ex.totexa);
                    const temOMesmoSetor = objetoDestaData.setores.findIndex(
                        s => s.id === ex.id
                    );

                    if (temOMesmoSetor < 0) {
                        return objetoDestaData.setores.push({
                            id: ex.id,
                            descricao: ex.descricao?.trim(),
                            motivos: [
                                {
                                    id: ex.motivo_id,
                                    descricao: ex.descmotivo?.trim(),
                                    totalDeExames: parseInt(ex.totexa),
                                },
                            ],
                        });
                    }

                    const objetoDesteSetor =
                        objetoDestaData.setores[temOMesmoSetor];
                    const temOMesmoMotivo = objetoDesteSetor.motivos.findIndex(
                        m => m.id === ex.motivo_id
                    );
                    if (temOMesmoMotivo < 0) {
                        return objetoDesteSetor.motivos.push({
                            id: ex.motivo_id,
                            descricao: ex.descmotivo?.trim(),
                            totalDeExames: parseInt(ex.totexa),
                        });
                    }
                    const objetoDesteMotivo =
                        objetoDesteSetor.motivos[temOMesmoMotivo];
                    objetoDesteMotivo.totalDeExames += parseInt(ex.totexa);
                });

                dadosParaRelatorio.forEach(d => {
                    d.setores.forEach(set => {
                        set.motivos.forEach(m => {
                            m.porcentagem = `${((m.totalDeExames / total.totexa) * 100).toFixed(2)}%`;
                        })
                    })
                });

            } else if (modelo === 'geral') {
                exames.forEach(ex => {
                    const temOMesmoSetor = dadosParaRelatorio.findIndex(
                        d => d.id === ex.id
                    );
                    if (temOMesmoSetor < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.id,
                            descricao: ex.descricao,
                            motivos: [
                                {
                                    id: ex.motivo_id,
                                    descricao: ex.descmotivo?.trim(),
                                    totalDeExames: parseInt(ex.totexa),
                                },
                            ],
                        });
                    }

                    const objetoDesteSetor = dadosParaRelatorio[temOMesmoSetor];
                    const temOMesmoMotivo = objetoDesteSetor.motivos.findIndex(
                        m => m.id === ex.motivo_id
                    );

                    if (temOMesmoMotivo < 0) {
                        return objetoDesteSetor.motivos.push({
                            id: ex.motivo_id,
                            descricao: ex.descmotivo?.trim(),
                            totalDeExames: parseInt(ex.totexa),
                        });
                    }

                    const objetoDesteMotivo = objetoDesteSetor.motivos[temOMesmoMotivo];
                    objetoDesteMotivo.totalDeExames += parseInt(ex.totexa);
                });

                dadosParaRelatorio.forEach(d => {
                    d.motivos.forEach(m => {
                        m.porcentagem = `${((m.totalDeExames / total.totexa) * 100).toFixed(2)}%`;
                    })
                });
            } else {
                exames.forEach(ex => {
                    const temOSetor = dadosParaRelatorio.findIndex(d => d.id === ex.id);
                    if (temOSetor < 0) {
                        return dadosParaRelatorio.push({
                            id: ex.id,
                            descricao: ex.descricao?.trim(),
                            codigo: ex.codigo?.trim(),
                            exames: [
                                {
                                    descricao: ex.descexa?.trim(),
                                    total: parseInt(ex.totexa),
                                    motivo: ex.descmotivo?.trim(),
                                    codigo: ex.codigo_exame?.trim(),
                                }
                            ]
                        });
                    }

                    const objetoDesteSetor = dadosParaRelatorio[temOSetor];
                    objetoDesteSetor.exames.push({
                        descricao: ex.descexa?.trim(),
                        total: parseInt(ex.totexa),
                        motivo: ex.descmotivo?.trim(),
                        codigo: ex.codigo_exame?.trim(),
                    });
                });

                dadosParaRelatorio.forEach(d => {
                    d.exames.forEach(ex => {
                        ex.porcentagem = `${((ex.total / total.totexa) * 100).toFixed(2)}%`;
                    })
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/setor/novacoleta/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    ehAUltimaParte,
                    parte,
                    total,
                },
                startDate: dataini,
                endDate: datafim,
                profile,
                logo,
                color: `#${color}`
            });

            return res.send(html)
        } catch(error) {
            return res.status(400).json({message: error.message});
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'id':
                filter = ` CAST("Setor"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Setor"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'responsavel':
                if (filterValue !== null) {
                    filter += ` CAST("Setor"."responsavel" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Setor"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new SetorController();
