/* eslint-disable no-plusplus */
import { QueryTypes } from 'sequelize';
import Database from '../../../database';
import {
    gerarRelatorioHtml,
    rastreaRep,
} from '../../controllers/functions/functions';

const MgPadraoCod = async (
    req,
    res,
    { dataReport, curmapa, dataInicial, dataFinal, modelo_selecionado }
) => {
    const curmapaByPage = [];
    const { MapaGrade } = Database.getModels(req.database);
    const sequelize = Database.instances[req.database];
    let html = null;
    let movpac = [];
    let page = 1;

    const mapa_id = await sequelize
        .query(`select nextval('mapa_id_seq')`, {
            type: QueryTypes.SELECT,
        })
        .then(response => {
            return response[0].nextval;
        })
        .catch(sequelize, err => {
            return err.message;
        });

    let countRow = 0;
    const rowMax = 27;

    for (let i = 0; i < curmapa.length; i++) {
        const item = curmapa[i];
        const exam = [];
        let line = [];

        countRow += 2;

        for (let index = 0; index < 15; index++) {
            const element = item.exam[index];
            line.push({ ...element });
        }
        if (line.length > 0) {
            exam.push(line);
        }
        line = [];

        for (let index = 15; index < 30; index++) {
            const element = item.exam[index];
            if (index === 15) {
                if (element.exm === '') {
                    break;
                }
            }
            line.push({ ...element });
        }
        if (line.length > 0) {
            exam.push(line);
        }
        line = [];

        for (let index = 30; index < 39; index++) {
            const element = item.exam[index];
            if (index === 30) {
                if (element.exm === '') {
                    break;
                }
            }
            line.push({ ...element });
        }
        if (line.length > 0) {
            exam.push(line);
        }
        line = [];

        countRow += exam.length;

        if (countRow <= rowMax) {
            movpac.push({
                ...item,
                exam,
            });
            if (i === curmapa.length - 1) {
                curmapaByPage.push({
                    mapa_id,
                    page,
                    movpac,
                });
            }
        } else {
            curmapaByPage.push({
                mapa_id,
                page,
                movpac,
            });
            movpac = [];
            countRow = 2 + exam.length;
            movpac.push({
                ...item,
                exam,
            });
            page += 1;
            if (i === curmapa.length - 1) {
                curmapaByPage.push({
                    mapa_id,
                    page,
                    movpac,
                });
            }
        }
    }

    dataReport.startDate = dataInicial;
    dataReport.endDate = dataFinal;
    dataReport.size = 'paisagem';
    dataReport.model = `mapagrade/${modelo_selecionado}`;
    dataReport.data = {
        curmapaByPage,
        descsetor: curmapaByPage[0].movpac[0].descsetor,
        descgrade: curmapaByPage[0].movpac[0].descgrade,
    };
    try {
        const reportHtml = await gerarRelatorioHtml(dataReport);
        html = reportHtml;
    } catch (err) {
        res.status(400).json({
            error: err.message,
        });
    }
    try {
        await rastreaRep(
            req,
            1,
            dataReport.model,
            `MAPA GRADE - ${dataReport.data.descsetor} | ${dataReport.data.descgrade}`,
            0,
            0,
            0
        );
    } catch (err) {
        res.status(400).json({
            error: err.message,
        });
    }

    if (curmapaByPage.length > 0) {
        await MapaGrade.sequelize.transaction(async transaction => {
            for (const item of curmapaByPage) {
                for (const pac of item.movpac) {
                    const exames = {};
                    let exanumber = 1;

                    let movexa_ids = '';
                    for (let idx = 0; idx < pac.exam.length; idx++) {
                        const element = pac.exam[idx];
                        for (let index = 0; index < element.length; index++) {
                            const exas = element[index];
                            if (exas.id !== '') {
                                movexa_ids += `${exas.id},`;
                            }
                        }
                    }
                    movexa_ids = movexa_ids.substring(0, movexa_ids.length - 1);

                    for (let index = 0; index < 40; index++) {
                        const exaempty = `exa${exanumber
                            .toString()
                            .padStart(2, '0')}`;
                        if (index < 15) {
                            const exa = pac.exam[0][index];
                            exames[exaempty] = exa.exm;
                        } else if (index >= 15 && index < 30) {
                            if (pac.exam[1]) {
                                const exa = pac.exam[1][index - 15];
                                exames[exaempty] = exa.exm;
                            } else {
                                exames[exaempty] = '';
                            }
                        } else if (pac.exam[2]) {
                            const exa = pac.exam[2][index - 30];
                            exames[exaempty] = exa.exm;
                        } else {
                            exames[exaempty] = '';
                        }
                        exanumber++;
                    }

                    await MapaGrade.create(
                        {
                            mapa_id: item.mapa_id,
                            pag: item.page,
                            movpac_id: pac.movpac_id,
                            ...exames,
                            movexa_ids,
                            idopera_ultacao: req.userId,
                        },
                        { transaction }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
                }
            }
        });
    }

    try {
        await rastreaRep(
            req,
            1,
            dataReport.model,
            `MAPA GRADE - ${dataReport.data.descsetor} | ${dataReport.data.descgrade}`,
            0,
            0,
            0
        );
    } catch (err) {
        res.status(400).json({
            error: err.message,
        });
    }

    return html;
};

export default MgPadraoCod;
