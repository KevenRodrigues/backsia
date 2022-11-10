import * as Yup from 'yup';
import aws from 'aws-sdk';
import Database from '../../database';
import { QueryTypes } from 'sequelize';
import { gerarRelatorioHtml } from './functions/functions';
import { format, parseISO } from 'date-fns'

const s3 = new aws.S3();

class PostoController {
    async index(req, res) {
        try {
            const { Posto, Motina } = Database.getModels(req.database);
            const {
                page = 1,
                limit = 10,
                sortby,
                sortbydesc,
                postoperm,
                filterid,
                filtervalue,
                search,
                filters,
            } = req.query;

            let hasMovpacId = req.query.hasMovpacId !== 'create' ? true : false;

            const order = sortby !== '' ? sortby : 'id';
            const orderdesc = sortbydesc === 'true' ? 'ASC' : 'DESC';
            const postoPerm = postoperm !== '' ? postoperm : '';
            const filter = filterid !== '' ? filterid : '';
            const filterValue = filtervalue !== '' ? filtervalue : '';
            const searchValue = search && search.length > 0 ? search : '';

            let where = '';
            if (searchValue && searchValue.length > 0) {
                if (postoPerm !== '') {
                    where +=
                        where === ''
                            ? ` ("Posto"."codigo" in ('${postoPerm.replace(
                                /,/gi,
                                "','"
                            )}'))`
                            : ` and ("Posto"."codigo" in ('${postoPerm.replace(
                                /,/gi,
                                "','"
                            )}'))`;
                } else {
                    where = ` (Unaccent(upper(trim(coalesce("Posto"."descricao",'')))) ILIKE Unaccent('%${searchValue.toUpperCase()}%')) or (CAST("Posto"."codigo" AS TEXT) LIKE '%${searchValue.toUpperCase()}%')`;
                }
            } else {
                const filtersValues = filters
                    ? JSON.parse(filters)
                    : [];

                if (filtersValues.length > 0) {
                    filtersValues.forEach((item, index) => {
                        if(index > 0 && item.value !== 'todos' && where){
                            where += ' AND ';
                        }

                        where += PostoController.handleFilters(item.id, item.value);
                    })
                } else {
                    where = PostoController.handleFilters(filter, filterValue);
                }

                if (postoperm !== '') {
                    where +=
                        where === ''
                            ? ` ("Posto"."codigo" in ('${postoperm.replace(
                                /,/gi,
                                "','"
                            )}'))`
                            : ` and ("Posto"."codigo" in ('${postoperm.replace(
                                /,/gi,
                                "','"
                            )}'))`;
                }
            }

            const postos = await Posto.findAll({
                order: Posto.sequelize.literal(`${order} ${orderdesc}`),
                where: Posto.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'responsavel',
                    'idopera_ultacao',
                    [Posto.sequelize.literal('count(*) OVER ()'), 'total'],
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
                let postosFiltrados = postos;
                if (!hasMovpacId) {
                    postosFiltrados = postosFiltrados.filter(item => item.status === 0);
                }
                const postos_trim = postosFiltrados.map(posto => {
                    posto.descricao = posto.descricao
                        ? posto.descricao.trim()
                        : '';
                    posto.responsavel = posto.responsavel
                        ? posto.responsavel.trim()
                        : '';
                    posto.codigo = posto.codigo ? posto.codigo.trim() : '';
                    posto.motina.descricao = posto.motina.descricao.trim();
                    return posto;
                });
                return res.status(200).json(postos_trim);
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
                Posto,
                Motina,
                Convenio,
                Entrega,
                Envio,
            } = Database.getModels(req.database);
            const postos = await Posto.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'envio_id',
                    'entrega_id',
                    'convenio_id',
                    'descricao',
                    'responsavel',
                    'status',
                    'codigo',
                    'num_aut',
                    'usa_cor_fundo',
                    'cor_fundo',
                    'seq',
                    'rsexo',
                    'rdata_nasc',
                    'restadociv',
                    'rgruposang',
                    'rfatorrh',
                    'rrg',
                    'rcpf',
                    'rcor',
                    'remail',
                    'rprofissao',
                    'rcep',
                    'rrua',
                    'rbairro',
                    'rcidade',
                    'ruf',
                    'rfone1',
                    'rfone2',
                    'rmatric',
                    'rvalplano',
                    'seqinter',
                    'bpacnes',
                    'rempresa',
                    'rbpaibge',
                    'rtitular',
                    'bpaibge',
                    'rcns',
                    'rcid',
                    'alerta_dias',
                    'rnumero',
                    'rcompl',
                    'pasta_inter_pos',
                    'pasta_backup_pos',
                    'controla_coleta_entrega',
                    'exige_senha_atend',
                    'endereco',
                    'bairro',
                    'cidade',
                    'uf',
                    'cep',
                    'ddd',
                    'fone',
                    'cor_hexa',
                    'urg_prio_ativa',
                    'usa_fundo_posto',
                    'fundo_bmp_pos',
                    'rrg_dtexp',
                    'rnis_pis',
                    'rnome_social',
                    'etq_ws',
                    'idopera_ultacao',
                    'exibe_pacientes_coleta',
                    'origem_inter',
                    'fundo_bmp_url',
                    'fundo_bmp_key',
                    'email',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Convenio,
                        as: 'convenio',
                        attributes: ['fantasia', 'codigo', 'id'],
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                        attributes: ['descricao', 'codigo', 'id'],
                    },
                    {
                        model: Envio,
                        as: 'envio',
                        attributes: ['descricao', 'codigo', 'id'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!postos) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                postos.descricao = postos.descricao
                    ? postos.descricao.trim()
                    : '';
                postos.responsavel = postos.responsavel
                    ? postos.responsavel.trim()
                    : '';
                postos.codigo = postos.codigo ? postos.codigo.trim() : '';
                postos.motina.descricao = postos.motina.descricao
                    ? postos.motina.descricao.trim()
                    : '';

                if (postos.envio_id) {
                    postos.envio.descricao = postos.envio.descricao
                        ? postos.envio.descricao.trim()
                        : '';
                }
                if (postos.entrega_id) {
                    postos.entrega.descricao = postos.entrega.descricao
                        ? postos.entrega.descricao.trim()
                        : '';
                }
                if (postos.convenio_id) {
                    postos.convenio.fantasia = postos.convenio.fantasia
                        ? postos.convenio.fantasia.trim()
                        : '';
                }

                return res.status(200).json(postos);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Posto } = Database.getModels(req.database);
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

            const postoExists = await Posto.findOne({
                where: { codigo: req.body.codigo },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (postoExists) {
                return res
                    .status(400)
                    .json({ error: 'Posto com codigo ja cadastrado.' });
            }

            const { id, descricao, status, codigo } = await Posto.create(
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
            const { Posto } = Database.getModels(req.database);
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

            const postoExists = await Posto.findByPk(req.body.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!postoExists) {
                return res
                    .status(400)
                    .json({ error: 'Posto com codigo nao encontrado' });
            }

            if (postoExists && req.body.id !== postoExists.id.toString()) {
                return res
                    .status(400)
                    .json({ error: 'Posto com codigo ja cadastrado.' });
            }

            await Posto.update(req.body, {
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
            const { Posto } = Database.getModels(req.database);
            await Posto.destroy({
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

    async updateBmp(req, res) {
        try {
            const { Posto } = Database.getModels(req.database);
            const { key, Location: url } = req.file;

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            await Posto.update(
                { fundo_bmp_key: key || '', fundo_bmp_url: newUrl || '' },
                { where: { id: req.params.id } }
            ).catch(err => {
                res.status(400).json({ error: err.message });
            });

            return res
                .status(200)
                .json({ fundo_bmp_key: key, fundo_bmp_url: newUrl });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async excludeBmp(req, res) {
        try {
            const { Posto } = Database.getModels(req.database);
            const { key } = req.params;

            const params = { Bucket: 'sialab', Key: key };
            await s3.deleteObject(params, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    return res.status(200).json('Excluído com sucesso!');
                }
            });

            await Posto.update(
                { fundo_bmp_key: null, fundo_bmp_url: null },
                { where: { id: req.params.id } }
            ).catch(err => {
                res.status(400).json({ error: err.message });
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async deleteBmp(req, res) {
        try {
            const { key } = req.params;

            const params = { Bucket: 'sialab', Key: key };
            await s3.deleteObject(params, function (err, data) {
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

    async estatistica(req, res) {

        try {
            const { Movexa } = Database.getModels(req.database);
            const {
                posto,
                convenio,
                dataini,
                datafim,
                chkfmnc,
                chkfatura,
                chkentrada,
                consideraExamesInclusos,
                modelo
            } = req.body;

            let tipoData = 'DTCOLETA';

                if(chkfatura === '1'){
                    tipoData = 'DTFATURA'
                } else if (chkentrada === '1'){
                    tipoData = 'DATAENTRA';
                }

            let selectPorTipoDeData = ` MOVEXA.${tipoData} AS DTCOLETA, `;

            let select = `SELECT
                        MOVEXA.POSTO,
                        POSTO.DESCRICAO AS DESCPOS,
                        ${modelo === 'data' ? selectPorTipoDeData: ''}
                        MOVEXA.CONVENIO_ID,
                        CONVENIO.FANTASIA AS DESCCONV,
                        CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                        CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC,
                        SUM(MOVEXA.VALCONV+MOVEXA.VALPAC) AS TOTVAL
                    FROM MOVEXA
                        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID
                        LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO
                     `;

            let where = 'WHERE '
            if(consideraExamesInclusos !== '1'){
                where += ` MOVEXA.EXAMEINC = 0 AND `;
            }

            if(chkfmnc === '1'){
                where +=  ` MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND `;
            }

            let betweenPorTipoDeData = ''
            const periodo = `${format(parseISO(dataini), 'yyyy-MM-dd')}' AND '${format(parseISO(datafim), 'yyyy-MM-dd')}`;

            betweenPorTipoDeData = `MOVEXA.${tipoData} BETWEEN '${periodo}' `;

            where += `MOVEXA.POSTO IN (${posto})
                    AND MOVEXA.CONVENIO_ID IN (${convenio})
                    AND ${betweenPorTipoDeData} `

            select += where;

                if (modelo === 'data') {
                    select += ` GROUP BY MOVEXA.POSTO,
                    POSTO.DESCRICAO,
                    MOVEXA.CONVENIO_ID,
                    CONVENIO.FANTASIA,
                    MOVEXA.${tipoData}
                ORDER BY MOVEXA.POSTO,
                    TOTPAC DESC,
                    MOVEXA.CONVENIO_id`
                }else {
                    select += `GROUP BY MOVEXA.POSTO,
                    POSTO.DESCRICAO,
                    MOVEXA.CONVENIO_ID,
                    CONVENIO.FANTASIA
                ORDER BY MOVEXA.POSTO,
                    TOTPAC DESC,
                    MOVEXA.CONVENIO_id`
                }

            let limit = ' LIMIT 100001';
            select += limit;
            const dados = await Movexa.sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                })

            const dadosDeColetas = [];

            if (dados.length > 100000) {
                throw new RangeError('Quantidade acima do limite');
            }

            if (modelo === 'data') {
                dados.sort((a, b) => new Date(a.dtcoleta) - new Date(b.dtcoleta))
                dados.forEach((dado) => {
                    let temData = false;
                    const dataFormatada = format(parseISO(dado.dtcoleta), 'dd/MM/yyyy');
                    dadosDeColetas.forEach((dadoDeColeta) => {
                        if (dataFormatada === dadoDeColeta.dtcoleta) {
                            temData = true;
                            const temPosto = dadoDeColeta.coletas.find(el => el.posto === dado.descpos);
                            if (temPosto) {
                                const indiceDoPosto = dadoDeColeta.coletas.findIndex(c => c.posto === dado.descpos);
                                dadoDeColeta.coletas[indiceDoPosto].itens.push(dado);
                                dadoDeColeta.coletas[indiceDoPosto].totaisGerais.totalDeConvenios += parseFloat(dado.totval);
                                dadoDeColeta.coletas[indiceDoPosto].totaisGerais.totalDeExames += parseInt(dado.totexa);
                                dadoDeColeta.coletas[indiceDoPosto].totaisGerais.totalDePacientes += parseInt(dado.totpac);
                                dadoDeColeta.resumoDoDia.resumoDeConvenios += parseFloat(dado.totval);
                                dadoDeColeta.resumoDoDia.resumoDeExames += parseInt(dado.totexa);
                                dadoDeColeta.resumoDoDia.resumoDePacientes += parseInt(dado.totpac);
                            }
                            else {
                                dadoDeColeta.coletas.push({
                                    posto: dado.descpos,
                                    codigoPosto: dado.posto,
                                    itens: [dado],
                                    totaisGerais: {
                                        totalDeConvenios: parseFloat(dado.totval),
                                        totalDeExames: parseInt(dado.totexa),
                                        totalDePacientes: parseInt(dado.totpac),
                                    }
                                });
                                dadoDeColeta.resumoDoDia.resumoDeConvenios += parseFloat(dado.totval);
                                dadoDeColeta.resumoDoDia.resumoDeExames += parseInt(dado.totexa);
                                dadoDeColeta.resumoDoDia.resumoDePacientes += parseInt(dado.totpac);
                            }
                        }
                    })
                    if (!temData) dadosDeColetas.push({
                        dtcoleta: dataFormatada,
                        coletas: [
                            {
                                posto: dado.descpos,
                                codigoPosto: dado.posto,
                                itens: [dado],
                                totaisGerais: {
                                    totalDeConvenios: parseFloat(dado.totval),
                                    totalDeExames: parseInt(dado.totexa),
                                    totalDePacientes: parseInt(dado.totpac),
                                }
                            }
                        ],
                        resumoDoDia: {
                            resumoDeConvenios: parseFloat(dado.totval),
                            resumoDeExames: parseInt(dado.totexa),
                            resumoDePacientes: parseInt(dado.totpac),
                        }
                    });
                });

            }else {
                dados.forEach(dado => {
                    let achou = false;
                    dadosDeColetas.forEach(dadoDeColeta => {
                      if (dado.posto === dadoDeColeta.codigo) {
                          achou = true;
                          const temConvenio = dadoDeColeta.convenios.find(c => c.id === dado.convenio_id);
                          if (temConvenio) {
                            const indiceConvenio = dadoDeColeta.convenios.findIndex(c => c.id === dado.convenio_id);
                            dadoDeColeta.convenios[indiceConvenio].totalPacientes += parseInt(dado.totpac);
                            dadoDeColeta.convenios[indiceConvenio].totalExames += parseInt(dado.totexa);
                            dadoDeColeta.convenios[indiceConvenio].totalConvenio += parseFloat(dado.totval);

                            dadoDeColeta.totaisGerais.totaisGeraisPacientes += parseInt(dado.totpac);
                            dadoDeColeta.totaisGerais.totaisGeraisExames += parseInt(dado.totexa);
                            dadoDeColeta.totaisGerais.totaisGeraisConvenios += parseFloat(dado.totval);
                          }else {
                              dadoDeColeta.convenios.push({
                                  id: dado.convenio_id,
                                  convenio: dado.descconv,
                                  totalPacientes: parseInt(dado.totpac),
                                  totalExames: parseInt(dado.totexa),
                                  totalConvenio: parseFloat(dado.totval),
                              });
                              dadoDeColeta.totaisGerais.totaisGeraisPacientes += parseInt(dado.totpac);
                              dadoDeColeta.totaisGerais.totaisGeraisExames += parseInt(dado.totexa);
                              dadoDeColeta.totaisGerais.totaisGeraisConvenios += parseFloat(dado.totval);
                          }
                      }
                    });
                    if (!achou) {
                        dadosDeColetas.push({
                            nomePosto: dado.descpos,
                            codigo: dado.posto,
                            convenios: [
                                {
                                    id: dado.convenio_id,
                                    convenio: dado.descconv,
                                    totalPacientes: parseInt(dado.totpac),
                                    totalExames: parseInt(dado.totexa),
                                    totalConvenio: parseFloat(dado.totval),
                                }
                            ],
                            totaisGerais: {
                                totaisGeraisPacientes: parseInt(dado.totpac),
                                totaisGeraisExames: parseInt(dado.totexa),
                                totaisGeraisConvenios: parseFloat(dado.totval),
                            }
                        });
                    }
                });
            }

            const dadosDeColetasMaisResumoGeral = {
                resumoGeral: {
                    resumoGeralConvenios: 0,
                    resumoGeralExames: 0,
                    resumoGeralPacientes: 0,
                },
                dadosDeColetas,
                quantidadeDeRegistros: dados.length
            }

            if (modelo === 'data') {
                    dadosDeColetas.forEach(item => {
                    dadosDeColetasMaisResumoGeral.resumoGeral.resumoGeralConvenios += item.resumoDoDia.resumoDeConvenios;
                    dadosDeColetasMaisResumoGeral.resumoGeral.resumoGeralExames += item.resumoDoDia.resumoDeExames;
                    dadosDeColetasMaisResumoGeral.resumoGeral.resumoGeralPacientes += item.resumoDoDia.resumoDePacientes;
                });
            }
            else {
                dadosDeColetas.forEach(item => {
                    dadosDeColetasMaisResumoGeral.resumoGeral.resumoGeralConvenios += item.totaisGerais.totaisGeraisConvenios;
                    dadosDeColetasMaisResumoGeral.resumoGeral.resumoGeralExames += item.totaisGerais.totaisGeraisExames;
                    dadosDeColetasMaisResumoGeral.resumoGeral.resumoGeralPacientes += item.totaisGerais.totaisGeraisPacientes;
                });
            }

            return res.status(200).json(dadosDeColetasMaisResumoGeral);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorio(req, res) {

        const { dados, dataini, datafim, color, logo, profile } = req.body;
        const { tipoDeData } = dados.resto;
        try {
            const html = await gerarRelatorioHtml({
                model: `/estatisticas/postocoleta/${dados.modelo === 'data' ? 'data': 'geral'}`,
                data: {
                    registros: dados.exames,
                    totais: dados.totais,
                    parte: dados.parte,
                    ehAUltimaParte: dados.ehAUltimaParte,
                    tipoDeData,
                },
                profile,
                logo,
                startDate: format(new Date(dataini), 'yyyy-MM-dd'),
                endDate: format(new Date(datafim), 'yyyy-MM-dd'),
                color: `#${color}`
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({error: error.message})
        }
    }

    async estatisticaPostoExame(req, res) {
        const { Movexa } = Database.getModels(req.database);
            const {
                postos,
                exames,
                dataini,
                datafim,
                chkfmnc,
                consideraExamesInclusos,
                modelo,
            } = req.body;

        try {

            let select = `
                SELECT
                    MOVEXA.POSTO,
                    POSTO.DESCRICAO AS DESCPOS,
                    ${modelo === 'data' ? 'MOVEXA.DTCOLETA,': ''}
                    EXAME.CODIGO,
                    EXAME.DESCRICAO,
                    CAST(SUM(COALESCE(MOVEXA.QTDEXAME,1)) as bigint) AS TOTEXA,
                    CAST(COUNT(DISTINCT(MOVPAC.ID)) as bigint) AS TOTPAC
                FROM MOVEXA
                    LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO
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
            MOVEXA.EXAME_ID IN (${exames}) AND
            MOVEXA.DTCOLETA BETWEEN '${periodo}' `

            select += where;

            let groupBy = '';
            let orderBy = '';

            if (modelo === 'data') {
                groupBy = ' GROUP BY MOVEXA.DTCOLETA, MOVEXA.POSTO , posto.descricao,EXAME.CODIGO,EXAME.DESCRICAO ';
                orderBy = '  ORDER BY  movexa.DTCOLETA, MOVEXA.POSTO, TOTEXA DESC ';
            }else {
                groupBy = ' GROUP BY MOVEXA.POSTO , posto.descricao,EXAME.CODIGO,EXAME.DESCRICAO ';
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

    async gerarRelatorioPostoExame(req, res) {

        const { dados, dataini, datafim, profile, logo, color } = req.body;
        try {
            const dadosDePostoExame = [];
            if (dados.modelo === 'data') {
                dados.exames.forEach(dado => {
                    let achou = false;
                    const dataFormatada = format(parseISO(dado.dtcoleta), 'dd/MM/yyyy');
                    dadosDePostoExame.forEach(dadoDePostoExame => {
                        if (dataFormatada === dadoDePostoExame.data){
                            achou = true;
                            const temPosto = dadoDePostoExame.postos.find(d => d.codigo === dado.posto);
                            if (temPosto) {
                                const indiceDoPosto = dadoDePostoExame.postos.findIndex(i => i.codigo === temPosto.codigo);
                                dadoDePostoExame.postos[indiceDoPosto].exames.push({
                                    dataDeColeta: dataFormatada,
                                    codigo: dado.codigo,
                                    descricao: dado.descricao,
                                    quantidade: parseInt(dado.totexa)
                                });

                                dadoDePostoExame.totalDeExamesDoDia += parseInt(dado.totexa);
                                dadoDePostoExame.postos[indiceDoPosto].totalDeExames += parseInt(dado.totexa);
                            }
                            else {
                                dadoDePostoExame.postos.push({
                                    nome: dado.descpos,
                                    codigo: dado.posto,
                                    totalDeExames: parseInt(dado.totexa),
                                    exames: [
                                        {
                                            dataDeColeta: dataFormatada,
                                            codigo: dado.codigo,
                                            descricao: dado.descricao,
                                            quantidade: parseInt(dado.totexa)
                                        }
                                    ]
                                });
                                dadoDePostoExame.totalDeExamesDoDia += parseInt(dado.totexa);
                            }
                        }
                    });
                    if (!achou) {
                        dadosDePostoExame.push({
                            data: dataFormatada,
                            totalDeExamesDoDia: parseInt(dado.totexa),
                            postos: [
                                {
                                  nome: dado.descpos,
                                  codigo: dado.posto,
                                  totalDeExames: parseInt(dado.totexa),
                                  exames: [
                                      {
                                          dataDeColeta: dataFormatada,
                                          codigo: dado.codigo,
                                          descricao: dado.descricao,
                                          quantidade: parseInt(dado.totexa)
                                      }
                                  ]
                                }
                            ]
                        });
                    }
                });

                dadosDePostoExame.sort((a, b) => new Date(a.dataDeColeta) - new Date(b.dataDeColeta));

            }else {
                dados.exames.forEach(dado => {
                    let achou = false;
                    dadosDePostoExame.forEach(dadoDePostoExame => {
                        if (dado.posto === dadoDePostoExame.codigo) {
                            achou = true;
                            dadoDePostoExame.exames.push(
                                {
                                    codigo: dado.codigo,
                                    descricao: dado.descricao,
                                    quantidade: parseInt(dado.totexa)
                                }
                            );

                            dadoDePostoExame.totalDeExames += parseInt(dado.totexa);
                        }
                    });
                    if (!achou) {
                        dadosDePostoExame.push({
                            totalDeExames: parseInt(dado.totexa),
                            nome: dado.descpos,
                            codigo: dado.posto,
                            exames: [
                                {
                                    codigo: dado.codigo,
                                    descricao: dado.descricao,
                                    quantidade: parseInt(dado.totexa)
                                }
                            ],
                        })
                    }
                });
            }

            const dadosDePostoExameMaisTotaisDeExames = {
                dadosDePostoExame,
                totalDeExamesGeral: 0
            }

            if (dados.modelo === 'data') {
            dadosDePostoExame.forEach(d => dadosDePostoExameMaisTotaisDeExames.totalDeExamesGeral += d.totalDeExamesDoDia);
            }
            else {
            dadosDePostoExame.forEach(d => dadosDePostoExameMaisTotaisDeExames.totalDeExamesGeral += d.totalDeExames);
            }

            const html = await gerarRelatorioHtml({
                model: `/estatisticas/postoexame/${dados.modelo === 'data' ? 'data': 'geral'}`,
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

    async estatisticaDash(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            const datainicial = new Date(
                new Date().setDate(new Date().getDate() - 7)
            );
            const dia =
                datainicial.getDate() >= 10
                    ? datainicial.getDate()
                    : `0${datainicial.getDate()}`;
            const mes =
                datainicial.getMonth() + 1 >= 10
                    ? datainicial.getMonth() + 1
                    : `0${datainicial.getMonth() + 1}`;
            const ano = datainicial.getFullYear();

            const datafinal = new Date();
            const diaf =
                datafinal.getDate() >= 10
                    ? datafinal.getDate()
                    : `0${datafinal.getDate()}`;
            const mesf =
                datafinal.getMonth() + 1 >= 10
                    ? datafinal.getMonth() + 1
                    : `0${datafinal.getMonth() + 1}`;
            const anof = datafinal.getFullYear();

            const dataf = `${dia}/${mes}/${ano}' and '${diaf}/${mesf}/${anof}`;

            let select = '';
            select = ` select trim(coalesce(posto.descricao,'')) as name, cast(count(movexa.id) as int) as Exames from movexa left join posto on posto.codigo = movexa.posto where MOVEXA.DTCOLETA BETWEEN '${dataf}' and MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' group by posto.descricao order by Exames desc `;

            const parametros = await Movexa.sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(parametros);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async movimentodiario(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            const {
                posto,
                convenio,
                dataini,
                datafim,
                chkfmnc,
                chkentrega,
                chkentrada,
            } = req.query;

            const datainicial = new Date(dataini);
            const dia =
                datainicial.getDate() >= 10
                    ? datainicial.getDate()
                    : `0${datainicial.getDate()}`;
            const mes =
                datainicial.getMonth() + 1 >= 10
                    ? datainicial.getMonth() + 1
                    : `0${datainicial.getMonth() + 1}`;
            const ano = datainicial.getFullYear();

            const datafinal = new Date(datafim);
            const diaf =
                datafinal.getDate() >= 10
                    ? datafinal.getDate()
                    : `0${datafinal.getDate()}`;
            const mesf =
                datafinal.getMonth() + 1 >= 10
                    ? datafinal.getMonth() + 1
                    : `0${datafinal.getMonth() + 1}`;
            const anof = datafinal.getFullYear();

            const dataf = `${dia}/${mes}/${ano}' and '${diaf}/${mesf}/${anof}`;

            let select = '';

            switch (true) {
                case posto.length > 0 && convenio.length === 0:
                    select = `SELECT DISTINCT(MOVPAC.ID) AS ID, MOVPAC.POSTO,MOVPAC.AMOSTRA,MOVPAC.DATAENTRA,MOVPAC.HORAENTRA,MOVPAC.DTENTREGA,MOVPAC.IDADE,PRONTUARIO.SEXO,trim(coalesce(PRONTUARIO.NOME,'')) AS NOMEPAC, trim(coalesce(POSTO.DESCRICAO,'')) AS DESCPOS, MOVEXA.CONVENIO_ID, trim(coalesce(CONVENIO.FANTASIA,'')) AS DESCCONV FROM MOVPAC LEFT JOIN MOVEXA ON MOVEXA.MOVPAC_ID = MOVPAC.ID LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO where movpac.posto in (${posto}) and `;
                    break;
                case posto.length > 0 && convenio.length > 0:
                    select = `SELECT DISTINCT(MOVPAC.ID) AS ID, MOVPAC.POSTO,MOVPAC.AMOSTRA,MOVPAC.DATAENTRA,MOVPAC.HORAENTRA,MOVPAC.DTENTREGA,MOVPAC.IDADE,PRONTUARIO.SEXO,trim(coalesce(PRONTUARIO.NOME,'')) AS NOMEPAC, trim(coalesce(POSTO.DESCRICAO,'')) AS DESCPOS, MOVEXA.CONVENIO_ID, trim(coalesce(CONVENIO.FANTASIA,'')) AS DESCCONV FROM MOVPAC LEFT JOIN MOVEXA ON MOVEXA.MOVPAC_ID = MOVPAC.ID LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO where movpac.posto in (${posto}) and movexa.convenio_id in (${convenio}) and `;
                    break;
                case posto.length === 0 && convenio.length > 0:
                    select = `SELECT DISTINCT(MOVPAC.ID) AS ID, MOVPAC.POSTO,MOVPAC.AMOSTRA,MOVPAC.DATAENTRA,MOVPAC.HORAENTRA,MOVPAC.DTENTREGA,MOVPAC.IDADE,PRONTUARIO.SEXO,trim(coalesce(PRONTUARIO.NOME,'')) AS NOMEPAC, trim(coalesce(POSTO.DESCRICAO,'')) AS DESCPOS, MOVEXA.CONVENIO_ID, trim(coalesce(CONVENIO.FANTASIA,'')) AS DESCCONV FROM MOVPAC LEFT JOIN MOVEXA ON MOVEXA.MOVPAC_ID = MOVPAC.ID LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO where movexa.convenio_id in (${convenio}) and `;
                    break;
                default:
                    select = `SELECT DISTINCT(MOVPAC.ID) AS ID, MOVPAC.POSTO,MOVPAC.AMOSTRA,MOVPAC.DATAENTRA,MOVPAC.HORAENTRA,MOVPAC.DTENTREGA,MOVPAC.IDADE,PRONTUARIO.SEXO,trim(coalesce(PRONTUARIO.NOME,'')) AS NOMEPAC, trim(coalesce(POSTO.DESCRICAO,'')) AS DESCPOS, MOVEXA.CONVENIO_ID, trim(coalesce(CONVENIO.FANTASIA,'')) AS DESCCONV FROM MOVPAC LEFT JOIN MOVEXA ON MOVEXA.MOVPAC_ID = MOVPAC.ID LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID LEFT JOIN POSTO ON POSTO.CODIGO = MOVPAC.POSTO where `;
                    break;
            }

            switch (true) {
                case chkentrega === '1':
                    select += ` MOVPAC.DTENTREGA BETWEEN '${dataf}' `;
                    break;
                case chkentrada === '1':
                    select += ` MOVPAC.DATAENTRA BETWEEN '${dataf}' `;
                    break;
                default:
                    select += ` MOVEXA.DTCOLETA BETWEEN '${dataf}' `;
                    break;
            }

            if (chkfmnc === '1') {
                select += ` and MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC'`;
            }

            switch (true) {
                case chkentrega === '1':
                    select += ` ORDER BY MOVPAC.POSTO, MOVPAC.AMOSTRA, MOVEXA.CONVENIO_ID, MOVPAC.DTENTREGA `;
                    break;
                case chkentrada === '1':
                    select += `ORDER BY MOVPAC.POSTO, MOVPAC.AMOSTRA, MOVEXA.CONVENIO_ID, MOVPAC.DATAENTRA `;
                    break;
                default:
                    select += ` ORDER BY MOVPAC.POSTO, MOVPAC.AMOSTRA, MOVEXA.CONVENIO_ID `;
                    break;
            }

            const parametros = await Movexa.sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(parametros);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Posto"."codigo" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Posto"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Posto"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new PostoController();
