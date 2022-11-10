/* eslint-disable no-nested-ternary */
/* eslint-disable func-names */
/* eslint-disable no-plusplus */
import { QueryTypes } from 'sequelize';
import * as _ from 'lodash';
import ejs from 'ejs';
import { format, parseISO, subDays, differenceInHours, differenceInMinutes, addSeconds } from 'date-fns';
import path from 'path';
import Database from '../../../database';

export function convertDate(data) {
    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const yyyy = data.getFullYear();

    const dataAtual = `${yyyy}-${mm}-${dd}`;

    return dataAtual;
}

export function convertDateParseIso(data) {
    const getDate = new Date(data);
    const dia =
        getDate.getDate() >= 10 ? getDate.getDate() : `0${getDate.getDate()}`;
    const mes =
        getDate.getMonth() + 1 >= 10
            ? getDate.getMonth() + 1
            : `0${getDate.getMonth() + 1}`;
    const ano = getDate.getFullYear();

    return `${ano}-${mes}-${dia}`;
}

export async function PegaData(req, dt_banco) {
    const { Exame } = Database.getModels(req.database);

    if (dt_banco === '1') {
        const getDate = await Exame.sequelize
            .query(
                `
            SELECT CURRENT_TIMESTAMP(2)
            `,
                { type: QueryTypes.SELECT }
            )
            .catch(Exame.sequelize, err => {
                return err.message;
            });

        const timestamp = Object.keys(getDate[0])[0];

        return getDate[0][timestamp];
    }
    return new Date();
}

export async function PegaHora(req, dt_banco) {
    const { Exame } = Database.getModels(req.database);

    let fullDate;

    if (dt_banco === '1') {
        const getDate = await Exame.sequelize
            .query(
                `
            SELECT CURRENT_TIMESTAMP(2)
            `,
                { type: QueryTypes.SELECT }
            )
            .catch(Exame.sequelize, err => {
                return err.message;
            });

        const timestamp = Object.keys(getDate[0])[0];

        fullDate = getDate[0][timestamp];
    } else {
        fullDate = new Date();
    }

    const h = String(fullDate.getHours()).padStart(2, '0');
    const m = String(fullDate.getMinutes()).padStart(2, '0');
    // const s = String(fullDate.getSeconds()).padStart(2, '0');
    // return `${h}:${m}:${s}`;

    return `${h}:${m}`;
}

export async function calculaDiasMovpacPorParametro(req) {
    const { Param } = Database.getModels(req.database);

    const getParam = await Param.sequelize
        .query(`select traz_data, dias from param`, {
            type: QueryTypes.SELECT,
        });

    let date = null;
    let dias = 7;
    if (getParam.length > 0) {
        if (getParam[0].traz_data === '1' && getParam[0].dias > 0) {
            dias = Number(getParam[0].dias);
        }
    }

    return date = format(subDays(new Date(), dias), 'dd/MM/yyyy');
}

export function DOW(data) {
    const getData = new Date(data);
    const getWeekday = getData.getDay();
    const weekday = getWeekday + 1;

    return weekday;
}

export function addDias(data, dias) {
    const result = new Date();
    result.setDate(data.getDate() + dias);
    return result;
}

export async function DataFeriado(req, data) {
    const { Exame } = Database.getModels(req.database);

    const dd = String(data.getDate()).padStart(2, '0');
    const mm = String(data.getMonth() + 1).padStart(2, '0');

    const dataAtual = `${dd}/${mm}`;

    const getCurfer = await Exame.sequelize
        .query(
            `
            SELECT DATA FROM FERIADO WHERE DATA = '${dataAtual}'
            `,
            { type: QueryTypes.SELECT }
        )
        .catch(Exame.sequelize, err => {
            return err.message;
        });

    const curfer = getCurfer[0];

    if (!curfer) {
        return false;
    }
    return true;
}

export async function DataEnt(data, exame_id, hora, urgenteexm, req) {
    const { Exame } = Database.getModels(req.database);

    const getCurrot = await Exame.sequelize
        .query(
            `
            SELECT
            EXAME.ROTURG_ID,
            A.QTDIAS  AS QTDIAS_NOR,
            A.QTHORAS AS QTHORAS_NOR,
            A.SEGUNDA AS SEGUNDA_NOR,
            A.TERCA   AS TERCA_NOR,
            A.QUARTA  AS QUARTA_NOR,
            A.QUINTA  AS QUINTA_NOR,
            A.SEXTA   AS SEXTA_NOR,
            A.SABADO  AS SABADO_NOR,
            A.DOMINGO AS DOMINGO_NOR,
            A.FERIADO AS FERIADO_NOR,
            B.QTDIAS  AS QTDIAS_URG,
            B.QTHORAS AS QTHORAS_URG,
            B.SEGUNDA AS SEGUNDA_URG,
            B.TERCA   AS TERCA_URG,
            B.QUARTA  AS QUARTA_URG,
            B.QUINTA  AS QUINTA_URG,
            B.SEXTA   AS SEXTA_URG,
            B.SABADO  AS SABADO_URG,
            B.DOMINGO AS DOMINGO_URG,
            B.FERIADO AS FERIADO_URG
            FROM EXAME
            LEFT JOIN ROTINA A ON A.ID = EXAME.ROTNOR_ID
            LEFT JOIN ROTINA B ON B.ID = EXAME.ROTURG_ID
            WHERE EXAME.ID = ${exame_id}
            `,
            { type: QueryTypes.SELECT }
        )
        .catch(Exame.sequelize, err => {
            return err.message;
        });

    const currot = getCurrot[0];

    let m;

    if (urgenteexm === '1' && currot.roturg_id) {
        m = {
            qtdias: !currot.qtdias_urg ? 0 : currot.qtdias_urg,
            qthoras: !currot.qthoras_urg ? '00:00' : currot.qthoras_urg,
            day1: !currot.domingo_urg ? 1 : currot.domingo_urg,
            day2: !currot.segunda_urg ? 1 : currot.segunda_urg,
            day3: !currot.terca_urg ? 1 : currot.terca_urg,
            day4: !currot.quarta_urg ? 1 : currot.quarta_urg,
            day5: !currot.quinta_urg ? 1 : currot.quinta_urg,
            day6: !currot.sexta_urg ? 1 : currot.sexta_urg,
            day7: !currot.sabado_urg ? 1 : currot.sabado_urg,
            feriado: !currot.feriado_urg ? 1 : currot.feriado_urg,
        };
    } else {
        m = {
            qtdias: !currot.qtdias_nor ? 0 : currot.qtdias_nor,
            qthoras: !currot.qthoras_nor ? '00:00' : currot.qthoras_nor,
            day1: !currot.domingo_nor ? 1 : currot.domingo_nor,
            day2: !currot.segunda_nor ? 1 : currot.segunda_nor,
            day3: !currot.terca_nor ? 1 : currot.terca_nor,
            day4: !currot.quarta_nor ? 1 : currot.quarta_nor,
            day5: !currot.quinta_nor ? 1 : currot.quinta_nor,
            day6: !currot.sexta_nor ? 1 : currot.sexta_nor,
            day7: !currot.sabado_nor ? 1 : currot.sabado_nor,
            feriado: !currot.feriado_nor ? 1 : currot.feriado_nor,
        };
    }

    m.contadia = -1;
    m.qtdias -= 1;
    m.dias = 0;

    if (hora > m.qthoras) {
        m.qtdias += 1;
    }

    do {
        m.dataconta = addDias(data, m.dias);
        m.dia = `day${DOW(m.dataconta)}`;

        const dia = m[m.dia];

        if (dia === '2' || dia === '3') {
            /* eslint-disable no-await-in-loop */
            const feriado = await DataFeriado(req, m.dataconta);
            if (feriado === false) {
                m.contadia += 1;
            } else if (m.feriado === '2' || m.feriado === '3') {
                m.contadia += 1;
            }
        }
        m.dias += 1;
    } while (m.contadia < m.qtdias && m.dias < 365);

    m.dataconta = addDias(data, m.dias);
    m.dia = `day${DOW(m.dataconta)}`;

    let dia = m[m.dia];
    const feriado = await DataFeriado(req, m.dataconta);

    if (dia === '3' || feriado === true || dia === '1') {
        do {
            m.dataconta = addDias(data, m.dias);
            m.dia = `day${DOW(m.dataconta)}`;
            const novoFeriado = await DataFeriado(req, m.dataconta);
            dia = m[m.dia];

            if (novoFeriado === false) {
                if (dia === '2') {
                    break;
                }
            } else if (m.feriado === '2' || m.feriado === '3') {
                if (dia === '2') {
                    break;
                }
            }
            m.dias += 1;
        } while (m.dias < 365);
    }

    if (m.dias >= 365) {
        m.dias = 0;
    }

    const finalDate = convertDate(addDias(data, m.dias));

    return finalDate;
}

