import { QueryTypes } from 'sequelize';
import * as _ from 'lodash';
import { format, parseISO } from 'date-fns';
import Database from '../../database';
import { convertDateParseIso, gerarRelatorioHtml } from './functions/functions';

class ExtratoBancarioController {
    async index(req, res) {
        const { dataInicial, dataFinal, contaId, contaDesc } = req.query;

        // ENTRADAS E SAÍDAS
        const select_curextratob = `
        SELECT
        FORNECEDOR.FANTASIA AS DESCRICAO,
        PAGAR.DATPAG,
        PAGAR.TIPPAG,
        PAGAR.PARCELA,
        PAGAR.NUMERODOC,
        PAGAR1.NUMCHE,
        (COALESCE(PAGAR1.VALPAG,0) + COALESCE(PAGAR1.JUROS,0) - COALESCE(PAGAR1.DESCONTO,0)) AS VALPAG,
        PAGAR1.CONTAS_ID,
        PAGAR.OBS,
        1 AS TIPO,
        VARCHAR '' AS SALDODIA,
        VARCHAR '' AS TOTREC,
        VARCHAR '' AS TOTPAG
        FROM PAGAR
        LEFT JOIN PAGAR1 ON PAGAR1.PAGAR_ID = PAGAR.ID
        LEFT JOIN FORNECEDOR ON FORNECEDOR.ID = PAGAR.FORNEC_ID
        WHERE PAGAR.DATPAG BETWEEN '${dataInicial}' and '${dataFinal}' and PAGAR1.CONTAS_ID = ${contaId} AND PAGAR.STATUS = 'FC' OR PAGAR.DATPAG BETWEEN '${dataInicial}' and '${dataFinal}' and PAGAR1.CONTAS_ID = ${contaId} AND PAGAR.STATUS = 'ES'
        union all
        SELECT
        CONVENIO.FANTASIA AS DESCRICAO,
        RECEBER.DATPAG,
        RECEBER.TIPPAG,
        RECEBER.PARCELA,
        RECEBER.NUMERODOC,
        RECEBER1.NUMCHE,
        (COALESCE(RECEBER1.VALPAG,0) + COALESCE(RECEBER.DESPT,0) + COALESCE(RECEBER1.JUROS,0) - COALESCE(RECEBER1.DESCONTO,0)) AS VALPAG,
        RECEBER1.CONTAS_ID,
        RECEBER.OBS,
        2 AS TIPO,
        VARCHAR '' AS SALDODIA,
        VARCHAR '' AS TOTREC,
        VARCHAR '' AS TOTPAG
        FROM RECEBER
        LEFT JOIN RECEBER1 ON RECEBER1.RECEBER_ID = RECEBER.ID
        LEFT JOIN CONVENIO ON CONVENIO.ID = RECEBER.SACADO_ID
        WHERE RECEBER.DATPAG BETWEEN '${dataInicial}' and '${dataFinal}' and RECEBER1.CONTAS_ID = ${contaId} AND RECEBER.STATUS = 'FC' OR RECEBER.DATPAG BETWEEN '${dataInicial}' and '${dataFinal}' and RECEBER1.CONTAS_ID = ${contaId} AND RECEBER.STATUS = 'ES' ORDER BY DATPAG
        `;

        const sequelize = Database.instances[req.database];

        const curextratob = await sequelize
            .query(select_curextratob, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });

        const select_movimentacoes = `
            SELECT
            CONTAS_ID,
            DATA,
            VALOR,
            CONTAS_ID,
            HISTORICO,
            TIPO
            FROM MOVIMENTACAO
            WHERE CONTAS_ID = ${contaId}
            AND DATA BETWEEN '${dataInicial}' and '${dataFinal}'
        `;

