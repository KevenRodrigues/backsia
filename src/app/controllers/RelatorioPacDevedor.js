/* eslint-disable func-names */
import { QueryTypes } from 'sequelize';
import Database from '../../database';
import { gerarRelatorioHtml } from './functions/functions';

class RepeteExaController {
    async index(req, res) {
        try {
            const { Movpac, Exame } = Database.getModels(req.database);

            const { posto, convenio, dataini, datafim, ordem } = req.query;
            const dataReport = JSON.parse(req.query.dataReport);

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

            const dataf = `'${dia}/${mes}/${ano}' and '${diaf}/${mesf}/${anof}'`;

            let columnsConvenio = '';
            let joinExame = '';
            let joinConvenio = '';
            let whereConvenio = '';
            let groupConvenio = '';

            if (convenio !== '') {
                columnsConvenio = ', CONVENIO.FANTASIA';
                joinConvenio =
                    ' LEFT JOIN CONVENIO ON CONVENIO.ID = MOVEXA.CONVENIO_ID ';
                joinExame = `LEFT JOIN MOVEXA ON MOVEXA.MOVPAC_ID = MOVPAC.ID ${joinConvenio}`;
                whereConvenio = ` AND CONVENIO.ID = '${convenio}' `;
                groupConvenio =
                    ' GROUP BY MOVPAC.ID, PRONTUARIO.NOME, PRONTUARIO.SEXO, CONVENIO.ID ';
            }

            let select = `
                SELECT
                    MOVPAC.ID,
                    MOVPAC.DATAENTRA,
                    MOVPAC.HORAENTRA,
                    MOVPAC.POSTO,
                    MOVPAC.AMOSTRA,
                    MOVPAC.IDADE,
                    PRONTUARIO.NOME,
                    PRONTUARIO.SEXO,
                    MOVPAC.DTENTREGA,
                    MOVPAC.TOTALCONV,
                    MOVPAC.TOTALPACI,
                    MOVPAC.VALTOT,
                    MOVPAC.TOTREC,
                    MOVPAC.DIFERENCA,
                    MOVPAC.DESCPERC,
                    MOVPAC.ACRESPERC,
                    MOVPAC.DESCVAL,
                    MOVPAC.ACRESVAL
                    ${columnsConvenio}
                FROM MOVPAC
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                ${joinExame}
            `;

            select += ` WHERE MOVPAC.DIFERENCA < 0 `;
            if (posto) {
                select += ` AND MOVPAC.POSTO IN(${posto})`;
            }
            select += ` AND MOVPAC.DATAENTRA BETWEEN ${dataf} ${whereConvenio} ${groupConvenio} `;

            switch (ordem) {
                case '2':
                    select += ` ORDER BY MOVPAC.DATAENTRA ASC, MOVPAC.HORAENTRA ASC `;
                    break;
                case '3':
                    select += ` ORDER BY PRONTUARIO.NOME `;
                    break;
                default:
                    select += ` ORDER BY MOVPAC.AMOSTRA `;
                    break;
            }

            const movimentacoes = await Movpac.sequelize
                .query(select, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            const movimentacoesId = movimentacoes
                .map(function(movimentacao) {
                    return movimentacao.id;
                })
                .join("','");

            if (movimentacoesId === '') {
                return res.status(200).json([]);
            }

            const selectExames = `
                    SELECT EXAME.CODIGO,
                        MOVEXA.MOVPAC_ID
                    FROM MOVEXA
                    INNER JOIN EXAME ON EXAME.ID = MOVEXA.EXAME_ID
                    ${joinConvenio}
                    WHERE MOVEXA.MOVPAC_ID IN ('${movimentacoesId}')
                    ${whereConvenio}`;

            const examesResponse = await Exame.sequelize
                .query(selectExames, { type: QueryTypes.SELECT })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            const devedores = [];

            for (const movimentacao of movimentacoes) {
                const exames = examesResponse
                    .filter(exame => exame.movpac_id === movimentacao.id)
                    .map(function(exame) {
                        return exame.codigo;
                    })
                    .join('/ ');

                devedores.push({ ...movimentacao, exames });
            }

            dataReport.startDate = `${ano}-${mes}-${dia}`;
            dataReport.endDate = `${anof}-${mesf}-${diaf}`;
            dataReport.data = devedores;
            const html = await gerarRelatorioHtml(dataReport);

            return res.status(200).json(html);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new RepeteExaController();