export function transhora(tempo1, proc_seg1) {
    const time = tempo1.split(':');
    const horas1 = Number(time[0]);
    const minutos1 = Number(time[1]);
    let segundos1;

    if (proc_seg1) {
        segundos1 = Number(time[2]);
    } else {
        segundos1 = 0;
    }

    const calc = (horas1 * 60 + minutos1) * 60 + segundos1;
    return calc;
}

export function retornahora(calcsegundos) {
    const lnSegundos = calcsegundos;
    // const calc_minutos = lnSegundos / 3600;
    // const horas = lnSegundos / 3600;
    // const minutos =
    //     calc_minutos > 0 ? lnSegundos / 3600 - 60 * horas : lnSegundos / 60;
    const h = Math.floor(lnSegundos / 3600);
    const m = Math.floor((lnSegundos % 3600) / 60);

    return `${h
        .toString()
        .substring(2, 0)
        .padStart(2, '0')}:${m
        .toString()
        .substring(2, 0)
        .padStart(2, '0')}`;
}

export async function fimCaixa(
    req,
    dataini,
    datafin,
    stringpos,
    cur_caixa1,
    cur_caixa,
    filtracartao,
    option
) {
    let instrucaosql;
    let instrucaosql1;

    if (cur_caixa) {
        instrucaosql1 = ' (';
        instrucaosql1 += `caixa_id = `;
        for (let i = 0; i < cur_caixa.length; i++) {
            const element = cur_caixa[i];
            if (i === cur_caixa.length - 1) {
                instrucaosql1 += `${element.id}`;
            } else {
                instrucaosql1 += `${element.id} OR caixa_id = `;
            }
        }
        instrucaosql1 += ') GROUP BY 1 ';
    }

    if (cur_caixa) {
        instrucaosql = `
        SELECT
		CAST(7 as numeric(1,0)) AS TIPPAG,
		SUM(VALFOR) AS TOTPAG
		FROM CAIXA1
		LEFT JOIN CAIXA ON CAIXA.ID = CAIXA1.CAIXA_ID
		LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
		WHERE CAIXA1.TIPFOR = 1 AND
        `;

        instrucaosql += instrucaosql1;

        instrucaosql += `
        UNION ALL
		SELECT
		CAST(8 as numeric(1,0)) AS TIPPAG,
		SUM(VALFOR) AS TOTPAG
		FROM CAIXA1
		LEFT JOIN CAIXA ON CAIXA.ID = CAIXA1.CAIXA_ID
		LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
		WHERE CAIXA1.TIPFOR = 2 AND
        `;

        instrucaosql += instrucaosql1;

        instrucaosql += `
        UNION ALL
		SELECT
		TIPPAG,
		SUM(VALPAG) AS TOTPAG
		FROM MOVCAI
		LEFT JOIN CAIXA ON CAIXA.ID = MOVCAI.CAIXA_ID
		LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
        WHERE TIPPAG <> 4 AND
        `;

        if (filtracartao > 0) {
            instrucaosql += ` (MOVCAI.CARTAO_ID = ${filtracartao}) AND `;
        }

        instrucaosql += stringpos ? ` AND ${stringpos}` : '';
        instrucaosql += instrucaosql1;
        instrucaosql += ' ORDER BY 1';
    } else {
        instrucaosql = `
        SELECT
        CAIXA1.CAIXA_ID,
        CAST(7 as numeric(1,0)) AS TIPPAG,
        SUM(VALFOR) AS TOTPAG,
        CAIXA.SITCAI,
        CAIXA.DATCAI,
        OPERADOR.NOME,
        0.00 AS DESCPERC,
        0.00 AS DESCVAL
        FROM CAIXA1
        LEFT JOIN CAIXA ON CAIXA.ID = CAIXA1.CAIXA_ID
        LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
        WHERE CAIXA1.TIPFOR = 1 AND
        (CAIXA.DATCAI BETWEEN '${dataini}' AND '${datafin}' )
        GROUP BY CAIXA1.CAIXA_ID,CAIXA.SITCAI,CAIXA.DATCAI,OPERADOR.NOME
        UNION ALL
        SELECT
        CAIXA1.CAIXA_ID,
        CAST(8 as numeric(1,0)) AS TIPPAG,
        SUM(VALFOR) AS TOTPAG,
        CAIXA.SITCAI,
        CAIXA.DATCAI,
        OPERADOR.NOME,
        0.00 AS DESCPERC,
        0.00 AS DESCVAL
        FROM CAIXA1
        LEFT JOIN CAIXA ON CAIXA.ID = CAIXA1.CAIXA_ID
        LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
        WHERE CAIXA1.TIPFOR = 2
        AND	(CAIXA.DATCAI BETWEEN '${dataini}' AND '${datafin}' )
        GROUP BY CAIXA1.CAIXA_ID,CAIXA.SITCAI,CAIXA.DATCAI,OPERADOR.NOME
        UNION ALL
        SELECT
        MOVCAI.CAIXA_ID,
        MOVCAI.TIPPAG,
        SUM(MOVCAI.VALPAG) AS TOTPAG,
        CAIXA.SITCAI,
        CAIXA.DATCAI,
        OPERADOR.NOME,
        SUM(MOVPAC.DESCPERC)/100 AS DESCPERC,
        SUM(MOVPAC.DESCVAL) AS DESCVAL
        FROM MOVCAI
        LEFT JOIN CAIXA ON CAIXA.ID = MOVCAI.CAIXA_ID
        LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
        LEFT JOIN MOVPAC ON MOVPAC.ID = MOVCAI.MOVPAC_ID
        WHERE TIPPAG <> 4
        `;

        instrucaosql += stringpos ? ` AND ${stringpos}` : '';
        instrucaosql += ` AND (CAIXA.DATCAI BETWEEN '${dataini}' AND '${datafin}' )`;

        if (filtracartao > 0) {
            instrucaosql += ` AND (MOVCAI.CARTAO_ID = ${filtracartao})`;
        }
        instrucaosql +=
            ' GROUP BY CAIXA_ID,2,CAIXA.SITCAI,CAIXA.DATCAI,OPERADOR.NOME';
        instrucaosql += ' ORDER BY CAIXA_ID,2';
    }

    const sequelize = Database.instances[req.database];

    const curcai = await sequelize
        .query(instrucaosql, { type: QueryTypes.SELECT })
        .catch(sequelize, err => {
            return err.message;
        });

    if (option === '2' || option === '5') {
        const fimcai = {
            entrada: 0,
            saida: 0,
            dinheiro: 0,
            ch_vista: 0,
            ct_deb: 0,
            ct_cred: 0,
            ch_prazo: 0,
            outros: 0,
        };

        for (const item of curcai) {
            switch (item.tippag) {
                case '1':
                    fimcai.dinheiro = item.totpag ?? '0.00';
                    break;
                case '2':
                    fimcai.ch_vista = item.totpag ?? '0.00';
                    break;
                case '3':
                    fimcai.ct_cred = item.totpag ?? '0.00';
                    break;
                case '5':
                    fimcai.ct_deb = item.totpag ?? '0.00';
                    break;
                case '6':
                    fimcai.ch_prazo = item.totpag ?? '0.00';
                    break;
                case '7':
                    fimcai.entrada = item.totpag ?? '0.00';
                    break;
                case '8':
                    fimcai.saida = item.totpag ?? '0.00';
                    break;
                case '9':
                    fimcai.outros = item.totpag ?? '0.00';
                    break;
                default:
            }
        }

        const calc =
            parseFloat(fimcai.entrada) -
            parseFloat(fimcai.saida) +
            parseFloat(fimcai.dinheiro);

        fimcai.dinheiro = calc;

        return fimcai;
    }
    const fimcai = [];
    const curcai_byid = _.groupBy(curcai, 'caixa_id');

    _.forEach(curcai_byid, function(value) {
        const obj = {
            caixa_id: !cur_caixa ? value[0].caixa_id : null,
            nome: !cur_caixa ? value[0].nome : null,
            datcai: !cur_caixa
                ? format(parseISO(value[0].datcai), 'dd/MM/yyyy')
                : null,
            sitcai: !cur_caixa ? value[0].sitcai : null,
            entrada: 0,
            saida: 0,
            dinheiro: 0,
            ch_vista: 0,
            ct_deb: 0,
            ct_cred: 0,
            ch_prazo: 0,
            desconto: 0,
            outros: 0,
        };

        for (const item of value) {
            switch (item.tippag) {
                case '1':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.dinheiro = item.totpag ?? '0.00';
                    break;
                case '2':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.ch_vista = item.totpag ?? '0.00';
                    break;
                case '3':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.ct_cred = item.totpag;
                    break;
                case '5':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.ct_deb = item.totpag;
                    break;
                case '6':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.ch_prazo = item.totpag;
                    break;
                case '7':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.entrada = item.totpag;
                    break;
                case '8':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.saida = item.totpag;
                    break;
                case '9':
                    obj.desconto = !cur_caixa
                        ? (
                              parseFloat(item.totpag * item.descperc) +
                              parseFloat(item.descval)
                          ).toFixed(2)
                        : null;
                    obj.outros = item.totpag;
                    break;
                default:
            }
        }

        fimcai.push(obj);
    });

    fimcai.map(x => {
        const calc =
            parseFloat(x.entrada) -
            parseFloat(x.saida) +
            parseFloat(x.dinheiro);
        x.dinheiro = calc.toFixed(2);
        return x;
    });

    return fimcai;
}

