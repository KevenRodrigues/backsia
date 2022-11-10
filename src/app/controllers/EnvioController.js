import * as Yup from 'yup';
import Database from '../../database';
import { gerarRelatorioHtml } from './functions/functions';
import { format, parseISO } from 'date-fns'
import { QueryTypes } from 'sequelize';

class EnvioController {
    async index(req, res) {
        try {
            const { Envio, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Envio"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Envio"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += EnvioController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = EnvioController.handleFilters(filter, filtervalue);
                }
            }

            const envios = await Envio.findAll({
                order: Envio.sequelize.literal(`${order} ${orderdesc}`),
                where: Envio.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'idopera_ultacao',
                    [Envio.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const envios_trim = envios.map(envio => {
                    envio.descricao = envio.descricao.trim();
                    envio.motina.descricao = envio.motina.descricao.trim();
                    return envio;
                });
                return res.status(200).json(envios_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Envio, Motina } = Database.getModels(req.database);
            const envios = await Envio.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
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

            if (!envios) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                envios.descricao = envios.descricao
                    ? envios.descricao.trim()
                    : '';
                envios.motina.descricao = envios.motina.descricao
                    ? envios.motina.descricao.trim()
                    : '';

                return res.status(200).json(envios);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Envio } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                codigo: Yup.string()
                    .required()
                    .max(5),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const envioExists = await Envio.findOne({
                where: { codigo: req.body.codigo },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (envioExists) {
                return res
                    .status(400)
                    .json({ error: 'Envio com codigo ja cadastrado.' });
            }

            const { id, descricao, status, codigo } = await Envio.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                codigo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Envio } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                codigo: Yup.string().max(5),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const envioExists = await Envio.findByPk(req.body.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!envioExists) {
                return res
                    .status(400)
                    .json({ error: 'Envio com codigo nao encontrado' });
            }

            if (envioExists && req.body.id !== envioExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Envio com codigo ja cadastrado.' });
            }

            await Envio.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        codigo: data[1].codigo,
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
            const { Envio } = Database.getModels(req.database);
            await Envio.destroy({
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
                envios,
                dataini,
                datafim,
                chkfmnc,
                consideraExamesInclusos,
                modelo
            } = req.body;

        try {

            let select = `
                SELECT
                    MOVEXA.POSTO,
                    POSTO.DESCRICAO AS DESCPOS,
                    ${modelo === 'data' ? 'MOVEXA.DTCOLETA,': ''}
                    ENVIO.CODIGO,
                    ENVIO.DESCRICAO,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO
                    LEFT JOIN ENVIO ON ENVIO.ID = MOVPAC.ENVIO_ID
                WHERE `

            if(consideraExamesInclusos !== '1'){
                select += ` MOVEXA.EXAMEINC = 0 AND `;
            }

            if(chkfmnc === '1'){
                select +=  ` MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND `;
            }

            const periodo = `${format(new Date(dataini), 'yyyy-MM-dd')}' AND '${format(new Date(datafim), 'yyyy-MM-dd')}`;

            let where = `
                MOVPAC.POSTO IN (${postos}) AND
                MOVPAC.ENVIO_ID IN (${envios}) AND
                MOVEXA.DTCOLETA BETWEEN '${periodo}' `

            select += where;

            let groupBy = '';
            let orderBy = '';

            if (modelo === 'data') {
                groupBy = ' GROUP BY MOVEXA.DTCOLETA, MOVEXA.POSTO, posto.descricao, ENVIO.CODIGO, ENVIO.DESCRICAO ';
                orderBy = '  ORDER BY  movexa.DTCOLETA, MOVEXA.POSTO, TOTEXA DESC ';
            }else {
                groupBy = ' GROUP BY MOVEXA.POSTO, posto.descricao, ENVIO.CODIGO, ENVIO.DESCRICAO ';
                orderBy = ' ORDER BY MOVEXA.POSTO, TOTEXA DESC ';
            }

            let limit = ' LIMIT 100001';

            select += groupBy;
            select += orderBy;
            select += limit;

            const dados = await Movexa.sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                });

            if (dados.length > 100000) {
                throw new RangeError('Quantidade acima do limite')
            }

            return res.status(200).json(dados);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorio(req, res) {

        const { dados, dataini, datafim, profile, logo, color } = req.body;
        try {
            const dadosDePostoExame = [];
            const length = dados.exames.length;
            if (dados.modelo === 'data') {
                for (let i  = 0; i < length; i++) {
                    const element = dados.exames[i];
                    let achou = false;
                    const dataFormatada = format(parseISO(element.dtcoleta), 'dd/MM/yyyy');
                    for (let j = 0; j < dadosDePostoExame.length; j++) {
                        const item = dadosDePostoExame[j];
                        if (dataFormatada === item.data){
                            achou = true;
                            const temPosto = item.postos.find(d => d.codigo === element.posto);
                            if (temPosto) {
                                const indiceDoPosto = item.postos.findIndex(i => i.codigo === temPosto.codigo);
                                item.postos[indiceDoPosto].exames.push({
                                    dataDeColeta: dataFormatada,
                                    codigo: element.codigo,
                                    descricao: element.descricao,
                                    quantidade: parseInt(element.totexa),
                                    quantidadePacientes: parseInt(element.totpac)
                                });

                                item.totalDeExamesDoDia += parseInt(element.totexa);
                                item.totalDePacientesDoDia += parseInt(element.totpac);
                                item.postos[indiceDoPosto].totalDeExames += parseInt(element.totexa);
                                item.postos[indiceDoPosto].totalDePacientes += parseInt(element.totpac);
                            }
                            else {
                                item.postos.push({
                                    nome: element.descpos,
                                    codigo: element.posto,
                                    totalDeExames: parseInt(element.totexa),
                                    totalDePacientes: parseInt(element.totpac),
                                    exames: [
                                        {
                                            dataDeColeta: dataFormatada,
                                            codigo: element.codigo,
                                            descricao: element.descricao,
                                            quantidade: parseInt(element.totexa),
                                            quantidadePacientes: parseInt(element.totpac)
                                        }
                                    ]
                                });
                                item.totalDeExamesDoDia += parseInt(element.totexa);
                                item.totalDePacientesDoDia += parseInt(element.totpac);
                            }
                        }
                    };
                    if (!achou) {
                        dadosDePostoExame.push({
                            data: dataFormatada,
                            totalDeExamesDoDia: parseInt(element.totexa),
                            totalDePacientesDoDia: parseInt(element.totpac),
                            postos: [
                                {
                                  nome: element.descpos,
                                  codigo: element.posto,
                                  totalDeExames: parseInt(element.totexa),
                                  totalDePacientes: parseInt(element.totpac),
                                  exames: [
                                      {
                                          dataDeColeta: dataFormatada,
                                          codigo: element.codigo,
                                          descricao: element.descricao,
                                          quantidade: parseInt(element.totexa),
                                          quantidadePacientes: parseInt(element.totpac)
                                      }
                                  ]
                                }
                            ]
                        });
                    }
                }
                dadosDePostoExame.sort((a, b) => new Date(a.dataDeColeta) - new Date(b.dataDeColeta));

            }else {
                for (let i = 0; i < length; i++) {
                    const element = dados.exames[i];
                    let achou = false;
                    for (let j = 0; j < dadosDePostoExame.length; j++) {
                        const item = dadosDePostoExame[j];
                        if (element.posto === item.codigo) {
                            achou = true;
                            item.exames.push(
                                    {
                                        codigo: element.codigo,
                                        descricao: element.descricao,
                                        quantidade: parseInt(element.totexa),
                                        quantidadePacientes: parseInt(element.totpac)
                                    }
                                );

                                item.totalDeExames += parseInt(element.totexa);
                                item.totalDePacientes += parseInt(element.totpac);
                            }
                    }
                    if (!achou) {
                            dadosDePostoExame.push({
                                totalDeExames: parseInt(element.totexa),
                                totalDePacientes: parseInt(element.totpac),
                                nome: element.descpos,
                                codigo: element.posto,
                                exames: [
                                    {
                                        codigo: element.codigo,
                                        descricao: element.descricao,
                                        quantidade: parseInt(element.totexa),
                                        quantidadePacientes: parseInt(element.totpac)
                                    }
                                ],
                            })
                    }
                }

            }

            const dadosDePostoExameMaisTotaisDeExames = {
                dadosDePostoExame,
                totalDeExamesGeral: 0,
                totalDePacientesGeral: 0,
            }

            if (dados.modelo === 'data') {
            dadosDePostoExame.forEach(d => {
                dadosDePostoExameMaisTotaisDeExames.totalDeExamesGeral += d.totalDeExamesDoDia;
                dadosDePostoExameMaisTotaisDeExames.totalDePacientesGeral += d.totalDePacientesDoDia;
            });
            }
            else {
            dadosDePostoExame.forEach(d => {
                dadosDePostoExameMaisTotaisDeExames.totalDeExamesGeral += d.totalDeExames;
                dadosDePostoExameMaisTotaisDeExames.totalDePacientesGeral += d.totalDePacientes;
            });
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/postoenvio/${dados.modelo === 'data' ? 'data': 'geral'}`,
                data: {
                    registros: dadosDePostoExameMaisTotaisDeExames,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte
                },
                profile,
                logo,
                startDate: format(new Date(dataini), 'yyyy-MM-dd'),
                endDate: format(new Date(datafim), 'yyyy-MM-dd'),
                color: `#${color}`
            });

            return res.send(html)
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Envio"."codigo" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Envio"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Envio"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new EnvioController();
