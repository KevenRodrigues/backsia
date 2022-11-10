import * as Yup from 'yup';
import aws from 'aws-sdk';
import Database from '../../database';
import { QueryTypes } from 'sequelize';
import { format, parseISO } from 'date-fns'
import { gerarRelatorioHtml } from './functions/functions';
import e from 'cors';
import { trim } from 'lodash';

const s3 = new aws.S3();

class RecipController {
    async index(req, res) {
        try {
            const { Recip, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Recip"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Recip"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += RecipController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = RecipController.handleFilters(filter, filtervalue);
                }
            }

            const recips = await Recip.findAll({
                order: Recip.sequelize.literal(`${order} ${orderdesc}`),
                where: Recip.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    'caminhoimg',
                    'caminhoimg_key',
                    [Recip.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const recips_trim = recips.map(recip => {
                    recip.descricao = recip.descricao.trim();
                    recip.motina.descricao = recip.motina.descricao.trim();
                    return recip;
                });

                return res.status(200).json(recips_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Recip, Motina } = Database.getModels(req.database);
            const recips = await Recip.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'tubo',
                    'naoimpetq',
                    'status',
                    'isolado',
                    'caminhoimg',
                    'caminhoimg_key',
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

            if (!recips) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                recips.descricao = recips.descricao
                    ? recips.descricao.trim()
                    : '';
                recips.motina.descricao = recips.motina.descricao
                    ? recips.motina.descricao.trim()
                    : '';

                return res.status(200).json(recips);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Recip } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, descricao, status } = await Recip.create(
                req.body
            ).catch(err => {
                return res.status(400).json({
                    error: `${err.message}  ${err.original.message} ${err.original.detail}`,
                });
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

    async update(req, res) {
        try {
            const { Recip } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const recipExists = await Recip.findByPk(req.body.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!recipExists) {
                return res
                    .status(400)
                    .json({ error: 'Recipiente com código não encontrado' });
            }

            await Recip.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
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
            const { Recip } = Database.getModels(req.database);
            await Recip.destroy({
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

    async updateImage(req, res) {
        try {
            const { Recip } = Database.getModels(req.database);
            const { key, Location: url } = req.file;

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            await Recip.update(
                { caminhoimg_key: key || '', caminhoimg: newUrl || '' },
                { where: { id: req.params.id } }
            ).catch(err => {
                res.status(400).json({ error: err.message });
            });

            return res
                .status(200)
                .json({ caminhoimg_key: key, caminhoimg: newUrl });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async deleteImage(req, res) {
        try {
            const { key } = req.params;

            const params = { Bucket: 'sialab', Key: key };
            await s3.deleteObject(params, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    return res.status(200).json('Excluído com sucesso!');
                }
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async deleteUpdateImage(req, res) {
        try {
            const { Recip } = Database.getModels(req.database);
            const { key } = req.params;

            const params = { Bucket: 'sialab', Key: key };
            await s3.deleteObject(params, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    return res.status(200).json('Excluído com sucesso!');
                }
            });
            await Recip.update(
                { caminhoimg_key: null, caminhoimg: null },
                { where: { id: req.params.id } }
            ).catch(err => {
                res.status(400).json({ error: err.message });
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async estatistica(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const {
            apoios,
            postos,
            dataini,
            datafim,
            filtroData,
            filtroExamesInclusos,
            filtroFaltaMaterialENovaColeta,
            filtroTuboDeTriagemNaSomatoria,
        } = req.body;

        try {
            let tipoData = filtroData === '1' ? 'DTFATURA' : 'DTCOLETA';
            let select = `
                SELECT
                    MOVEXA.AMOSTRA,
                    MOVEXA.POSTO,
                    MOVEXA.${tipoData} AS DTCOLETA,
                    MOVEXA.EXAME_ID,
                    EXAME.DESCRICAO AS DESCEXA,
                    EXAME.CODIGO AS CODEXA,
                    a.DESCRICAO AS DESCRECIP,
                    a.ID AS CODRECIP,
                    b.DESCRICAO AS DESCRECIP_TRI,
                    b.ID AS CODRECIP_TRI,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as numeric(9,0)) AS TOTEXA,
                    PRONTUARIO.NOME AS PACIENTE
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN RECIP A ON (A.ID = EXAME.RECIPCOL_ID)
                    LEFT JOIN RECIP B ON (B.ID = EXAME.RECIPTRI_ID) `;

            const dataInicialFormatada = format(
                new Date(dataini),
                'yyyy-MM-dd'
            );
            const dataFinalFormatada = format(new Date(datafim), 'yyyy-MM-dd');

            let where = `
                WHERE
                    MOVEXA.${tipoData} BETWEEN '${dataInicialFormatada}' AND '${dataFinalFormatada}'
                    AND MOVEXA.POSTO IN (${postos}) AND
                    MOVEXA.APOIO_ID IN (${apoios}) `;

            if (filtroExamesInclusos !== '1') {
                where += `AND MOVEXA.EXAMEINC = 0 `;
            }

            if (filtroFaltaMaterialENovaColeta === '1') {
                where += `AND (MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC') `;
            }

            select += where;

            const groupBy = `
                GROUP BY
                    MOVEXA.${tipoData},
                    MOVEXA.EXAME_ID,
                    EXAME.DESCRICAO,
                    EXAME.CODIGO,
                    a.DESCRICAO,
                    a.ID,
                    b.DESCRICAO,
                    b.ID,
                    MOVEXA.AMOSTRA,
                    MOVEXA.POSTO,
                    PRONTUARIO.NOME `;

            select += groupBy;

            const orderBy = `ORDER BY MOVEXA.${tipoData}, TOTEXA DESC`;

            select += orderBy;

            const data = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
            });

            if (data.length > 60000) {
                throw new Error('Quantidade de registros acima do limite');
            }

            let tubosTratados = [];
            data.forEach(ex => {
                let lltubonull = false;
                if (!ex.codrecip) {
                    if (!ex.codrecip_tri) {
                        lltubonull = true;
                    }
                    ex.descrecip = 'RECIPIENTE DE COLETA NÃO INFORMADO NO EXAME';
                    ex.codrecip = 0;
                }

                if (!lltubonull && filtroTuboDeTriagemNaSomatoria === '1') {
                    if (ex.codrecip_tri !== ex.codrecip) {
                        const novoItem = { ...ex };
                        novoItem.descrecip = ex.descrecip_tri;
                        novoItem.codrecip = ex.codrecip_tri;
                        tubosTratados.push(novoItem);
                    }
                }
                tubosTratados.push(ex);
            });

            if (tubosTratados.length > 100000) {
                throw new Error('Quantidade de registros acima do limite');
            }

            let total = 0;
            const tubosPorData = [];
            tubosTratados.forEach(ex => {
                const temAMesmaData = tubosPorData.findIndex(d => d.data === ex.dtcoleta);
                if (temAMesmaData < 0) {
                    return tubosPorData.push({
                        data: ex.dtcoleta,
                        tubos: [
                            {
                                nome: ex.descrecip?.trim(),
                                codigo: ex.codrecip,
                                data: ex.dtcoleta,
                                postosEAmostras: [
                                    {
                                        posto: ex.posto,
                                        amostra: ex.amostra,
                                    },
                                ],
                                total: 1,
                            },
                        ],
                    });
                }
                const objetoDestaData = tubosPorData[temAMesmaData];
                const temOMesmoTubo = objetoDestaData.tubos.findIndex(
                    t => t.codigo === ex.codrecip
                );
                if (temOMesmoTubo < 0) {
                    total += 1;
                    return objetoDestaData.tubos.push({
                        nome: ex.descrecip?.trim(),
                        codigo: ex.codrecip,
                        data: ex.dtcoleta,
                        postosEAmostras: [
                            {
                                posto: ex.posto,
                                amostra: ex.amostra,
                            },
                        ],
                        total: 1,
                    });
                }

                const objetoDesteTubo = objetoDestaData.tubos[temOMesmoTubo];
                const temNoMesmoPostoEAmostra = objetoDesteTubo.postosEAmostras.findIndex(
                    pa => pa.posto === ex.posto && pa.amostra === ex.amostra
                );

                if (temNoMesmoPostoEAmostra < 0) {
                    total += 1;
                    objetoDesteTubo.total += 1;
                    return objetoDesteTubo.postosEAmostras.push({
                        posto: ex.posto,
                        amostra: ex.amostra,
                    });
                }
            });

            const dadosTabela = [];
             tubosPorData.forEach(d => {
                d.tubos.forEach(t => dadosTabela.push(t));
            });

            const dadosComSoma = {
                dados: tubosTratados,
                total,
                dadosTabela,
            };

            return res.status(200).json(dadosComSoma);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorio(req, res) {
        const { dados, dataini, datafim, color, profile, logo } = req.body;
        const { modelo } = dados;
        const { exames } = dados;
        const { total, tipoDeData } = dados.resto;

        try {
            const dadosParaRelatorio = [];

            if (modelo === 'data') {
                // TODO tratamento para relatório por data
                exames.forEach(ex => {
                    const dataFormatada = format(
                        parseISO(ex.dtcoleta),
                        'dd/MM/yyyy'
                    );
                    const temNaMesmaData = dadosParaRelatorio.findIndex(
                        d => d.data === dataFormatada
                    );
                    if (temNaMesmaData < 0) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            total: 1,
                            tubos: [
                                {
                                    nome: ex.descrecip?.trim(),
                                    codrecip: ex.codrecip,
                                    exames: [ex.amostra],
                                    total: 1,
                                },
                            ],
                        });
                    }
                    const objetoDestaData = dadosParaRelatorio[temNaMesmaData];
                    const temOMesmoTubo = objetoDestaData.tubos.findIndex(
                        op => op.codrecip === ex.codrecip
                    );
                    if (temOMesmoTubo < 0) {
                        objetoDestaData.total += 1;
                        return objetoDestaData.tubos.push({
                            nome: ex.descrecip?.trim(),
                            codrecip: ex.codrecip,
                            exames: [ex.amostra],
                            total: 1,
                        });
                    }
                    const tuboEncontradoNoObjetoDestaData =
                        objetoDestaData.tubos[temOMesmoTubo];
                    const temAmesmaAmostra = tuboEncontradoNoObjetoDestaData.exames.findIndex(
                        t => t === ex.amostra
                    );
                    if (temAmesmaAmostra < 0) {
                        tuboEncontradoNoObjetoDestaData.total += 1;
                        objetoDestaData.total += 1;
                    }
                    tuboEncontradoNoObjetoDestaData.exames.push(ex.amostra);
                });
            } else if (modelo === 'postoamostra') {
                // TODO tratamento para relatório por posto+amosta
                exames.forEach(ex => {
                    const dataFormatada = format(
                        parseISO(ex.dtcoleta),
                        'dd/MM/yyyy'
                    );
                    const temNaMesmaData = dadosParaRelatorio.findIndex(
                        d => d.data === dataFormatada
                    );
                    if (temNaMesmaData < 0) {
                        return dadosParaRelatorio.push({
                            data: dataFormatada,
                            postoAmostra: [
                                {
                                    amostra: ex.amostra,
                                    posto: ex.posto,
                                    paciente: ex.paciente,
                                    tubos: [
                                        {
                                            codrecip: ex.codrecip,
                                            descrecip: ex.descrecip?.trim(),
                                            exames: [ex.codexa?.trim()],
                                            total: 1,
                                        },
                                    ],
                                    total: 1,
                                },
                            ],
                            total: 1,
                        });
                    }
                    const objetoDestaData = dadosParaRelatorio[temNaMesmaData];

                    const temNoMesmoPostoEAmostra = objetoDestaData.postoAmostra.findIndex(
                        p => p.amostra === ex.amostra && p.posto === ex.posto
                    );
                    if (temNoMesmoPostoEAmostra < 0) {
                        objetoDestaData.total += 1;
                        return objetoDestaData.postoAmostra.push({
                            amostra: ex.amostra,
                            posto: ex.posto,
                            paciente: ex.paciente,
                            tubos: [
                                {
                                    codrecip: ex.codrecip,
                                    descrecip: ex.descrecip?.trim(),
                                    exames: [ex.codexa?.trim()],
                                    total: 1,
                                },
                            ],
                            total: 1,
                        });
                    }
                    const objetoDestePostoEAmostra =
                        objetoDestaData.postoAmostra[temNoMesmoPostoEAmostra];

                    const temOMesmoTubo = objetoDestePostoEAmostra.tubos.findIndex(
                        t => t.codrecip === ex.codrecip
                    );
                    if (temOMesmoTubo < 0) {
                        objetoDestaData.total += 1;
                        objetoDestePostoEAmostra.total += 1;
                        return objetoDestePostoEAmostra.tubos.push({
                            codrecip: ex.codrecip,
                            descrecip: ex.descrecip?.trim(),
                            exames: [ex.codexa?.trim()],
                            total: 1,
                        });
                    }

                    const objetoDesteTubo =
                        objetoDestePostoEAmostra.tubos[temOMesmoTubo];
                    objetoDesteTubo.exames.push(ex.codexa?.trim());
                    objetoDesteTubo.total += 1;
                });
            } else {
                // TODO tratamento para relatório geral
                exames.forEach(ex => {
                    const temOMesmoTubo = dadosParaRelatorio.findIndex(
                        t => t.codigo === ex.codrecip
                    );
                    if (temOMesmoTubo < 0) {
                        return dadosParaRelatorio.push({
                            nome: ex.descrecip?.trim(),
                            codigo: ex.codrecip,
                            postosEAmostras: [
                                {
                                    posto: ex.posto,
                                    amostra: ex.amostra,
                                },
                            ],
                            total: 1,
                        });
                    }

                    const objetoDesteTubo = dadosParaRelatorio[temOMesmoTubo];
                    const temNoMesmoPostoEAmostra = objetoDesteTubo.postosEAmostras.findIndex(
                        pa => pa.posto === ex.posto && pa.amostra === ex.amostra
                    );

                    if (temNoMesmoPostoEAmostra < 0) {
                        objetoDesteTubo.total += 1;
                        return objetoDesteTubo.postosEAmostras.push({
                            posto: ex.posto,
                            amostra: ex.amostra,
                        });
                    }
                });
                dadosParaRelatorio.sort(function(a, b) {
                    if (a.nome > b.nome) {
                        return 1;
                    }
                    if (a.nome < b.nome) {
                        return -1;
                    }
                    return 0;
                });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/recipientes/${modelo}`,
                data: {
                    registros: dadosParaRelatorio,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte,
                    totalDeTubos: total,
                    tipoDeData,
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

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'id':
                filter = ` CAST("Recip"."id" AS TEXT) LIKE '${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Recip"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Recip"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new RecipController();