export async function fimCaixaPosto(
    req,
    dataini,
    datafin,
    stringpos,
    cur_caixa,
    tiprel
) {
    const totentradassaidas = {};
    totentradassaidas.totsaidas = 0;
    totentradassaidas.totentradas = 0;

    let instrucaosql;

    instrucaosql = `
    SELECT
    CAST(7 as numeric(1,0)) AS TIPPAG,
    SUM(VALFOR) AS TOTPAG
    FROM CAIXA1
    LEFT JOIN CAIXA ON CAIXA.ID = CAIXA1.CAIXA_ID
    LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
    WHERE CAIXA1.TIPFOR = 1
    AND (CAIXA.DATCAI BETWEEN '${dataini}' AND '${datafin}' )
    GROUP BY CAIXA.SITCAI, CAIXA.DATCAI
    UNION ALL
    SELECT
    CAST(8 as numeric(1,0)) AS TIPPAG,
    SUM(VALFOR) AS TOTPAG
    FROM CAIXA1
    LEFT JOIN CAIXA ON CAIXA.ID = CAIXA1.CAIXA_ID
    LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
    WHERE CAIXA1.TIPFOR = 2
    AND (CAIXA.DATCAI BETWEEN '${dataini}' AND '${datafin}' )
    GROUP BY CAIXA.SITCAI, CAIXA.DATCAI
    `;

    const sequelize = Database.instances[req.database];

    const curentsai = await sequelize
        .query(instrucaosql, { type: QueryTypes.SELECT })
        .catch(sequelize, err => {
            return err.message;
        });

    curentsai.map(item => {
        if (item.tippag === '8') {
            totentradassaidas.totsaidas += parseFloat(item.totpag);
        }
        if (item.tippag === '7') {
            totentradassaidas.totentradas += parseFloat(item.totpag);
        }
        return item;
    });

    instrucaosql = `
    SELECT
	CAIXA_ID,
	MOVCAI.POSTO,
	TIPPAG,
	SUM(VALPAG) AS TOTPAG,
	CAIXA.SITCAI,
	CAIXA.DATCAI,
	OPERADOR.NOME,
    POSTO.DESCRICAO
	FROM MOVCAI
    LEFT JOIN POSTO ON POSTO.CODIGO = MOVCAI.POSTO
	LEFT JOIN CAIXA ON CAIXA.ID = MOVCAI.CAIXA_ID
	LEFT JOIN OPERADOR ON OPERADOR.ID = CAIXA.OPERADOR_ID
	WHERE TIPPAG <> 4
        `;

    instrucaosql += stringpos ? ` AND ${stringpos}` : '';
    instrucaosql += ` AND (CAIXA.DATCAI BETWEEN '${dataini}' AND '${datafin}' )`;
    instrucaosql += ` GROUP BY CAIXA_ID,MOVCAI.POSTO,TIPPAG,CAIXA.SITCAI,CAIXA.DATCAI,OPERADOR.NOME,POSTO.DESCRICAO `;

    switch (tiprel) {
        case 1:
            instrucaosql += `ORDER BY CAIXA.DATCAI,MOVCAI.POSTO,CAIXA_ID,TIPPAG`;
            break;
        case 2:
            instrucaosql += `ORDER BY MOVCAI.POSTO, CAIXA.DATCAI, CAIXA_ID,TIPPAG`;
            break;
        default:
    }

    const curcai = await sequelize
        .query(instrucaosql, { type: QueryTypes.SELECT })
        .catch(sequelize, err => {
            return err.message;
        });

    curcai.map(item => {
        item.datcai = format(parseISO(item.datcai), 'dd/MM/yyyy');
        return item;
    });

    return { curcai, totentradassaidas };
}

