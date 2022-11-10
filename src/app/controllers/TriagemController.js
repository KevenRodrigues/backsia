import Database from '../../database';
import { QueryTypes } from 'sequelize';
import { gerarRelatorioHtml } from './functions/functions';
import { parseISO, format} from 'date-fns'

class TriagemController {
    async estatistica(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);
            const { posto, recipiente, dataini, datafim } = req.body;

            const between = ` MOVPAC.DATAENTRA BETWEEN '${format(parseISO(dataini), 'yyyy-MM-dd')}' AND '${format(parseISO(datafim), 'yyyy-MM-dd')}' `;

            let select = `SELECT
            DISTINCT(TRIAGEM.MOVPAC_ID),
            TRIAGEM.POSTO,
            TRIAGEM.AMOSTRA,
            PRONTUARIO.NOME AS NOMEPRONTU,
            (
              SELECT HORATRI
              FROM TRIAGEM AS TRI
                LEFT JOIN MOVPAC AS MOV ON MOV.ID = TRI.MOVPAC_ID
                LEFT JOIN EXAME AS EXM ON EXM.ID = TRI.EXAME_ID
                WHERE MOV.ID = TRIAGEM.MOVPAC_ID
                AND TRI.RECIPTRI_ID = TRIAGEM.RECIPTRI_ID
                AND TRI.TRIADO = TRIAGEM.TRIADO
              ORDER BY TRI.HORATRI LIMIT 1
            ) AS HORATRI,
            (
              SELECT DATATRI
              FROM TRIAGEM AS TRI
                LEFT JOIN MOVPAC AS MOV ON MOV.ID = TRI.MOVPAC_ID
                LEFT JOIN EXAME AS EXM ON EXM.ID = TRI.EXAME_ID
                WHERE MOV.ID = TRIAGEM.MOVPAC_ID
                AND TRI.RECIPTRI_ID = TRIAGEM.RECIPTRI_ID
                AND TRI.TRIADO = TRIAGEM.TRIADO
            ORDER BY TRI.DATATRI LIMIT 1
            ) AS DATATRI,
            TRIAGEM.RECIPTRI_ID,
            RECIP.DESCRICAO,
            TRIAGEM.TRIADO,
            MOVPAC.DATAENTRA,
           (
            SELECT string_agg(EXM.CODIGO, ' | ')
            FROM TRIAGEM AS TRI
            LEFT JOIN MOVPAC AS MOV ON MOV.ID = TRI.MOVPAC_ID
            LEFT JOIN EXAME AS EXM ON EXM.ID = TRI.EXAME_ID
            LEFT JOIN MOVEXA AS MOVE ON MOVE.ID = TRI.MOVEXA_ID
            WHERE MOV.ID = TRIAGEM.MOVPAC_ID
            AND TRI.RECIPTRI_ID = TRIAGEM.RECIPTRI_ID
            AND TRI.TRIADO = TRIAGEM.TRIADO
            AND MOVE.STATUSEXM != 'SF'
            ) AS EXAMES
            FROM TRIAGEM
                 `
            const joins = `
                LEFT JOIN MOVPAC ON MOVPAC.ID = TRIAGEM.MOVPAC_ID
                LEFT JOIN EXAME ON EXAME.ID = TRIAGEM.EXAME_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = TRIAGEM.PRONTUARIO_ID
                LEFT JOIN RECIP ON RECIP.ID = TRIAGEM.RECIPTRI_ID
                LEFT JOIN MOVEXA ON MOVEXA.ID = TRIAGEM.MOVEXA_ID`
            const where = `
                WHERE ${between} AND TRIAGEM.POSTO IN (${posto})
                    AND TRIAGEM.RECIPTRI_ID IN (${recipiente})
                    AND MOVEXA.STATUSEXM != 'SF' `
            const limit = `limit 120001 `

            const orderBy = `ORDER BY DATATRI DESC `

            let count = `
                SELECT COUNT(*)
                FROM TRIAGEM
                LEFT JOIN MOVEXA ON MOVEXA.ID = TRIAGEM.MOVEXA_ID
                LEFT JOIN MOVPAC ON MOVPAC.ID = TRIAGEM.MOVPAC_ID`

            count += where;
            count += limit;

            const [quantidadeDeRegistros] = await Movexa.sequelize.query(count, {
                type: QueryTypes.SELECT,
            });

            if (Number(quantidadeDeRegistros.count) > 120000) {
                throw new RangeError('Quantidade de registros acima do limite')
            }

            select += joins;
            select += where;
            select += orderBy;

            const query = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
            });

            const dadosMaisTotais = {
                soma: {
                    triados: 0,
                    naoTriados: 0,
                },
                dados: query,
            };

            dadosMaisTotais.dados.forEach(q => {
                if (!q.datatri) {
                    q.datatri = null;
                }
                if (q.triado === '0') {
                    dadosMaisTotais.soma.naoTriados += 1;
                } else {
                    dadosMaisTotais.soma.triados += 1;
                }
            });

            dadosMaisTotais.dados.sort(
                (a, b) => new Date(b.datatri) - new Date(a.datatri)
            );

            for (const exA of dadosMaisTotais.dados) {
                if (!exA.datatri) {
                    exA.datatri = 'Sem data';
                } else {
                    exA.datatri = format(parseISO(exA.datatri), 'dd/MM/yyyy');
                }
            }

            return res.status(200).json(dadosMaisTotais);
        } catch (err) {
            return res.status(400).json({error: err.message});
        }
    }

    async gerarRelatorio(req, res) {
        const { dados, color, dataini, datafim, profile, logo } = req.body;
        try {
            const dataParsed = [];
            const queryLength = dados.exames.length;

            for (let index = 0; index < queryLength; index++) {
                let achou = false;

                for (let i = 0; i < dataParsed.length; i++) {
                    const element = dataParsed[i];
                    if (dados.exames[index].datatri === element.datatri) {
                        element.itens.push(dados.exames[index]);
                        achou = true;
                    }
                }

                if (!achou) {
                    dataParsed.push({
                        datatri: dados.exames[index].datatri,
                        itens: [dados.exames[index]],
                    });
                }
            }

            const html = await gerarRelatorioHtml({
                model: '/estatisticas/triagem/index',
                data: {
                    registros: {
                        exames: dataParsed,
                        totais: dados.totais,
                        parte: dados.parte,
                        ehAUltimaParte: dados.ehAUltimaParte,
                    },
                },
                profile,
                logo,
                startDate: dataini,
                endDate: datafim,
                color: `#${color}`,
            });

            return res.status(200).send(html);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

export default new TriagemController();
