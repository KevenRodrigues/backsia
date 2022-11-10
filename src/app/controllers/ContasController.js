import { QueryTypes } from 'sequelize';
import aws from 'aws-sdk';
import Database from '../../database';

import Mail from '../../lib/Mail';
import Queue from '../../lib/Queue';
import TesteMail from '../jobs/TesteMail';

const s3 = new aws.S3();

class ContasController {
    async index(req, res) {
        try {
            const { Contas, Banco, Motina, Cartao } = Database.getModels(
                req.database
            );
            const { page = 1, limit = 10 } = req.query;

            const order =
                req.query.sortby !== '' && req.query.sortby !== undefined
                    ? req.query.sortby
                    : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filters = req.query.filters
                ? JSON.parse(req.query.filters)
                : [];

            let where = '';
            if (filters.length > 0) {
                for (let i = 0; i < filters.length; i += 1) {
                    if (i > 0 && filters[i].value !== 'todos' && where)
                        where += ' AND ';

                    where += ContasController.handleFilters(
                        filters[i].id,
                        filters[i].value
                    );
                }
            } else {
                const filter =
                    req.query.filterid !== '' ? req.query.filterid : '';
                const filtervalue =
                    req.query.filtervalue !== '' ? req.query.filtervalue : '';
                where = ContasController.handleFilters(filter, filtervalue);
            }

            const fluxo = !!(
                req.query.fluxo !== undefined && req.query.fluxo !== ''
            );

            if (fluxo) {
                where += ' invest = 0 AND fluxo = 1 ';
            }

            const pagar = await Contas.findAll({
                order: Contas.sequelize.literal(`${order} ${orderdesc}`),
                where: Contas.sequelize.literal(where),

                attributes: [
                    'id',
                    'banco_id',
                    'status',
                    'saldo',
                    'limite',
                    [Contas.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Banco,
                        as: 'bancos',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Cartao,
                        as: 'cartao',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(pagar);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Contas, Banco, Motina, Cartao } = Database.getModels(
                req.database
            );
            const bankAccounts = await Contas.findOne({
                where: { id: req.params.id },
                attributes: [
                    'abertura',
                    'agencia',
                    'assunto',
                    'arquivo_licenca_key',
                    'arquivo_licenca_url',
                    'arquivo_logotipo_key',
                    'arquivo_logotipo_url',
                    'baixa',
                    'baixad',
                    'banco',
                    'banco_id',
                    'caixa',
                    'cartao_id',
                    'conta',
                    'codban',
                    'codigocedente',
                    'demonstrativo',
                    'demonstrativo1',
                    'demonstrativo2',
                    'emailc',
                    'figura_demonstrativa_key',
                    'figura_demonstrativa_url',
                    'fluxo',
                    'fimnn',
                    'inicionn',
                    'instrucai',
                    ['invest', 'investimento'],
                    'layout',
                    'limite',
                    'limitecc',
                    'nomec',
                    'nossonumero',
                    'protesto',
                    'percmulta',
                    'protes',
                    'percdia',
                    'saldo',
                    'seq',
                    'status',
                    'urlimages',
                    'urllogo',
                    'servidor',
                    'porta',
                    'usuario',
                ],
                include: [
                    {
                        model: Banco,
                        as: 'bancos',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Cartao,
                        as: 'cartao',
                        attributes: [['id', 'codigo'], 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!bankAccounts) {
                return res
                    .status(400)
                    .json({ error: 'Nenhuma conta bancária encontrada ' });
            }

            return res.status(200).json(bankAccounts);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexFluxoCaixa(req, res) {
        // req.query req.params req.body
        try {
            const sequelize = Database.instances[req.database];
            const { dataini, datafim } = req.query;

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

            const contas = await sequelize
                .query(
                    `
                        SELECT
                            -- SUM(PAGAR.VALOR) AS TOT,
                            PAGAR.VALOR AS TOT,
                            PAGAR.VENCIMENTO,
                            1 AS TIPO,
                            PAGAR1.CONTAS_ID
                        FROM PAGAR
                        LEFT JOIN PAGAR1 ON PAGAR1.PAGAR_ID = PAGAR.ID
                        WHERE PAGAR.STATUS = 'AB' AND PAGAR.VENCIMENTO BETWEEN '${dataf}'
                        -- GROUP BY PAGAR.VENCIMENTO, PAGAR1.CONTAS_ID
                        UNION ALL
                        SELECT
                            -- SUM(RECEBER.TOTPAGO + COALESCE(RECEBER.DESPT,0)) AS TOT,
                            RECEBER.TOTPAGO + COALESCE(RECEBER.DESPT,0) AS TOT,
                            RECEBER.VENCIMENTO,
                            2 AS TIPO,
                            RECEBER1.CONTAS_ID
                        FROM RECEBER
                        LEFT JOIN RECEBER1 ON RECEBER1.RECEBER_ID = RECEBER.ID
                        WHERE RECEBER.STATUS = 'AB' AND RECEBER.VENCIMENTO BETWEEN '${dataf}'
                        -- GROUP BY RECEBER.VENCIMENTO, RECEBER1.CONTAS_ID
                        ORDER BY VENCIMENTO ASC
                    `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(contas);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createOrUpdate(req, res) {
        try {
            const { Contas } = Database.getModels(req.database);
            const data = req.body;
            const tipoFluxo = data.fluxo ? 1 : 0;
            const tipoInvestimento = data.investimento ? 1 : 0;
            const tipoCaixa = data.caixa ? 1 : 0;
            const geraProtesto = data.protesto ? 1 : 0;
            const geraBaixa = data.baixad ? 1 : 0;

            if (data.id) {
                const bankAccountsExists = await Contas.findByPk(data.id).catch(
                    err => {
                        return res.status(400).json({ error: err.message });
                    }
                );

                if (!bankAccountsExists) {
                    return res.status(400).json({
                        error: `Conta Bancária com código ${data.id} não existe`,
                    });
                }

                const bankAccountsData = {
                    // Dados Bancários
                    cartao_id: data.cartao_id ? data.cartao_id.value : null,
                    limitecc: data.limitecc ? data.limitecc : null,
                    abertura: data.abertura ? data.abertura : null,
                    banco_id: data.banco_id ? data.banco_id.value : null,
                    agencia: data.agencia ? data.agencia : null,
                    limite: data.limite ? data.limite : null,
                    codban: data.codban ? data.codban : null,
                    conta: data.conta ? data.conta : null,
                    saldo: data.saldo ? data.saldo : null,
                    status: data.status,
                    fluxo: tipoFluxo,
                    caixa: tipoCaixa,
                    invest: tipoInvestimento,

                    // Boletos Bancários
                    nossonumero: data.nossonumero ? data.nossonumero : null,
                    layout: data.layout ? data.layout : null,
                    inicionn: data.inicionn ? data.inicionn : null,
                    fimnn: data.fimnn ? data.fimnn : null,
                    seq: data.seq ? data.seq : null,
                    codigocedente: data.codigocedente
                        ? data.codigocedente
                        : null,
                    banco: data.banco ? data.banco : null,
                    percmulta: data.percmulta ? data.percmulta : null,
                    protes: data.protes ? data.protes : null,
                    baixad: data.baixad ? data.baixad : null,
                    percdia: data.percdia ? data.percdia : null,
                    protesto: geraProtesto,
                    baixa: geraBaixa,
                    demonstrativo: data.demonstrativo
                        ? data.demonstrativo
                        : null,
                    demonstrativo1: data.demonstrativo1
                        ? data.demonstrativo1
                        : null,
                    demonstrativo2: data.demonstrativo2
                        ? data.demonstrativo2
                        : null,
                    instrucai: data.instrucai ? data.instrucai : null,
                    urlimages: data.urlimages ? data.urlimages : null,
                    urllogo: data.urllogo ? data.urllogo : null,
                    nomec: data.nomec ? data.nomec : null,
                    emailc: data.emailc ? data.emailc : null,
                    assunto: data.assunto ? data.assunto : null,

                    servidor: data.servidor ? data.servidor : null,
                    porta: data.porta ? data.porta : null,
                    usuario: data.usuario ? data.usuario : null,
                    senha: data.senha ? data.senha : null,
                };

                await Contas.sequelize
                    .transaction(async transaction => {
                        await Contas.update(bankAccountsData, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });

                return res.status(200).json(bankAccountsData);
            }

            const contasBancarias = {
                // Dados Bancários
                cartao_id: data.cartao_id ? data.cartao_id : null,
                limitecc: data.limitecc ? data.limitecc : null,
                abertura: data.abertura ? data.abertura : null,
                banco_id: data.banco_id ? data.banco_id : null,
                agencia: data.agencia ? data.agencia : null,
                limite: data.limite ? data.limite : null,
                codban: data.codban ? data.codban : null,
                conta: data.conta ? data.conta : null,
                saldo: data.saldo ? data.saldo : null,
                status: data.status,
                fluxo: tipoFluxo,
                caixa: tipoCaixa,
                invest: tipoInvestimento,

                // Boletos Bancários
                nossonumero: data.nossonumero ? data.nossonumero : null,
                layout: data.layout ? data.layout : null,
                inicionn: data.inicionn ? data.inicionn : null,
                fimnn: data.fimnn ? data.fimnn : null,
                seq: data.seq ? data.seq : null,
                codigocedente: data.codigocedente ? data.codigocedente : null,
                banco: data.banco ? data.banco : null,
                percmulta: data.percmulta ? data.percmulta : null,
                protes: data.protes ? data.protes : null,
                baixad: data.baixad ? data.baixad : null,
                percdia: data.percdia ? data.percdia : null,
                protesto: geraProtesto,
                baixa: geraBaixa,
                demonstrativo: data.demonstrativo ? data.demonstrativo : null,
                demonstrativo1: data.demonstrativo1
                    ? data.demonstrativo1
                    : null,
                demonstrativo2: data.demonstrativo2
                    ? data.demonstrativo2
                    : null,
                instrucai: data.instrucai ? data.instrucai : null,
                urlimages: data.urlimages ? data.urlimages : null,
                urllogo: data.urllogo ? data.urllogo : null,
                nomec: data.nomec ? data.nomec : null,
                emailc: data.emailc ? data.emailc : null,
                assunto: data.assunto ? data.assunto : null,

                servidor: data.servidor ? data.servidor : null,
                porta: data.porta ? data.porta : null,
                usuario: data.usuario ? data.usuario : null,
                senha: data.senha ? data.senha : null,
            };

            // Create a new bank Accounts;
            await Contas.create(contasBancarias);

            return res.status(200).json(contasBancarias);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Contas, Banco } = Database.getModels(req.database);

            await Contas.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res.status(200).json({
                            message: 'Conta Bancária deletada com sucesso.',
                        });
                    }
                    return res.status(400).json({
                        error: `Não foi possível deletar a Conta Bancária ${req.params.id}`,
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async saveFile(req, res) {
        try {
            const { Contas } = Database.getModels(req.database);
            const { key, Location: url } = req.file;
            const { inputName } = req.params;

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            let columnFile = {};

            if (inputName === 'arquivoLicenca') {
                columnFile = {
                    arquivo_licenca_key: key || '',
                    arquivo_licenca_url: newUrl || '',
                };
            } else if (inputName === 'arquivoLogotipo') {
                columnFile = {
                    arquivo_logotipo_key: key || '',
                    arquivo_logotipo_url: newUrl || '',
                };
            } else if (inputName === 'figuraDemonstrativa') {
                columnFile = {
                    figura_demonstrativa_key: key || '',
                    figura_demonstrativa_url: newUrl || '',
                };
            }

            await Contas.update(columnFile, {
                where: {
                    id: req.params.id,
                },
            });

            return res.status(200).json({
                key,
                url: newUrl,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async deleteFile(req, res) {
        try {
            const { Contas } = Database.getModels(req.database);
            const { key, inputName } = req.params;

            const params = { Bucket: 'sialab', Key: key };
            s3.deleteObject(params, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    return res
                        .status(200)
                        .json('Arquivo Excluído com sucesso!');
                }
            });

            let columnFile = {};

            if (inputName === 'arquivoLicenca') {
                columnFile = {
                    arquivo_licenca_key: null,
                    arquivo_licenca_url: null,
                };
            } else if (inputName === 'arquivoLogotipo') {
                columnFile = {
                    arquivo_logotipo_key: null,
                    arquivo_logotipo_url: null,
                };
            } else if (inputName === 'figuraDemonstrativa') {
                columnFile = {
                    figura_demonstrativa_key: null,
                    figura_demonstrativa_url: null,
                };
            }

            await Contas.update(columnFile, {
                where: {
                    id: req.params.id,
                },
            }).catch(err => {
                res.status(400).json({ error: err.message });
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async emailTest(req, res) {
        try {
            await Queue.add(TesteMail.key, {
                ...req.body,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json('email enviado com sucesso');
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'id':
                filter += ` CAST("Contas"."id" AS TEXT) ILIKE '${filterValue}%'`;
                break;
            case 'bancos.descricao':
                filter += ` (Unaccent(upper(trim(coalesce("bancos"."descricao",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`;
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Contas"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new ContasController();