export async function gerarRelatorioHtml(report) {
    const {
        color,
        size,
        model,
        logo,
        profile,
        startDate,
        endDate,
        data,
    } = report;

    const start = startDate ? format(parseISO(startDate), 'dd/MM/yyyy') : null;
    const end = endDate ? format(parseISO(endDate), 'dd/MM/yyyy') : null;
    const now = format(new Date(), 'dd/MM/yyyy HH:mm:ss');

    return new Promise((resolve, reject) => {
        ejs.renderFile(
            path.join(__dirname, '..', '..', '/reports', `${model}.ejs`),
            { color, size, start, end, now, logo, profile, data },
            (err, html) => {
                if (err) {
                    if (err.message.includes('no such file or directory')) {
                        err.message = `Arquivo "${model}.ejs" não encontrado.`;
                        return reject(err);
                    }
                    if (err.message.includes('Cannot read property')) {
                        err.message = `Campo de exibição não encontrado. Verifique o arquivo "${model}.ejs"`;
                        return reject(err);
                    }
                    return reject(err);
                }
                const modelType = model.substring(0, 9);
                if (modelType === 'mapagrade') {
                    return resolve({ html, data });
                }
                return resolve(html);
            }
        );
    });
}

export async function geraMapa(req, params) {
    const sequelize = Database.instances[req.database];
    const { Movexa } = Database.getModels(req.database);
    const {
        dataInicial,
        dataFinal,
        curgra,
        reimprime,
        posto,
        txthoraini,
        txthorafim,
        urgente,
        ordem,
        txtposto,
        txtamostra,
    } = params;
    const dataini = dataInicial;
    const datafin = dataFinal;
    const codgrade = curgra;
    const teste = false;
    const listaposto = posto.split(',');
    const hini = txthoraini;
    const hfin = txthorafim;
    const ordemimp = ordem;

    const curmapa = [];

    const instrucaoInicial = `
        SELECT
        movexa.movpac_id,
        movexa.posto,
        movexa.amostra,
        movexa.medico_id,
        prontuario.nome,
        gradeexa.exame_id,
        gradeexa.grade_id,
        gradeexa.ordem,
        gradeexa.bilirrubina,
        gradeexa.lipidograma,
        gradeexa.ttromboplastina,
        gradeexa.tprotrombina,
        gradeexa.coagulograma,
        grade.setor_id,
        grade.modelo,
        movexa.impgra,
        movexa.dtcoleta,
        prontuario.sexo,
        prontuario.data_nasc,
        prontuario.convenio_id,
        prontuario.fone1,
        movpac.idade,
        movpac.mes,
        movpac.dia,
        movpac.dataentra,
        movpac.horaentra,
        movpac.codigoctrl,
        movpac.dtentrega,
        movpac.envio_id,
        movpac.operador_id,
        grade.descricao as descgrade,
        setor.descricao as descsetor,
        posto.descricao as descposto,
        envio.descricao as descenvio,
        convenio.fantasia as descconv,
        operador.nome as operador,
        medico.nome_med as nomemed,
        movpac.obs, movpac.urgente,
        exame.codigo,
        exame.descricao,
        movexa.id,
        movpac.dum,
        movexa.triagem_seq from movexa
        left join gradeexa on gradeexa.exame_id = movexa.exame_id
        left join grade on grade.id = gradeexa.grade_id left join exame on exame.id = movexa.exame_id
        left join movpac on movpac.id = movexa.movpac_id
        left join prontuario on prontuario.id = movpac.prontuario_id
        left join setor on setor.id = grade.setor_id
        left join posto on posto.codigo = movexa.posto
        left join convenio on convenio.id = prontuario.convenio_id
        left join medico on medico.id = movexa.medico_id
        left join envio on envio.id = movpac.envio_id
        left join operador on operador.id = movpac.operador_id
    `;
    let instrucao1 = '';
    let instrucaosql = '';

    if (!teste) {
        if (reimprime) {
            instrucao1 += ` WHERE (movexa.dtcoleta between '${dataini}' and '${datafin}') AND IMPGRA = '1' AND`;
        } else {
            instrucao1 += ` WHERE (movexa.dtcoleta between '${dataini}' and '${datafin}') AND IMPGRA = '0' AND`;
        }

        if (txtposto !== '' && txtamostra !== '') {
            instrucao1 += ` movexa.posto = '${txtposto}' AND movexa.amostra = '${txtamostra}' `;
        } else {
            instrucao1 += ' (';

            if (listaposto.length > 0) {
                if (listaposto.length > 0) {
                    for (let i = 0; i < listaposto.length; i++) {
                        const element = listaposto[i];
                        if (i === listaposto.length - 1) {
                            instrucao1 += ` MOVEXA.POSTO = '${element}'`;
                        } else {
                            instrucao1 += ` MOVEXA.POSTO = '${element}' OR `;
                        }
                    }
                }
            }

            instrucao1 += ') ';
        }

        if (urgente) {
            instrucao1 += " AND ( MOVEXA.URGENTEEXM = '1' ) ";
        }

        if (hini !== '' && hfin !== '') {
            if (ordemimp === '5' || ordemimp === '6') {
                instrucao1 = `${instrucao1} AND ( MOVEXA.HRCOLETA BETWEEN '${hini}' AND '${hfin}' )`;
            } else {
                instrucao1 = `${instrucao1} AND ( MOVPAC.HORAENTRA BETWEEN '${hini}' AND '${hfin}' )`;
            }
        }

        instrucao1 += ' AND NOT GRADEEXA.GRADE_ID IS NULL ';

        instrucaosql = `
        AND (MOVEXA.STATUSEXM = 'TR' OR MOVEXA.STATUSEXM = 'ER')
        AND GRADEEXA.GRADE_ID = ${codgrade}
		GROUP BY MOVEXA.MOVPAC_ID,
        MOVEXA.POSTO,
        MOVEXA.AMOSTRA,
        PRONTUARIO.NOME,
        EXAME.DESCRICAO,
        GRADEEXA.EXAME_ID,
        GRADEEXA.GRADE_ID,
        GRADEEXA.ORDEM,
        GRADEEXA.BILIRRUBINA,
        GRADEEXA.LIPIDOGRAMA,
        GRADEEXA.TTROMBOPLASTINA,
        GRADEEXA.TPROTROMBINA,
        GRADEEXA.COAGULOGRAMA,
        GRADE.SETOR_ID,
        GRADE.MODELO,
        MOVEXA.DTCOLETA,
        MOVEXA.IMPGRA,
        PRONTUARIO.SEXO,
        MOVPAC.IDADE,
        MOVPAC.MES,
        MOVPAC.DIA,
        MOVPAC.HORAENTRA,
        MOVPAC.DATAENTRA,
        MOVPAC.DTENTREGA,
        GRADE.DESCRICAO,
        SETOR.DESCRICAO,
        POSTO.DESCRICAO,
        MOVPAC.OBS,
        MOVPAC.URGENTE,
        EXAME.CODIGO,
        EXAME.DESCRICAO,
        MOVPAC.DUM,
        MOVEXA.TRIAGEM_SEQ,
        MOVEXA.SEQ_TRIA_EXA,
        MOVEXA.ID,
        CONVENIO.FANTASIA,
        PRONTUARIO.DATA_NASC,
        PRONTUARIO.CONVENIO_ID,
        PRONTUARIO.FONE1,
        MOVPAC.CODIGOCTRL,
        MEDICO.NOME_MED,
        MOVPAC.ENVIO_ID,
        ENVIO.DESCRICAO,
        MOVPAC.OPERADOR_ID,
        OPERADOR.NOME
        `;

        switch (ordemimp) {
            case '1':
                instrucaosql +=
                    ' ORDER BY MOVEXA.POSTO, MOVEXA.MOVPAC_ID, GRADEEXA.ORDEM ';
                break;
            case '2':
                instrucaosql += ' ORDER BY MOVEXA.AMOSTRA, GRADEEXA.ORDEM ';
                break;
            case '3':
                instrucaosql +=
                    ' ORDER BY PRONTUARIO.NOME, MOVEXA.POSTO, MOVEXA.AMOSTRA, GRADEEXA.ORDEM ';
                break;
            case '4':
                instrucaosql +=
                    ' ORDER BY MOVEXA.POSTO, MOVEXA.AMOSTRA, GRADEEXA.ORDEM ';
                break;
            case '5':
                instrucaosql +=
                    ' ORDER BY MOVEXA.TRIAGEM_SEQ, MOVEXA.POSTO, MOVEXA.AMOSTRA, GRADEEXA.ORDEM ';
                break;
            case '6':
                instrucaosql +=
                    ' ORDER BY MOVEXA.SEQ_TRIA_EXA, MOVEXA.POSTO, MOVEXA.AMOSTRA, GRADEEXA.ORDEM ';
                break;
            default:
                instrucaosql +=
                    ' ORDER BY MOVEXA.POSTO, MOVEXA.MOVPAC_ID, GRADEEXA.ORDEM ';
                break;
        }

        const selectFinal = instrucaoInicial + instrucao1 + instrucaosql;

        const crmapagra = await sequelize
            .query(selectFinal, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });

        const newCrmapagra = _.chain(crmapagra)
            .groupBy('movpac_id')
            .value();

        const newArr = Object.keys(newCrmapagra);

        for (let i = 0; i < newArr.length; i++) {
            const movpac_id = newArr[i];
            const exa = newCrmapagra[movpac_id];

            let exames = '';
            const exam = [];
            let paciente = {};

            for (let index = 0; index < 40; index++) {
                const element = exa[index];
                exam.push({
                    id: element ? element.id : '',
                    exm: element ? element.codigo.trim() : '',
                    descricao: element ? element.descricao.trim() : '',
                    bilirrubina: element ? element.bilirrubina : '',
                    lipidograma: element ? element.lipidograma : '',
                    tprotrombina: element ? element.tprotrombina : '',
                    ttromboplastina: element ? element.ttromboplastina : '',
                    coagulograma: element ? element.coagulograma : '',
                });
                if (element && element.impgra === '0') {
                    await Movexa.sequelize
                        .query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${element.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'IMPRESSO MAPA DE TRABALHO TIPO GRADE STATUS: TR','${req.headers.host}')`
                        )
                        .catch(err => {
                            return { error: err.message };
                        });
                    await Movexa.sequelize
                        .query(
                            `UPDATE MOVEXA SET IMPGRA = '1' WHERE MOVEXA.ID = ${element.id}`
                        )
                        .catch(err => {
                            return { error: err.message };
                        });
                } else if (element && reimprime) {
                    await Movexa.sequelize
                        .query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${element.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'REIMPRESSÃO MAPA DE TRABALHO TIPO GRADE STATUS: TR','${req.headers.host}')`
                        )
                        .catch(err => {
                            return { error: err.message };
                        });
                }
                if (index === exa.length - 1) {
                    paciente = element;
                }
            }

            const select = `SELECT MOVPAC_ID, CODIGO, MOVEXA.IMPGRA, MOVEXA.STATUSEXM FROM MOVEXA LEFT JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID WHERE MOVPAC_ID = ${movpac_id}`;
            const curcod = await sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            // eslint-disable-next-line no-plusplus
            for (let index = 0; index < curcod.length; index++) {
                const element = curcod[index];
                if (index === curcod.length - 1) {
                    exames += element.codigo.trim();
                } else {
                    exames += `${element.codigo.trim()} | `;
                }
            }

            curmapa.push({
                movpac_id: paciente.movpac_id,
                codigoctrl: paciente.codigoctrl
                    ? paciente.codigoctrl.trim()
                    : '',
                posto: paciente.posto,
                amostra: paciente.amostra,
                nome: paciente.nome.trim(),
                sexo: paciente.sexo,
                idade: paciente.idade.trim(),
                mes: paciente.mes.trim(),
                dia: paciente.dia.trim(),
                data_nasc: paciente.data_nasc
                    ? format(parseISO(paciente.data_nasc), 'dd/MM/yyyy')
                    : '',
                dataentra: paciente.dataentra
                    ? format(parseISO(paciente.dataentra), 'dd/MM/yyyy')
                    : '',
                dtcoleta: paciente.dtcoleta
                    ? format(parseISO(paciente.dtcoleta), 'dd/MM/yyyy')
                    : '',
                dtentrega: paciente.dtentrega
                    ? format(parseISO(paciente.dtentrega), 'dd/MM/yyyy')
                    : '',
                horaentra: paciente.horaentra,
                descconv: paciente.descconv.trim(),
                descgrade: paciente.descgrade.trim(),
                descsetor: paciente.descsetor.trim(),
                descposto: paciente.descposto.trim(),
                descenvio: paciente.descenvio ? paciente.descenvio.trim() : '',
                medico: paciente.nomemed ? paciente.nomemed.trim() : '',
                operador: paciente.operador ? paciente.operador.trim() : '',
                obs: paciente.obs ? paciente.obs.trim() : '',
                telefone: paciente.fone1 ? paciente.fone1.trim() : '',
                urgente: paciente.urgente,
                dum: paciente.dum ? paciente.dum.trim() : '',
                triagem_seq: paciente.triagem_seq ? paciente.triagem_seq : '',
                impgra: paciente.impgra === '0' ? '1' : paciente.impgra,
                modelo_selecionado: paciente.modelo,
                bilirrubina: paciente.bilirrubina,
                lipidograma: paciente.lipidograma,
                exames,
                exam,
            });
        }
    }
    return curmapa;
}

