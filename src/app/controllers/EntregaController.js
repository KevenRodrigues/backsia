import * as Yup from 'yup';
import Database from '../../database';
import { gerarRelatorioHtml } from './functions/functions';
import { format, parseISO } from 'date-fns'
import { QueryTypes } from 'sequelize';

class EntregaController {
    // metodo para listar os dados da da tabela Entrega.
    async index(req, res) {
        try {
            const { Entrega, Motina } = Database.getModels(req.database);
            /* inicializa uma constante page e uma limit com os parametros page
        e limit passados na query da url definindo valor padrão de 1 para page e de
        10 para limit */
            const { page = 1, limit = 10 } = req.query;

            /* cria uma constante chamda order que pega o valor sortby passado na
         url depois de uma verificação, se ele for diferente de vazio armazena
         o valor passado na url se for vazio armazena a string id */
            const order = req.query.sortby !== '' ? req.query.sortby : 'id';

            /* cira uma constante chamada orderdesc que recebe o parametro sortbydesc
        passado na url depois de umna verificação, se o valor for identico a
        true ele recebe a sintring ASC se não armazena a string DESC */
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            /* cria uma constante chamada filter que recebe o parametro filterid
         passado na url depois de umna verificação, se o valor for diferente
         de string vazia ele recebe o valor passado no parametro filterid
         se não armazena a string vazia */
            const filter = req.query.filterid !== '' ? req.query.filterid : '';

            /* cria uma constante chamada filtervalue que recebe o parametro
        filtervalue passado na url depois de umna verificação, se o valor
        for diferente de string vazia ele recebe o valor passado no
        parametro filtervalue se não armazena a string vazia */
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            /* cria uma variavel chamada where inicializada com uma string vazia,
         que posteriormente recebe um valor que fica condicionado ao valor que
         esta armazenado na constante filter se esse valor for motina.descricao
         a variavel where ira armazenar um query transforma o valor armazenado
         no campo do motina.descricao, o coalesce previne caso o valor armazenado
         no campo seja nulo, trim para remoção de espaços upper para dixar todas as
         letras maiusculas, unaccent remove a acentuação, posteriormente ele compara
         com o valor armazenado na constante filtro valor esse que é colocado todo
         em letras maiusculas pelo toUpperCase e sua acentuação removida pelo Unaccent */
            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Entrega"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Entrega"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += EntregaController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = EntregaController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }
            /* cria uma constante Objeto entregas que recebe um valor resultante de
        uma query que é montada para  selecionar os valores dos campos
        no array da propriedade attribues tabela  entrega que ordena
        na query da propriedade order por um valor armazenado
        na constante order e o tipo da ordenação que esta na constante
        orderdesc condicionado na propriedade where pelo valor armazenado
        na constante where faz uma paginação na propriedade offset que
        que armazena o numero armazenado na constante pagina subtraido por
        1 multplicado pela constante limit, e inclui o campo descricao da tabela
        motina na propriedade includes */

            const entregas = await Entrega.findAll({
                order: Entrega.sequelize.literal(`${order} ${orderdesc}`),
                where: Entrega.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'gerainter',
                    'naoimprime',
                    'gerainterent',
                    'impbmp',
                    'naogeradeve',
                    'loginent',
                    'senhainterent',
                    'naogerapac',
                    'idopera_ultacao',
                    [Entrega.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            /* Cria uma constante Onjeto entregas_trim que recebe todos
         os elementos do objeto entrega com os espaço em branco removidos */
            try {
                const entregas_trim = entregas.map(entrega => {
                    entrega.descricao = entrega.descricao
                        ? entrega.descricao.trim()
                        : '';
                    entrega.loginent = entrega.loginent
                        ? entrega.loginent.trim()
                        : '';
                    entrega.senhainterent = entrega.senhainterent
                        ? entrega.senhainterent.trim()
                        : '';
                    entrega.motina.descricao = entrega.motina.descricao
                        ? entrega.motina.descricao.trim()
                        : '';
                    entrega.codigo = entrega.codigo ? entrega.codigo.trim() : 0;
                    entrega.gerainter = entrega.gerainter
                        ? entrega.gerainter.trim()
                        : 0;
                    entrega.naoimprime = entrega.naoimprime
                        ? entrega.naoimprime.trim()
                        : 0;
                    entrega.impbmp = entrega.impbmp ? entrega.impbmp.trim() : 0;
                    entrega.naogeradeve = entrega.naogeradeve
                        ? entrega.naogeradeve.trim()
                        : 0;
                    entrega.gerainterent = entrega.gerainterent
                        ? entrega.gerainterent.trim()
                        : 0;
                    entrega.naogerapac = entrega.naogerapac
                        ? entrega.naogerapac.trim()
                        : 0;
                    return entrega;
                });
                return res.status(200).json(entregas_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    /* metodo para listar um elemento atraves de pesquisa pelo id passado na url */
    async indexOne(req, res) {
        try {
            const { Entrega, Motina } = Database.getModels(req.database);
            const entregas = await Entrega.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'gerainter',
                    'naoimprime',
                    'gerainterent',
                    'impbmp',
                    'naogeradeve',
                    'loginent',
                    'senhainterent',
                    'naogerapac',
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

            if (!entregas) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                entregas.motina.descricao = entregas.motina.descricao.trim();
                entregas.descricao = entregas.descricao
                    ? entregas.descricao.trim()
                    : '';
                // entregas.status = entregas.status ? entregas.status.trim() : 0;
                entregas.codigo = entregas.codigo ? entregas.codigo.trim() : 0;
                entregas.gerainter = entregas.gerainter
                    ? entregas.gerainter.trim()
                    : 0;
                entregas.naoimprime = entregas.naoimprime
                    ? entregas.naoimprime.trim()
                    : 0;
                entregas.impbmp = entregas.impbmp ? entregas.impbmp.trim() : 0;
                entregas.naogeradeve = entregas.naogeradeve
                    ? entregas.naogeradeve.trim()
                    : 0;
                entregas.gerainterent = entregas.gerainterent
                    ? entregas.gerainterent.trim()
                    : 0;
                entregas.loginent = entregas.loginent
                    ? entregas.loginent.trim()
                    : '';
                entregas.senhainterent = entregas.senhainterent
                    ? entregas.senhainterent.trim()
                    : '';
                entregas.naogerapac = entregas.naogerapac
                    ? entregas.naogerapac.trim()
                    : 0;
                return res.status(200).json(entregas);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Entrega } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .required()
                    .max(100),
                status: Yup.number().required(),
                codigo: Yup.string()
                    .required()
                    .max(5),
                gerainter: Yup.number().max(1),
                naoimprime: Yup.number().max(1),
                gerainterent: Yup.number().max(1),
                impbmp: Yup.number().max(1),
                naogeradeve: Yup.number().max(1),
                loginent: Yup.string().max(30),
                senhainterent: Yup.string().max(10),
                naogerapac: Yup.number().max(1),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res
                    .status(400)
                    .json({ error: ' Validacao de campos Falhou.' });
            }

            const entregaExists = await Entrega.findOne({
                where: { codigo: req.body.codigo.trim().padStart(5, '0') },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (entregaExists) {
                return res
                    .status(400)
                    .json({ error: 'Entrega com codigo ja cadastrado.' });
            }
            req.body.codigo = req.body.codigo.trim().padStart(5, '0');

            const {
                id,
                descricao,
                status,
                codigo,
                gerainter,
                naoimprime,
                gerainterent,
                impbmp,
                naogeradeve,
                loginent,
                senhainterent,
                naogerapac,
                idopera_ultacao,
            } = await Entrega.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                codigo,
                gerainter,
                naoimprime,
                gerainterent,
                impbmp,
                naogeradeve,
                loginent,
                senhainterent,
                naogerapac,
                idopera_ultacao,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Entrega } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .required()
                    .max(100),
                status: Yup.number().required(),
                codigo: Yup.string()
                    .required()
                    .max(5),
                gerainter: Yup.number().max(1),
                naoimprime: Yup.number().max(1),
                gerainterent: Yup.number().max(1),
                impbmp: Yup.number().max(1),
                naogeradeve: Yup.number().max(1),
                loginent: Yup.string().max(30),
                senhainterent: Yup.string().max(10),
                naogerapac: Yup.number().max(1),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const entregaExists = await Entrega.findOne({
                where: { codigo: req.body.codigo.trim().padStart(5, '0') },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (entregaExists && req.body.id !== entregaExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Entrega com codigo ja cadastrado.' });
            }
            req.body.codigo = req.body.codigo.trim().padStart(5, '0');

            await Entrega.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        codigo: data[1].codigo,
                        status: data[1].status,
                        gerainter: data[1].gerainter,
                        naoimprime: data[1].naoimprime,
                        gerainterent: data[1].gerainterent,
                        impbmp: data[1].impbmp,
                        naogeradeve: data[1].naogeradeve,
                        loginent: data[1].loginent,
                        senhainterent: data[1].senhainterent,
                        naogerapac: data[1].naogerapac,
                        idopera_ultacao: data[1].idopera_ultacao,
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
            const { Entrega } = Database.getModels(req.database);
            await Entrega.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res
                            .status(200)
                            .json({ message: 'Deletado com sucesso' });
                    }
                    return res
                        .status(400)
                        .json({ error: 'Registro nao encontrado' });
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
                entregas,
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
                    ENTREGA.CODIGO,
	                ENTREGA.DESCRICAO,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO
                    LEFT JOIN ENTREGA ON ENTREGA.ID = MOVPAC.ENTREGA_ID
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
                MOVPAC.ENTREGA_ID IN (${entregas}) AND
                MOVEXA.DTCOLETA BETWEEN '${periodo}' `

            select += where;

            let groupBy = '';
            let orderBy = '';

            if (modelo === 'data') {
                groupBy = ' GROUP BY MOVEXA.DTCOLETA, MOVEXA.POSTO, ENTREGA.CODIGO, ENTREGA.DESCRICAO, posto.descricao ';
                orderBy = '  ORDER BY  movexa.DTCOLETA, MOVEXA.POSTO, TOTEXA DESC ';
            }else {
                groupBy = ' GROUP BY MOVEXA.POSTO, ENTREGA.CODIGO, ENTREGA.DESCRICAO, posto.descricao ';
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
                model: `/estatisticas/entrega/${dados.modelo === 'data' ? 'data': 'geral'}`,
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
                filter = ` CAST("Entrega"."codigo" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Entrega"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Entrega"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new EntregaController();
