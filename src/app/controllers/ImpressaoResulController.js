import { QueryTypes } from 'sequelize';
import { format, parseISO } from 'date-fns';
import Database from '../../database';

class ImpressaoResulController {

    async getResultados(req, res) {

        const {
            dataini,
            datafim,
            postos,
            exames,
            convenios,
            entrega,
            reimprime,
            ordem,
            pag,
        } = req.query;

        const statusValidos = ['CF', 'EP', 'EN'];

        try {
            const { Movexa, Param } = Database.getModels(req.database);

            const [params] = await Param.findAll({
                attributes: ['usa_lib']
            });

            params.dataValues.usa_lib === '0' ? statusValidos.push('LA') : null
            reimprime === '1' ? statusValidos.push('IM'): null;

            const dataInicial = format(parseISO(dataini), 'yyyy-MM-dd');
            const dataFinal = format(parseISO(datafim), 'yyyy-MM-dd');

            const where = `
                WHERE
                    movpac.dataentra between :dataInicial
                    AND :dataFinal
                    AND movexa.posto IN (:postos)
                    ${exames ? `AND movexa.exame_id IN (:exames)`: ''}
                    ${convenios ? `AND movexa.convenio_id IN (:convenios)`: ''}
                    ${entrega ? `AND entrega.id = :entrega` : ''}
                    `

            const orderBy = `
                ORDER BY
                    ${
                        convenios
                            ? ordem === 'os'
                                ? 'movexa.convenio_id, movexa.posto, movexa.amostra'
                                : ordem === 'entrega'
                                ? 'movexa.convenio_id, movpac.entrega_id'
                                : 'movexa.convenio_id, nome'
                            : ordem === 'os'
                            ? 'movexa.posto, movexa.amostra'
                            : ordem === 'entrega'
                            ? 'movpac.entrega_id'
                            : 'nome'
                    }`;

            const query = `
                SELECT
                    distinct(movpac_id),
                    statusexm,
                    movexa.posto,
                    movexa.amostra
                    ${
                        convenios.length
                            ? ordem === 'os'
                                ? ',movexa.convenio_id'
                                : ordem === 'entrega'
                                ? ',movexa.convenio_id, movpac.entrega_id'
                                : ',movexa.convenio_id, trim(prontuario.nome) as nome'
                            : ordem === 'os'
                            ?''
                            : ordem === 'entrega'
                            ? ',movpac.entrega_id'
                            : ',trim(prontuario.nome) as nome'
                    }
                FROM movexa
                    LEFT JOIN movpac on movpac.id = movexa.movpac_id
                    LEFT JOIN entrega on entrega.id = movpac.entrega_id
                    LEFT JOIN exame on exame.id = movexa.exame_id
                    LEFT JOIN convenio on convenio.id = movexa.convenio_id
                    LEFT JOIN prontuario on prontuario.id = movpac.prontuario_id
                ${where}
                ${orderBy}`

            const select = await Movexa.sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements: {
                    dataInicial,
                    dataFinal,
                    postos: postos.split(','),
                    exames: exames?.split(','),
                    convenios: convenios?.split(','),
                    entrega: entrega?.split(','),
                },
            });

            let examesAgrupados = [];

            select.forEach((e) => {
                const temPaciente = examesAgrupados.findIndex(ea => ea.movpac_id === e.movpac_id);
                if (temPaciente < 0) {
                    return examesAgrupados.push({
                        movpac_id: e.movpac_id,
                        posto: e.posto,
                        amostra: e.amostra,
                        exames: [
                            {...e}
                        ],
                    });
                }

                examesAgrupados[temPaciente].exames.push({...e});
            })

            const examesFiltrados = examesAgrupados.filter(e => {
                const todosStatusValidos = e.exames.every(i =>
                    statusValidos.some(elem => elem === i.statusexm)
                );

                if (!todosStatusValidos) return;

                return { movpac_id: e.movpac_id, posto: e.posto, amostra: e.amostra };
            });

            const primeiroItemPagina = pag * 10;
            const ultimoItemPagina = primeiroItemPagina + 10;
            const data = examesFiltrados.slice(primeiroItemPagina, ultimoItemPagina)

            return res.status(200).json(data);
        } catch (err) {
            return res.status(400).json({error: err.message});
        }
    }

    async getResultadosParciais(req, res) {
        const {
            dataini,
            datafim,
            postos,
            exames,
            convenios,
            entrega,
            reimprime,
            ordem,
            pag,
        } = req.query;

        const statusValidos = ['CF', 'EP', 'EN'];

        try {
            const { Movexa, Param } = Database.getModels(req.database);

            const [params] = await Param.findAll({
                attributes: ['usa_lib']
            });

            params.dataValues.usa_lib === '0' ? statusValidos.push('LA') : null
            reimprime === '1' ? statusValidos.push('IM'): null;

            const dataInicial = format(parseISO(dataini), 'yyyy-MM-dd');
            const dataFinal = format(parseISO(datafim), 'yyyy-MM-dd');

            const where = `
                WHERE
                    movpac.dataentra between :dataInicial
                    AND :dataFinal
                    AND movexa.posto IN (:postos)
                    ${exames ? `AND movexa.exame_id IN (:exames)`: ''}
                    ${convenios ? `AND movexa.convenio_id IN (:convenios)`: ''}
                    ${entrega ? `AND entrega.id = :entrega` : ''}
                    AND movexa.statusexm IN (:statusValidos)
                    `

            const orderBy = `
                ORDER BY
                    ${
                        convenios
                            ? ordem === 'os'
                                ? 'movexa.convenio_id, movexa.posto, movexa.amostra'
                                : ordem === 'entrega'
                                ? 'movexa.convenio_id, movpac.entrega_id'
                                : 'movexa.convenio_id, nome'
                            : ordem === 'os'
                            ? 'movexa.posto, movexa.amostra'
                            : ordem === 'entrega'
                            ? 'movpac.entrega_id'
                            : 'nome'
                    }`;

            const query = `
                SELECT
                    distinct(movpac_id),
                    movexa.posto,
                    movexa.amostra
                    ${
                        convenios.length
                            ? ordem === 'os'
                                ? ',movexa.convenio_id'
                                : ordem === 'entrega'
                                ? ',movexa.convenio_id, movpac.entrega_id'
                                : ',movexa.convenio_id, trim(prontuario.nome) as nome'
                            : ordem === 'os'
                            ?''
                            : ordem === 'entrega'
                            ? ',movpac.entrega_id'
                            : ',trim(prontuario.nome) as nome'
                    }
                FROM movexa
                    LEFT JOIN movpac on movpac.id = movexa.movpac_id
                    LEFT JOIN entrega on entrega.id = movpac.entrega_id
                    LEFT JOIN exame on exame.id = movexa.exame_id
                    LEFT JOIN convenio on convenio.id = movexa.convenio_id
                    LEFT JOIN prontuario on prontuario.id = movpac.prontuario_id
                ${where}
                ${orderBy}
                offset ${pag * 10} limit 10`

            const select = await Movexa.sequelize.query(query, {
                type: QueryTypes.SELECT,
                replacements: {
                    dataInicial,
                    dataFinal,
                    postos: postos.split(','),
                    exames: exames?.split(','),
                    convenios: convenios?.split(','),
                    entrega: entrega,
                    statusValidos: statusValidos,
                },
            });

            return res.status(200).json(select);
        } catch (err) {
            return res.status(400).json({error: err.message});
        }
    }

}

export default new ImpressaoResulController();