export async function rastreaRep(
    req,
    acao,
    report,
    descrel,
    prontuario_id,
    movpac_id,
    movexa_id,
    orca_id
) {
    const sequelize = Database.instances[req.database];

    if (prontuario_id !== 'N') {
        prontuario_id = null;
    }

    if (movpac_id !== 'N') {
        movpac_id = null;
    }

    if (movexa_id !== 'N') {
        movexa_id = null;
    }

    if (orca_id !== 'N') {
        orca_id = null;
    }

    const instrucaosql = `
    INSERT
    INTO
    TAB_LOGREP
    (ID,
    ACAO,
    DATA,
    HORA,
    REPORT,
    DESCREL,
    OPERADOR_ID,
    PRONTUARIO_ID,
    MOVPAC_ID,
    MOVEXA_ID,
    ORCA_ID,
    MAQUINA)
    VALUES
    (nextval('tab_logrep_id_seq'),
    ${acao},
    cast(CURRENT_TIMESTAMP(2) as date),
    substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),
    '${report}',
    '${descrel}',
    ${req.userId},
    ${prontuario_id},
    ${movpac_id},
    ${movexa_id},
    ${orca_id},
    '${req.headers.host}')
    `;

    await sequelize
        .query(instrucaosql, {
            type: QueryTypes.SELECT,
        })
        .catch(sequelize, err => {
            return err.message;
        });
}