        // DEPÓSITOS E RETIRADAS
        const movimentacoes = await sequelize
            .query(select_movimentacoes, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });

        if (movimentacoes.length > 0) {
            movimentacoes.map(mov => {
                let item;
                if (mov.tipo === 'R') {
                    item = {
                        descricao: 'RETIRADA',
                        datpag: mov.data,
                        numerodoc: null,
                        numche: '',
                        valpag: mov.valor,
                        contas_id: mov.contas_id,
                        obs: mov.historico,
                        tipo: 1,
                    };
                } else {
                    item = {
                        descricao: 'DEPÓSITO',
                        datpag: mov.data,
                        numerodoc: null,
                        numche: '',
                        valpag: mov.valor,
                        contas_id: mov.contas_id,
                        obs: mov.historico,
                        tipo: 2,
                    };
                }
                return curextratob.push(item);
            });
        }

        // TRANSFÊRENCIAS REALIZADAS ENTRE CONTAS
        const select_curtransf = `
            SELECT
            FIELD,
            NEWVAL,
            OLDVAL,
            BO,
            BD,
            FORPAG,
            DATA
            FROM TAB_LOGREGF
            WHERE TABELA = 'TRANSF'
            AND (BO = '${contaDesc}' OR BD = '${contaDesc}')
            AND DATA BETWEEN '${dataInicial}' and '${dataFinal}'
        `;

        const curtransf = await sequelize
            .query(select_curtransf, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });

        if (curtransf.length > 0) {
            curtransf.map(transf => {
                let item;
                if (transf.bo === contaDesc) {
                    item = {
                        descricao: transf.field,
                        datpag: transf.data,
                        tippag: null,
                        numerodoc: null,
                        numche: transf.forpag || '',
                        valpag: transf.newval,
                        contas_id: null,
                        obs: `PARA ${transf.bd.trim()} - ${transf.oldval.trim()} - ${transf.oldval.trim()}`,
                        tipo: 1,
                    };
                } else if (transf.bd === contaDesc) {
                    item = {
                        descricao: transf.field,
                        datpag: transf.data,
                        tippag: null,
                        numerodoc: null,
                        numche: transf.forpag || '',
                        valpag: transf.newval,
                        contas_id: null,
                        obs: `DE ${transf.bo.trim()}`,
                        tipo: 2,
                    };
                }
                return curextratob.push(item);
            });
        }

        // TRATAMENTO DO SALDO ANTERIOR
        const select_curcontas = `
            SELECT CONTAS.id, CONTAS.agencia, CONTAS.limite, CONTAS.conta, BANCO.DESCRICAO
            FROM CONTAS LEFT JOIN BANCO ON BANCO.ID = CONTAS.BANCO_ID
            WHERE CONTAS.ID = ${contaId}
        `;

        let curcontas = await sequelize
            .query(select_curcontas, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });

        // eslint-disable-next-line prefer-destructuring
        curcontas = curcontas[0];
        curcontas.agencia = curcontas.agencia || '';
        curcontas.conta = curcontas.conta || '';
        curcontas.limite = curcontas.limite || 0;

        let totab = 0;
        let totfc = 0;
        let saldototal = 0;
        let saldoini = 0;

        // TRATAMENTO PARA MOSTRAR O SALDO DO PERIODO SELECIONADO E NAO O SALDO ATUAL
        let dataSoma = new Date(`${dataFinal} 00:00:00`);
        dataSoma.setDate(dataSoma.getDate() + 1);
        let today = new Date();
        dataSoma = convertDateParseIso(dataSoma);
        today = convertDateParseIso(today);

        if (dataSoma < today) {
            // RECEITAS
            const select_curtotrec = `
            SELECT
            SUM(RECEBER1.VALPAG + COALESCE(JUROS,0) - COALESCE(DESCONTO,0))+(SELECT SUM(CAST(REPLACE(NEWVAL,',','.') AS NUMERIC(15,2))) FROM TAB_LOGREGF WHERE BD = '${contaDesc}' AND DATA BETWEEN '${dataSoma}' AND '${today}') AS TOTREC
            FROM RECEBER
            LEFT JOIN RECEBER1 ON RECEBER1.RECEBER_ID = RECEBER.ID
            WHERE RECEBER.DATPAG BETWEEN '${dataSoma}' AND '${today}' AND RECEBER1.CONTAS_ID = ${contaId} AND RECEBER.STATUS = 'FC'
            OR RECEBER.DATPAG BETWEEN '${dataSoma}' and '${today}' and RECEBER1.CONTAS_ID = ${contaId} AND RECEBER.STATUS = 'ES'
            `;

            const curtotrec = await sequelize
                .query(select_curtotrec, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            saldototal =
                parseFloat(saldototal) - parseFloat(curtotrec.totrec || 0);

            // DESPESAS
            const select_curtotpag = `
            SELECT
            SUM(PAGAR1.VALPAG + COALESCE(JUROS,0) - COALESCE(DESCONTO,0))+(SELECT SUM(CAST(REPLACE(NEWVAL,',','.') AS NUMERIC(15,2))) FROM TAB_LOGREGF WHERE BO = '${contaDesc}' AND DATA BETWEEN '${dataSoma}' AND '${today}') AS TOTPAG
            FROM PAGAR
            LEFT JOIN PAGAR1 ON PAGAR1.PAGAR_ID = PAGAR.ID
            WHERE PAGAR.DATPAG BETWEEN '${dataSoma}' AND '${today}' AND PAGAR1.CONTAS_ID = ${contaId} AND PAGAR.STATUS = 'FC'
            OR PAGAR.DATPAG BETWEEN '${dataSoma}' and '${today}' and PAGAR1.CONTAS_ID = ${contaId} AND PAGAR.STATUS = 'ES'
            `;

            const curtotpag = await sequelize
                .query(select_curtotpag, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            saldototal =
                parseFloat(saldototal) + parseFloat(curtotpag.totpag || 0);
        }

        saldototal = parseFloat(saldototal) + parseFloat(curcontas.saldo || 0);

        curextratob.map(item => {
            if (item.tipo === 1) {
                saldototal =
                    parseFloat(saldototal) + parseFloat(item.valpag) || 0;
                item.saldodia = saldototal;
                totab += parseFloat(item.valpag || 0);
            } else {
                saldototal =
                    parseFloat(saldototal) - parseFloat(item.valpag || 0);
                item.saldodia = saldototal;
                totfc += parseFloat(item.valpag || 0);
            }
            return item;
        });

        saldoini += saldototal;

        curextratob.map(item => {
            if (item.tipo === 1) {
                saldototal -= parseFloat(item.valpag || 0);
                item.saldodia = saldototal;
            } else {
                saldototal += parseFloat(item.valpag || 0);
                item.saldodia = saldototal;
            }
            return item;
        });

        const curextratob_bydata = _.groupBy(curextratob, 'datpag');

        const extrato = [];

        // eslint-disable-next-line func-names
        _.forEach(curextratob_bydata, async function(value, key) {
            let totpag = 0;
            let totrec = 0;
            let saldodia = 0;

            _.forEach(value, item => {
                if (item.tipo === 1) {
                    totpag += parseFloat(item.valpag);
                } else {
                    totrec += parseFloat(item.valpag);
                }
                saldodia = item.saldodia;
                item.descricao = item.descricao.trim();

                switch (item.tippag) {
                    case '1':
                        item.tippag = 'Dinheiro';
                        break;
                    case '2':
                        item.tippag = 'Cartão Crédito';
                        break;
                    case '3':
                        item.tippag = 'Cartão DÉBITO';
                        break;
                    case '4':
                        item.tippag = 'Cob. Bancária';
                        break;
                    case '5':
                        item.tippag = 'Cheque a Vista';
                        break;
                    case '6':
                        item.tippag = 'Cheque a Prazo';
                        break;
                    case '7':
                        item.tippag = 'Pag. Online';
                        break;
                    case '8':
                        item.tippag = 'DOC';
                        break;
                    case '9':
                        item.tippag = 'TED';
                        break;
                    case '10':
                        item.tippag = 'Débito em Conta';
                        break;
                    case '11':
                        item.tippag = 'Depósito';
                        break;
                    default:
                        item.tippag = '';
                        break;
                }
                return item;
            });

            extrato.push({
                data: format(parseISO(key), 'dd/MM/yyyy'),
                transacoes: value,
                totpag,
                totrec,
                saldodia,
            });
        });

        const limite = parseFloat(curcontas.limite || 0);
        const limetesaldo = parseFloat(limite) + parseFloat(saldototal);

        const { dataReport } = req.body;

        dataReport.data = {
            curcontas,
            extrato,
            totab,
            totfc,
            limite,
            limetesaldo,
            saldototal,
            saldoini,
        };

        try {
            const reportHtml = await gerarRelatorioHtml(dataReport);
            return res.status(200).json(reportHtml);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new ExtratoBancarioController();
