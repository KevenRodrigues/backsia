import { Sequelize, QueryTypes, Op } from 'sequelize';
import { format, parseISO } from 'date-fns';
import * as _ from 'lodash';
import Database from '../../database';
import { PegaData, PegaHora } from './functions/functions';

class LotesFaturamentoController {
    async getLotes(req, res) {
        const sequelize = Database.instances[req.database];

        const { convenio_id } = req.params;
        const { consulta, status } = req.query;

        let where = ' WHERE ';

        where += ` convenio_lotefat.convenio_id = ${convenio_id} `;

        if(consulta === '0'){
            where += ` AND COALESCE(convenio_lotefat.consulta,0) = '0' `;
        }

        if(status) {
            where += ` AND COALESCE(convenio_lotefat.status,'') = '${status}' `;
        }

        try {
            const lotes = await sequelize
                .query(
                    `SELECT convenio_lotefat.id,
                        convenio_lotefat.operador_id,
                        a.nome as nome_abre,
                        convenio_lotefat.lotefat_id,
                        convenio_lotefat.convenio_id,
                        convenio.codigo,
                        convenio.fantasia,
                        convenio_lotefat.data,
                        convenio_lotefat.hora,
                        convenio_lotefat.operador_id_fecha,
                        b.nome as nome_fecha,
                        convenio_lotefat.datafecha,
                        convenio_lotefat.horafecha,
                        convenio_lotefat.status,
                        convenio_lotefat.mesref,
                        convenio_lotefat.anoref,
                        convenio_lotefat.valtotlote,
                        convenio_lotefat.consulta,
                        0 as marca,
                        convenio_lotefat.lotexml_id
                    FROM convenio_lotefat
                    LEFT JOIN convenio ON convenio.id = convenio_lotefat.convenio_id
                    LEFT JOIN operador a ON a.id = convenio_lotefat.operador_id
                    LEFT JOIN operador b ON b.id = convenio_lotefat.operador_id_fecha
                    ${where}
                    ORDER BY convenio_lotefat.data DESC`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )

            return res.status(200).json(lotes);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getPacientesByLote(req, res) {
        const sequelize = Database.instances[req.database];

        const { lote_id } = req.params;
        const { consulta, convenio_id } = req.query;

        try {
            const pacientes = await sequelize
                .query(
                    `SELECT
                        MOVEXA.POSTO,
                        MOVEXA.AMOSTRA,
                        MOVEXA.REQUISICAO,
                        PRONTUARIO.NOME,
                        MOVEXA.LOTEFAT_ID,
                        MOVPAC.DATAENTRA,
                        MOVPAC.ID,
                        CAST(SUM(COALESCE(MOVEXA.VALCONV,0)) + SUM(COALESCE(MOVEXA.MATCONV,0)) + SUM(COALESCE(MOVEXA.MEDCONV,0)) + SUM(COALESCE(MOVEXA.VALFILMEC,0)) AS NUMERIC(13,2)) AS VALORTOT,
                        CAST((SELECT DTFATURA  FROM MOVEXA WHERE MOVEXA.MOVPAC_ID = MOVPAC.ID AND MOVEXA.CONVENIO_ID = ${convenio_id} AND COALESCE(MOVEXA.NAOFATURA,0) = '0'  AND COALESCE(MOVEXA.CONSULTAEXA,0) = ${consulta} LIMIT 1) AS DATE) AS DATA,
                        CAST((SELECT MATRICULA FROM MOVEXA WHERE MOVEXA.MOVPAC_ID = MOVPAC.ID AND MOVEXA.CONVENIO_ID = ${convenio_id} AND COALESCE(MOVEXA.NAOFATURA,0) = '0'  AND COALESCE(MOVEXA.CONSULTAEXA,0) = ${consulta} LIMIT 1) AS CHAR(20)) AS MATRICULA
                    FROM MOVEXA
                    LEFT JOIN MOVPAC     ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                    LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                    WHERE MOVEXA.LOTEFAT_ID = ${lote_id}
                        AND MOVEXA.CONVENIO_ID = ${convenio_id}
                        AND COALESCE(MOVEXA.CONFFAT,0) = '1'
                        AND COALESCE(MOVEXA.CONSULTAEXA,0) = ${consulta}
                        AND COALESCE(MOVEXA.NAOFATURA,0) = '0'
                    GROUP BY MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.REQUISICAO, MOVEXA.LOTEFAT_ID, PRONTUARIO.NOME, MOVPAC.DATAENTRA, MOVPAC.ID
                    ORDER BY MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.REQUISICAO, MOVEXA.LOTEFAT_ID, PRONTUARIO.NOME, MOVPAC.DATAENTRA, MOVPAC.ID`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )

            return res.status(200).json(pacientes);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async fecharLote(req, res) {
        const sequelize = Database.instances[req.database];
        const { ConvenioLoteFat, Operador } = Database.getModels(req.database);

        const { lote_id } = req.params;
        const lote = req.body;

        try {
            await sequelize
                    .transaction(async transaction => {
                        await sequelize
                            .query(
                                `UPDATE MOVEXA
                                SET LOTEFAT_STATUS = 'FC',
                                    IDOPERA_ULTACAO = ${req.userId}
                                WHERE MOVEXA.CONVENIO_ID = ${lote.convenio_id}
                                    AND MOVEXA.LOTEFAT_ID = ${lote_id}
                                    AND COALESCE(CONFFAT,0) = '1'
                                    ${lote.consulta === '1' ? " AND COALESCE(CONSULTAEXA,0) = '1'" : "AND COALESCE(CONSULTAEXA,0) = '0'" }`,
                                {
                                    type: QueryTypes.UPDATE,
                                    transaction
                                }
                            )

                        await sequelize
                            .query(
                                `UPDATE MOVEXA
                                SET LOTEFAT_ID = NULL,
                                    IDOPERA_ULTACAO = ${req.userId}
                                WHERE MOVEXA.CONVENIO_ID = ${lote.convenio_id}
                                    AND MOVEXA.LOTEFAT_ID = ${lote_id}
                                    AND COALESCE(CONFFAT,0) = '0'
                                    ${lote.consulta === '1' ? " AND COALESCE(CONSULTAEXA,0) = '1'" : "AND COALESCE(CONSULTAEXA,0) = '0'" }`,
                                {
                                    type: QueryTypes.UPDATE,
                                    transaction
                                }
                            )

                        const currequi_lotetot = await sequelize
                            .query(
                                `SELECT
                                    CAST(SUM(COALESCE(MOVEXA.VALCONV,0)) + SUM(COALESCE(MOVEXA.MATCONV,0)) + SUM(COALESCE(MOVEXA.MEDCONV,0)) + SUM(COALESCE(MOVEXA.VALFILMEC,0)) AS NUMERIC(13,2)) AS TOTREQUI
                                FROM MOVEXA
                                LEFT JOIN MOVPAC ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                                WHERE MOVEXA.LOTEFAT_ID = ${lote_id}
                                    AND MOVEXA.CONVENIO_ID = ${lote.convenio_id}
                                    AND COALESCE(MOVEXA.NAOFATURA,0) = '0'
                                    ${lote.consulta === '1' ? " AND COALESCE(MOVEXA.CONSULTAEXA,0) = '1'" : "AND COALESCE(MOVEXA.CONSULTAEXA,0) = '0'" }
                                    GROUP BY MOVEXA.LOTEFAT_ID ORDER BY MOVEXA.LOTEFAT_ID`,
                                {
                                    type: QueryTypes.SELECT,
                                    transaction
                                }
                            )

                        const campo = 'dt_banco';
                        const getParam = await Operador.sequelize
                            .query(`select ${campo} from param, param2`, {
                                type: Sequelize.QueryTypes.SELECT,
                            })
                        const { dt_banco } = getParam[0];
                        const data = await PegaData(req, dt_banco);
                        const hora = await PegaHora(req, dt_banco);

                        const item  = {
                            status: 'FC',
                            datafecha: format(data, 'yyyy-MM-dd'),
                            horafecha: hora,
                            mesref: lote.mesref,
                            anoref: lote.anoref,
                            operador_id_fecha: lote.operador_id_fecha,
                            nome_fecha: lote.operador_nome_fecha,
                            valtotlote: currequi_lotetot[0].totrequi,
                            idopera_ultacao: req.userId,
                        }

                        await ConvenioLoteFat
                            .update(item, {
                                where: { lotefat_id: lote_id, convenio_id: lote.convenio_id },
                                transaction
                            })
                    });

            return res.status(200).json(lote);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async reabrirLote(req, res) {
        const sequelize = Database.instances[req.database];
        const { ConvenioLoteFat, Operador } = Database.getModels(req.database);

        const { lote_id } = req.params;
        const lote = req.body;

        try {
            await sequelize
                    .transaction(async transaction => {
                        await sequelize
                            .query(
                                `UPDATE MOVEXA
                                SET LOTEFAT_STATUS = 'AB',
                                    IDOPERA_ULTACAO = ${req.userId}
                                WHERE MOVEXA.CONVENIO_ID = ${lote.convenio_id}
                                    AND MOVEXA.LOTEFAT_ID = ${lote_id}
                                    AND COALESCE(CONFFAT,0) = '1'
                                    ${lote.consulta === '1' ? " AND COALESCE(CONSULTAEXA,0) = '1'" : "AND COALESCE(CONSULTAEXA,0) = '0'" }`,
                                {
                                    type: QueryTypes.UPDATE,
                                    transaction
                                }
                            )

                        const item = {
                            status: 'AB',
                            datafecha: null,
                            horafecha: null,
                            operador_id_fecha: null,
                            nome_fecha: null,
                            valtotlote: null,
                            idopera_ultacao: req.userId,
                        }

                        await ConvenioLoteFat
                            .update(item, {
                                where: { lotefat_id: lote_id, convenio_id: lote.convenio_id },
                                transaction
                            })
                    });

            return res.status(200).json(lote);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async excluirLote(req, res) {
        const sequelize = Database.instances[req.database];
        const { ConvenioLoteFat, Operador, TabLogCad } = Database.getModels(req.database);

        const { lote_id } = req.params;
        const { lote, justificativa} = req.body;

        const campo = 'dt_banco';

        try {
            await sequelize
                    .transaction(async transaction => {
                        const getParam = await Operador.sequelize
                            .query(`select ${campo} from param, param2`, {
                                type: QueryTypes.SELECT,
                                transaction
                            })
                        const { dt_banco } = getParam[0];

                        await TabLogCad.create({
                            tabela: "CONVENIO_LOTEFAT",
                            idreg: lote_id,
                            idopera: req.userId,
                            acao: 'Exclusão do lote de faturamento: ' + lote_id + ' do convênio: ' + lote.fantasia,
                            motivo: justificativa,
                            data: format(await PegaData(req, dt_banco), 'yyyy-MM-dd'),
                            hora: await PegaHora(req, dt_banco),
                            maquina: req.headers.host,
                        }, {transaction})

                        await sequelize
                            .query(
                                `UPDATE MOVEXA
                                SET LOTEFAT_ID = NULL,
                                    IDOPERA_ULTACAO = ${req.userId}
                                WHERE MOVEXA.LOTEFAT_ID = ${lote_id}
                                  AND MOVEXA.CONVENIO_ID = ${lote.convenio_id}`,
                                {
                                    type: QueryTypes.UPDATE,
                                    transaction
                                }
                            )

                        await ConvenioLoteFat.destroy({
                            where: {
                                lotefat_id: lote_id,
                            },
                        })
                    });

            return res.status(200).send();
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getInfoLoteAtual(req, res) {
        const sequelize = Database.instances[req.database];
        const { ConvenioLoteFat, Operador, TabLogCad } = Database.getModels(req.database);

        const { id: movpac_id } = req.params;
        const { lote_id, convenio_id } = req.query;

        try {
            const exames = await sequelize
                .query(
                    `SELECT
                        LOTEFAT_ID,
                        REQUISICAO,
                        MOVPAC_ID,
                        CONVENIO_ID
                    FROM MOVEXA
                    WHERE MOVEXA.CONVENIO_ID = ${convenio_id}
                        AND LOTEFAT_ID = ${lote_id}
                        AND MOVEXA.MOVPAC_ID <> ${movpac_id}
                        AND COALESCE(CONSULTAEXA,0) = '0'
                    GROUP BY LOTEFAT_ID, REQUISICAO, MOVPAC_ID, CONVENIO_ID`,
                    { type: QueryTypes.SELECT }
                )

            const lote = await sequelize
                .query(
                    `SELECT
                        ID,
                        STATUS
                    FROM CONVENIO_LOTEFAT
                    WHERE CONVENIO_LOTEFAT.CONVENIO_ID = ${convenio_id}
                        AND LOTEFAT_ID = ${lote_id}
                        AND COALESCE(CONSULTA,0) = '0'`,
                    { type: QueryTypes.SELECT }
                )

            return res.status(200).send({exames, lote});
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async getLotesConvenios(req, res) {
        const sequelize = Database.instances[req.database];

        const { id: movpac_id } = req.params;
        const { convenios, consulta = 0 } = req.body;

        try {
            const response = {};
            for (let i = 0; i < convenios.length; i++) {
                const convenio = convenios[i];

                let convenioResponse = await sequelize
                    .query(
                        `SELECT
                            LOTE,
                            LOTECON,
                            CHKGUIA100,
                            CHKGUIA50,
                            CHKGUIA70,
                            CHKGUIAOUT,
                            QTDOUT
                        FROM CONVENIO
                        WHERE CONVENIO.ID = ${convenio}`,
                        { type: QueryTypes.SELECT }
                    )

                convenioResponse = convenioResponse[0];

                convenioResponse.qtdguialote = 0;
                if (convenioResponse.chkguia100 === '1') {
                    convenioResponse.qtdguialote = 100;
                } else if (convenioResponse.chkguia50 === '1') {
                    convenioResponse.qtdguialote = 50;
                } else if (convenioResponse.chkguia70 === '1') {
                    convenioResponse.qtdguialote = 70;
                } else if (convenioResponse.chkguiaout === '1') {
                    convenioResponse.qtdguialote = parseInt(convenioResponse.qtdout, 10);
                }

                response[convenio] = convenioResponse;

                const atendimentos = await sequelize
                    .query(
                        `SELECT
                            LOTEFAT_ID,
                            REQUISICAO,
                            MOVPAC_ID,
                            CONVENIO_ID
                        FROM MOVEXA
                        WHERE MOVEXA.CONVENIO_ID = ${convenio}
                            AND LOTEFAT_ID = ${response[convenio].lote}
                            AND MOVEXA.MOVPAC_ID <> ${movpac_id}
                            AND COALESCE(CONSULTAEXA,0) = '${consulta}'
                        GROUP BY LOTEFAT_ID, REQUISICAO, MOVPAC_ID, CONVENIO_ID`,
                        { type: QueryTypes.SELECT }
                    )

                response[convenio].qtd_guias_atual = atendimentos.length;


                const lote = await sequelize
                    .query(
                        `SELECT
                            ID,
                            STATUS
                        FROM CONVENIO_LOTEFAT
                        WHERE CONVENIO_LOTEFAT.CONVENIO_ID = ${convenio}
                            AND LOTEFAT_ID = ${response[convenio].lote}
                            AND COALESCE(CONSULTA,0) = '${consulta}'`,
                        { type: QueryTypes.SELECT }
                    )

                response[convenio].lote_atual = lote.length > 0 ? lote[0] : false;
            }

            return res.status(200).send(response);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new LotesFaturamentoController();