export async function rastreaWS(
    req,
    acao,
    prontuario_id,
    movpac_id,
    movexa_id,
    apoio,
    erro
) {
    const sequelize = Database.instances[req.database];

    if (typeof prontuario_id !== 'number') {
        prontuario_id = null;
    }

    if (typeof movpac_id !== 'number') {
        movpac_id = null;
    }

    if (typeof movexa_id !== 'number') {
        movexa_id = null;
    }

    if (typeof apoio !== 'number') {
        apoio = null;
    }

    if (typeof erro !== 'number') {
        erro = null;
    }

    const instrucaosql = `
    INSERT
          INTO
          TAB_LOGWS
          (ID,
          ACAO,
          DATA,
          HORA,
          OPERADOR_ID,
          PRONTUARIO_ID,
          MOVPAC_ID,
          MOVEXA_ID,
          APOIO,
          ERRO,
          MAQUINA)
          VALUES
          (nextval('tab_logws_id_seq'),
          '${acao}',
          cast(CURRENT_TIMESTAMP(2) as date),
          substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),
          ${req.userId},
          ${prontuario_id},
          ${movpac_id},
          ${movexa_id},
          ${apoio},
          ${erro},
          '${req.headers.host}')
    `;

    await sequelize
        .query(instrucaosql, {
            type: QueryTypes.SELECT,
        })
        .catch(sequelize, err => {
            return err.message;
        });
}

export async function calculaIdade(req, dataInicial, dataFinal) {
    const sequelize = Database.instances[req.database];

    const intervalo = await sequelize
        .query(`SELECT age('${dataFinal}', '${dataInicial}') AS IDADE`, {
            type: QueryTypes.SELECT,
        })
        .catch(sequelize, err => {
            return err.message;
        });
    return intervalo[0].idade;
}

