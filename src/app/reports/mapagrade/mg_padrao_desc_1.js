/* eslint-disable no-plusplus */
import { QueryTypes } from 'sequelize';
import Database from '../../../database';
import {
    gerarRelatorioHtml,
    rastreaRep,
} from '../../controllers/functions/functions';

const MgPadraoDesc = async (
    req,
    res,
    { dataReport, curmapa, dataInicial, dataFinal, modelo_selecionado }
) => {
    const sequelize = Database.instances[req.database];
    const { MapaGrade } = Database.getModels(req.database);
    const curmapaByPage = [];
    let movpac = [];
    let page = 1;
    let html = null;

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
    const rowMax = 30;

    for (let i = 0; i < curmapa.length; i++) {
        const item = curmapa[i];
        const exam = [];

        countRow += 2;

        for (let index = 0; index < item.exam.length; index++) {
            const element = item.exam[index];
            if (element.exm === '') {
                break;
            } else {
                exam.push({ ...element });
            }
        }

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
    dataReport.size = 'retrato';
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

    if (curmapaByPage.length > 0) {
        await MapaGrade.sequelize.transaction(async transaction => {
            for (const item of curmapaByPage) {
                for (const pac of item.movpac) {
                    let movexa_ids = '';
                    for (let idx = 0; idx < pac.exam.length; idx++) {
                        const element = pac.exam[idx];
                        if (element.id !== '') {
                            movexa_ids += `${element.id},`;
                        }
                    }
                    movexa_ids = movexa_ids.substring(0, movexa_ids.length - 1);
                    await MapaGrade.create(
                        {
                            mapa_id: item.mapa_id,
                            pag: item.page,
                            movpac_id: pac.movpac_id,
                            exa01: pac.exam[0] ? pac.exam[0].exm : '',
                            exa02: pac.exam[1] ? pac.exam[1].exm : '',
                            exa03: pac.exam[2] ? pac.exam[2].exm : '',
                            exa04: pac.exam[3] ? pac.exam[3].exm : '',
                            exa05: pac.exam[4] ? pac.exam[4].exm : '',
                            exa06: pac.exam[5] ? pac.exam[5].exm : '',
                            exa07: pac.exam[6] ? pac.exam[6].exm : '',
                            exa08: pac.exam[7] ? pac.exam[7].exm : '',
                            exa09: pac.exam[8] ? pac.exam[8].exm : '',
                            exa10: pac.exam[9] ? pac.exam[9].exm : '',
                            exa11: pac.exam[10] ? pac.exam[10].exm : '',
                            exa12: pac.exam[11] ? pac.exam[11].exm : '',
                            exa13: pac.exam[12] ? pac.exam[12].exm : '',
                            exa14: pac.exam[13] ? pac.exam[13].exm : '',
                            exa15: pac.exam[14] ? pac.exam[14].exm : '',
                            exa16: pac.exam[15] ? pac.exam[15].exm : '',
                            exa17: pac.exam[16] ? pac.exam[16].exm : '',
                            exa18: pac.exam[17] ? pac.exam[17].exm : '',
                            exa19: pac.exam[18] ? pac.exam[18].exm : '',
                            exa20: pac.exam[19] ? pac.exam[19].exm : '',
                            exa21: pac.exam[20] ? pac.exam[20].exm : '',
                            exa22: pac.exam[21] ? pac.exam[21].exm : '',
                            exa23: pac.exam[22] ? pac.exam[22].exm : '',
                            exa24: pac.exam[23] ? pac.exam[23].exm : '',
                            exa25: pac.exam[24] ? pac.exam[24].exm : '',
                            exa26: pac.exam[25] ? pac.exam[25].exm : '',
                            exa27: pac.exam[26] ? pac.exam[26].exm : '',
                            exa28: pac.exam[27] ? pac.exam[27].exm : '',
                            exa29: pac.exam[28] ? pac.exam[28].exm : '',
                            exa30: pac.exam[29] ? pac.exam[29].exm : '',
                            exa31: pac.exam[30] ? pac.exam[30].exm : '',
                            exa32: pac.exam[31] ? pac.exam[31].exm : '',
                            exa33: pac.exam[32] ? pac.exam[32].exm : '',
                            exa34: pac.exam[33] ? pac.exam[33].exm : '',
                            exa35: pac.exam[34] ? pac.exam[34].exm : '',
                            exa36: pac.exam[35] ? pac.exam[35].exm : '',
                            exa37: pac.exam[36] ? pac.exam[36].exm : '',
                            exa38: pac.exam[37] ? pac.exam[37].exm : '',
                            exa39: pac.exam[38] ? pac.exam[38].exm : '',
                            exa40: pac.exam[39] ? pac.exam[39].exm : '',
                            idopera_ultacao: req.userId,
                            movexa_ids,
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

export default MgPadraoDesc;