export async function valorExa(
    req,
    plano_id,
    exame_id,
    tipo,
    reducaoAcrescimo = 1
) {
    if (
        isNaN(parseInt(reducaoAcrescimo, 10)) ||
        parseInt(reducaoAcrescimo, 10) === 0
    ) {
        reducaoAcrescimo = 1;
    } else {
        reducaoAcrescimo = parseInt(reducaoAcrescimo, 10);
    }

    const sequelize = Database.instances[req.database];

    const select = `
        SELECT
            PLANO.DESCRICAO,
            PLANO.ID AS PLANO_ID,
            EXAME.ID AS EXAME_ID,
            EXAME.CODIGO,
            EXAME.DESCRICAO,
            TABELA1.CODAMB,
            TABELA1.VALOREXA,
            TABELA1.VALORFILME,
            CONVENIO_ESPEC.VALORCH,
            (TABELA1.VALOREXA * PLANO.VALCH /100) * PLANO.PERCPAC AS VALORPAC,
            (TABELA1.VALOREXA * PLANO.VALCH/100) * PLANO.PERCCONV AS VALORCONV,
            (VALESPEC.VALOREXA/100) * VALESPEC.PERCCONV AS VALORCONVESP,
            (VALESPEC.VALOREXA/100) * VALESPEC.PERCPAC AS VALORPACESP,
            VALESPEC.CODAMB AS ESPECAMB,
            PLANO.VALCH,
            PLANO.PERCCONV,
            PLANO.PERCPAC,
            PLANO.FPERCPAC,
            PLANO.FPERCCONV,
            PLANO.VALFILME,
            PLANO.TIPOTAB,
            PLANO.BANDA_PORTE,
            PLANO.BANDA_UCO,
            TABELA1.PESO_PORTE,
            TABELA1.PESO_UCO,
            PORTE.VALOR AS VALORPORTE
        FROM PLANO
        LEFT JOIN TABELA1  ON TABELA1.TABELA_ID = PLANO.TABELA_ID
        LEFT JOIN EXAME    ON EXAME.ID = TABELA1.EXAME_ID
        LEFT JOIN PORTE    ON PORTE.ID = EXAME.PORTE_ID
        LEFT JOIN VALESPEC ON VALESPEC.EXAME_ID = TABELA1.EXAME_ID AND VALESPEC.PLANO_ID = PLANO.ID
        LEFT JOIN CONVENIO_ESPEC ON CONVENIO_ESPEC.PLANO_ID = PLANO.ID AND CONVENIO_ESPEC.ESPTAB_ID = EXAME.ESPTAB_ID
        WHERE PLANO.ID = ${plano_id}
            AND EXAME.ID = ${exame_id}
    `;

    const curpreco = await sequelize
        .query(select, {
            type: QueryTypes.SELECT,
        })
        .catch(sequelize, err => {
            throw new Error(err.message);
        });

    const validNumber = (x, y) => {
        return x ? (isNaN(parseFloat(x)) ? y : parseFloat(x)) : y;
    };

    const preco = { ...curpreco[0] };

    preco.valorch = validNumber(preco.valorch, 0);
    preco.valorexa = validNumber(preco.valorexa, 0);
    preco.valorconv = validNumber(preco.valorconv, 0);
    preco.percpac = validNumber(preco.percpac, 0);
    preco.percconv = validNumber(preco.percconv, 0);

    if (preco.valorch !== 0) {
        preco.valorpac =
            ((preco.valorexa * preco.valorch) / 100) * preco.percpac;
        preco.valorconv =
            ((preco.valorexa * preco.valorch) / 100) * preco.percconv;
    }

    switch (tipo.toUpperCase()) {
        case 'P':
            if (preco.tipotab === '2') {
                let calporte = 0;
                let calcuco = 0;
                let calcvalorexa = 0;

                preco.peso_porte = validNumber(preco.peso_porte, 0);
                preco.valorporte = validNumber(preco.valorporte, 0);
                preco.banda_porte = validNumber(preco.banda_porte, 0);
                preco.peso_uco = validNumber(preco.peso_uco, 0);
                preco.valch = validNumber(preco.valch, 0);
                preco.banda_uco = validNumber(preco.banda_uco, 0);

                calporte =
                    preco.peso_porte *
                    (preco.valorporte * (preco.banda_porte / 100));
                calcuco =
                    preco.peso_uco * (preco.valch * (preco.banda_uco / 100));

                calcvalorexa = calporte + calcuco;
                calcvalorexa = validNumber(
                    (calcvalorexa / 100) * preco.percpac,
                    0.0
                );
                return preco.valorpacesp === null
                    ? calcvalorexa
                    : preco.valorpacesp;
            }
            return preco.valorpacesp === null
                ? preco.valorpac
                : preco.valorpacesp;
        case 'C':
            if (preco.tipotab === '2') {
                let calporte = 0;
                let calcuco = 0;
                let calcvalorexa = 0;

                preco.peso_porte = validNumber(preco.peso_porte, 0);
                preco.valorporte = validNumber(preco.valorporte, 0);
                preco.banda_porte = validNumber(preco.banda_porte, 0);
                preco.peso_uco = validNumber(preco.peso_uco, 0);
                preco.valch = validNumber(preco.valch, 0);
                preco.banda_uco = validNumber(preco.banda_uco, 0);
                preco.percconv = validNumber(preco.percconv, 0);

                calporte =
                    preco.peso_porte *
                    (preco.valorporte * (preco.banda_porte / 100));
                calcuco =
                    preco.peso_uco * (preco.valch * (preco.banda_uco / 100));

                calcvalorexa = calporte + calcuco;
                calcvalorexa = validNumber(
                    (calcvalorexa / 100) * preco.percconv,
                    0.0
                );
                return preco.valorconvesp === null
                    ? calcvalorexa * reducaoAcrescimo
                    : preco.valorconvesp * reducaoAcrescimo;
            }
            return preco.valorconvesp === null
                ? preco.valorconv * reducaoAcrescimo
                : validNumber(preco.valorconvesp, 0) * reducaoAcrescimo;
        case 'A':
            return preco.especamb || preco.codamb;
        case 'V':
            return preco.valorexa;
        default:
            break;
    }
}

export async function procSQL(req, tabela, coluna, whereParam) {
    try {
        const sequelize = Database.instances[req.database];

        let where = ' WHERE ';
        const keys = Object.keys(whereParam);
        keys.map((key, index) => {
            if(index !== 0) where += ` AND `
            where += ` CAST(${key} AS TEXT) = '${whereParam[key]}' `
            return key;
        })

        const select = `
            SELECT
            ${coluna}
            FROM
            ${tabela}
            ${where}
        `;

        const result = await sequelize
            .query(select, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });

        return result[0][coluna];
    } catch (e) {
        return false;
    }
}

export async function geraId(req, nome_seq) {
    try {
        const sequelize = Database.instances[req.database];
        const result = await sequelize
            .query(`SELECT CAST(NEXTVAL('${nome_seq}') AS CHAR(13)) AS NEXTVAL`, {
                type: QueryTypes.SELECT,
            })
            .catch(sequelize, err => {
                return err.message;
            });
        return result[0].nextval.trim();
    } catch (e) {
        return false;
    }
}

export function rangerStringToObject(ranger) {
    try {
      const objs = [];
      if (ranger && ranger.length > 0) {
        const newRanger = [];
        const apenasEnter = ranger.indexOf('\r');
        const arr =
          apenasEnter === -1 ? ranger.split('\n') : ranger.split('\r\n');
        for (let i = 0; i < arr.length; i++) {
          const element = arr[i];
          if (element.toUpperCase() !== 'RESERVADO') {
            newRanger.push(element);
          }
        }

        let campoId = '0';
        for (let i = 0; i < newRanger.length; i += 4) {
          campoId++;
          const nMin = newRanger[i] === undefined ? '' : newRanger[i];
          const nMax = newRanger[i + 1] === undefined ? '' : newRanger[i + 1];
          const aMin = newRanger[i + 2] === undefined ? '' : newRanger[i + 2];
          const aMax = newRanger[i + 3] === undefined ? '' : newRanger[i + 3];
          const abMenor = newRanger[i + 2] === undefined ? '' : newRanger[i + 2];
          const abMaior = newRanger[i + 3] === undefined ? '' : newRanger[i + 3];
          objs.push({
            id: campoId.toString().padStart(3, '0'),
            nMin,
            nMax,
            aMin,
            aMax,
            abMenor,
            abMaior,
          });
        }
      }

      return objs;
    } catch (e) {
      return false;
    }
  }

  export function  stringToDecimalNumber(value){
    let number = value.toString();
    if (number !== '0.00') {
      const temVirgula = number.indexOf(',') !== -1;

      if (temVirgula) {
        number = number.replace(',', '.');
        return parseFloat(number);
      }

      const pegarPontos = number.split('.');
      const casasDecimais = pegarPontos[pegarPontos.length - 1].length;

      if (casasDecimais > 2) {
        if (casasDecimais <= 3) {
          number = number.replace('.', '');
          number += '.00';
        }
        number = parseFloat(number)
          .toFixed(2)
          .toString();
      }
    } else {
      number = '0.00';
    }

    return parseFloat(number);
  };

  export const modulo11c = matricula => {
    matricula = (matricula || '').trim();
    matricula = matricula.replace(/\D/g, '');
    const tamMatricula = matricula.length;
    const digito = matricula.substr(tamMatricula - 1);
    let retorno = false;
    let resto = 0;

    if (matricula) {
      let totalMatricula = 0;
      let multiplica = 2;
      let valorUltimo = 0;

      for (let i = 1; i <= tamMatricula; i++) {
        totalMatricula +=
          parseInt(matricula.substr(tamMatricula - i - 1, 1), 10) *
          multiplica;
        valorUltimo =
          parseInt(matricula.substr(tamMatricula - i - 1, 1), 10) *
          multiplica;
        multiplica += 1;

        if (multiplica === 10) {
          multiplica = 2;
        }
      }

      totalMatricula -= valorUltimo;
      resto = totalMatricula % 11;
      resto = 11 - resto;

      if (resto > 9) {
        resto = 0;
      }
    } else {
      resto = 99999;
    }

    if (resto === parseInt(digito, 10)) {
      retorno = true;
    } else {
      retorno = false;
    }

    return retorno;
};

export const checa_len_matricula = (
    matricula,
    convObject,
    retornaerro
  ) => {
    let satisfaz = false;
    if (
      matricula.trim().length ===
        parseInt(convObject.qtdchar || 0, 10) &&
      parseInt(convObject.qtdchar || 0, 10) !== 0
    ) {
      satisfaz = true;
    } else if (
      matricula.trim().length ===
        parseInt(convObject.qtdchar2 || 0, 10) &&
      parseInt(convObject.qtdchar2 || 0, 10) !== 0
    ) {
      satisfaz = true;
    } else if (
      matricula.trim().length ===
        parseInt(convObject.qtdchar3 || 0, 10) &&
      parseInt(convObject.qtdchar3 || 0, 10) !== 0
    ) {
      satisfaz = true;
    } else {
      satisfaz = false;
    }

    satisfaz =
      parseInt(convObject.qtdchar || 0, 10) +
        parseInt(convObject.qtdchar2 || 0, 10) +
        parseInt(convObject.qtdchar3 || 0, 10) ===
      0
        ? true
        : satisfaz;

    if (!satisfaz) {
      if (retornaerro) {
        const erro = `A Matricula desse paciente deve ter ${
          convObject.qtdchar
        } ${
          parseInt(convObject.qtdchar2, 10) !== 0
            ? ` ou ${convObject.qtdchar2}`
            : ''
        } ${
          parseInt(convObject.qtdchar3, 10) !== 0
            ? ` ou ${convObject.qtdchar3}`
            : ''
        } caracteres. Ela possui ${matricula.trim().length} caracteres`;

        return { status: false, erro };
      }
      return { status: false };
    }

    return { status: true };
};

export const verifica_cpf = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if(cpf.toString().length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var result = true;
    [9,10].forEach(function(j){
        var soma = 0, r;
        cpf.split(/(?=)/).splice(0,j).forEach(function(e, i){
            soma += parseInt(e) * ((j+2)-(i+1));
        });
        r = soma % 11;
        r = (r <2)?0:11-r;
        if(r != cpf.substring(j, j+1)) result = false;
    });

    return result;
}

export const estado_tiss = (uf = '') => {
    if(!uf || uf.toString().trim() === '') return false;
    uf = uf.toString().toUpperCase();

    const estado_tiss = {
      'RO': '11'  ,
      'AC': '12',
      'AM': '13',
      'RR': '14',
      'PA': '15',
      'AP': '16',
      'TO': '17',
      'MA': '21',
      'PI': '22',
      'CE': '23',
      'RN': '24',
      'PB': '25',
      'PE': '26',
      'AL': '27',
      'SE': '28',
      'BA': '29',
      'MG': '31',
      'ES': '32',
      'RJ': '33',
      'SP': '35',
      'PR': '41',
      'SC': '42',
      'RS': '43',
      'MS': '50',
      'MT': '51',
      'GO': '52',
      'DF': '53',
      'EX': '98'
    };

    return estado_tiss[uf];
}

export const convert_valor = (valor) => {
    if(!valor) return 0;
    const temVirgula = valor.toString().indexOf(',');
    if(temVirgula !== -1){
        return parseFloat(valor.toString().replace('.', '').replace(',', '.'));
    } else {
        return parseFloat(valor);
    }
}

export const calcularDiferencaEmHoras = (dataInicial, dataFinal, horaInicial, horaFinal) => {
    const dataInicialEmObjetoData = new Date(dataInicial);
    const yearInicial = dataInicialEmObjetoData.getFullYear();
    const monthInicial = dataInicialEmObjetoData.getMonth();
    const dayInicial = dataInicialEmObjetoData.getDate();

    const dataFinalEmObjetoData = new Date(dataFinal);
    const yearFinal = dataFinalEmObjetoData.getFullYear();
    const monthFinal = dataFinalEmObjetoData.getMonth();
    const dayFinal = dataFinalEmObjetoData.getDate();

    const primeiraHora = Number(horaInicial.slice(0,2));
    const primeiroMinuto = Number(horaInicial.slice(3));
    const segundaHora = Number(horaFinal.slice(0,2));
    const segundoMinuto = Number(horaFinal.slice(3));

        const minutosDeDiferenca = differenceInMinutes(
            new Date(
                yearFinal,
                monthFinal,
                dayFinal,
                segundaHora,
                segundoMinuto
            ),
            new Date(
                yearInicial,
                monthInicial,
                dayInicial,
                primeiraHora,
                primeiroMinuto
            ))

            const converter = (minutos) => {
                const horas = Math.floor(minutos/ 60);
                const min = minutos % 60;
                const textoHoras = (`00${horas}`).slice(-2);
                const textoMinutos = (`00${min}`).slice(-2);

                return `${textoHoras }:${textoMinutos}`;
              };

    return converter(minutosDeDiferenca);
}
