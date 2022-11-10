import Database from '../../database';
import { format } from 'date-fns';
import { QueryTypes } from 'sequelize';
import { gerarRelatorioHtml } from './functions/functions';

class EstatisticaAvancadaController {
    async avancada(req, res) {
        const {
            dataini,
            datafim,
            horaInicial,
            horaFinal,
            postos,
            convenio,
            exame,
            urgencia,
            ordem,
            statusResultado,
            status,
            filtroData,
            faixaExames,
            faixaEtaria,
            cidade,
            bairro,
            sexo,
        } = req.body;
        try {
            const { Movexa } = Database.getModels(req.database);

            let select = `
                SELECT
                    MOVEXA.POSTO,
                    MOVEXA.AMOSTRA,
                    PRONTUARIO.NOME,
                    CONVENIO.FANTASIA,
                    MOVPAC.IDADE,
                    MOVPAC.MES,
                    MOVPAC.DIA,
                    EXAME.DESCRICAO,
                    MOVEXA.STATUSEXM,
                    MOVPAC.DATAENTRA,
                    MOVPAC.DTENTREGA,
                    MOVEXA.NAOFATURA,
                    MOVEXA.STATUSRESULTADO,
                    MOVEXA.REQUISICAO,
                    MOVEXA.DTENTREGA AS DTENTREGAEXA,
                    SETOR.DESCRICAO AS DESCSETOR,
                    MOVPAC.HORAENTRA,
                    EXAME.CODIGO,
                    EXAME.SETOR_ID,
                    MOVEXA.EXAME_ID,
                    MOVEXA.CONVENIO_ID,
                    MOVPAC.PRONTUARIO_ID,
                    MOVEXA.ID AS IDMOVEXA,
                    MOVPAC.ID AS IDMOVPAC,
                    CAST('' AS VARCHAR(2000)) AS EXAMES,
                    CAST('' AS VARCHAR(2000)) AS LEGENDA,
                    POSTO.ID AS POSID,
                    MOVEXA.MOVPAC_ID,
                    MOVEXA.IMPPACI,
                    MOVPAC.ENVIO_ID,
                    ENVIO.CODIGO AS CODENVIO,
                    ENVIO.DESCRICAO AS DESCENVIO,
                    MOVPAC.ENTREGA_ID,
                    ENTREGA.CODIGO AS CODENTREGA,
                    ENTREGA.DESCRICAO AS DESCENTREGA,
                    EXAME.CODIGO,
                    PRONTUARIO.CIDADE,
                    PRONTUARIO.BAIRRO,
                    MOVEXA.RESULTADO
                FROM MOVEXA `;

            let joins = `
                INNER JOIN MOVPAC    ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                LEFT JOIN CONVENIO   ON CONVENIO.ID = MOVEXA.CONVENIO_ID
                LEFT JOIN EXAME      ON EXAME.ID = MOVEXA.EXAME_ID
                LEFT JOIN POSTO      ON POSTO.CODIGO = MOVEXA.POSTO
                LEFT JOIN SETOR      ON SETOR.ID = EXAME.SETOR_ID
                LEFT JOIN ENVIO      ON ENVIO.ID = MOVPAC.ENVIO_ID
                LEFT JOIN ENTREGA    ON ENTREGA.ID = MOVPAC.ENTREGA_ID `

            select += joins;
            let where = 'WHERE ';

            let tipoDeData = '';

            switch (filtroData) {
                case 'paciente entrega':
                    tipoDeData += 'MOVPAC.DATAENTRA ';
                    break;
                case 'exame coleta':
                    tipoDeData += 'MOVEXA.DTCOLETA ';
                    break;
                case 'exame entrega':
                    tipoDeData += 'MOVEXA.DTENTREGA ';
                    break;
                case 'exame fatura':
                    tipoDeData += 'MOVEXA.DTFATURA ';
                    break;
                default:
                    tipoDeData += 'MOVPAC.DATAENTRA ';
            }

            where += tipoDeData;

            const periodo = `
                    BETWEEN '${format(new Date(dataini), 'yyyy-MM-dd')}'
                    AND '${format(new Date(datafim), 'yyyy-MM-dd')}' `;

            where += periodo;

            if (convenio) where += `AND CONVENIO.CODIGO = '${convenio}' `;

            if (exame) where += `AND MOVEXA.EXAME_ID = '${exame}' `;

            if (postos) where += `AND MOVEXA.POSTO IN (${postos}) `;

            if (status.length) where += `AND MOVEXA.STATUSEXM IN (${status}) `;

            if (horaInicial && horaFinal) {
                where += `AND MOVPAC.HORAENTRA BETWEEN
                    '${horaInicial.replace(':', '')}' AND '${horaFinal.replace(
                    ':',
                    ''
                )}' `;
            }
            if (urgencia === 'SIM') where += `AND MOVEXA.URGENTEEXM = 1 `;

            if (urgencia === 'NÃO') where += `AND MOVEXA.URGENTEEXM = 0 `;

            if (statusResultado === 'NORMAL')
                where += `AND COALESCE(MOVEXA.STATUSRESULTADO,'') = 'NO' `;

            if (statusResultado === 'ALTERADO')
                where += `AND COALESCE(MOVEXA.STATUSRESULTADO,'') = 'AL' `;

            if (statusResultado === 'NÃO CHECADO') {
                where += `AND (COALESCE(MOVEXA.STATUSRESULTADO,'') = 'NC'
                    OR TRIM(COALESCE(MOVEXA.STATUSRESULTADO,'')) = '') `;
            }

            if (faixaEtaria.final.idade) {
                where += `AND ( CAST(VAL(COALESCE(MOVPAC.IDADE,'0')) AS numeric(3,0))
                  BETWEEN ${
                      faixaEtaria.inicio.idade ? faixaEtaria.inicio.idade : '0'
                  } AND ${faixaEtaria.final.idade}) `;
            }
            if (faixaEtaria.final.mes) {
                if (!faixaEtaria.final.idade) {
                    where += `AND ( CAST(VAL(COALESCE(MOVPAC.IDADE,'0')) AS numeric(3,0))
                      BETWEEN  0 AND 0 ) `;
                }
                where += ` AND ( CAST(VAL(COALESCE(MOVPAC.MES,'0')) AS numeric(3,0))
                    BETWEEN ${
                        faixaEtaria.inicio.mes ? faixaEtaria.inicio.mes : '0'
                    }
                        AND ${faixaEtaria.final.mes} ) `;
            }

            if (faixaEtaria.final.dia) {
                if (!faixaEtaria.final.mes) {
                    where += `  AND ( CAST(VAL(COALESCE(MOVPAC.MES,'0')) AS numeric(3,0))
                        BETWEEN  0 AND 0 ) `;
                }
                where += ` AND ( CAST(VAL(COALESCE(MOVPAC.DIA,'0')) AS numeric(3,0))
                    BETWEEN ${
                        faixaEtaria.inicio.dia ? faixaEtaria.inicio.dia : '0'
                    }
                    AND ${faixaEtaria.final.dia} )`;
            }

            if (cidade)
                where += `AND UPPER(PRONTUARIO.CIDADE) LIKE '%${cidade.toUpperCase()}%' `;

            if (bairro)
                where += ` AND UPPER(PRONTUARIO.BAIRRO) LIKE '%${bairro.toUpperCase()}%' `;

            if (sexo === 'masculino') where += `AND PRONTUARIO.SEXO = 'M' `;

            if (sexo === 'feminino') where += `AND PRONTUARIO.SEXO = 'F' `;

            select += where;

            let count = `
                SELECT COUNT(MOVEXA.POSTO) FROM MOVEXA `
            count += joins;
            count += where;

            let limit = ' LIMIT 100001'
            count += limit;
            const [quantidadeDeRegistros] = await Movexa.sequelize.query(count, {
                type: QueryTypes.SELECT,
            });

            if (Number(quantidadeDeRegistros.count) > 100000) {
                throw new RangeError('Quantidade de registros acima do limite')
            }

            let tipoOrdem = '';

            switch(ordem) {
                case 'convenio':
                    tipoOrdem = 'CONVENIO.FANTASIA, MOVEXA.POSTO, MOVEXA.AMOSTRA ';
                    break;
                case 'paciente entrada':
                    tipoOrdem = 'MOVPAC.DATAENTRA ';
                    break;
                case 'paciente entrega':
                    tipoOrdem = 'MOVPAC.DTENTREGA ';
                    break;
                case 'nome paciente':
                    tipoOrdem = 'PRONTUARIO.NOME, MOVEXA.POSTO, MOVEXA.AMOSTRA ';
                    break;
                default:
                    tipoOrdem = 'MOVEXA.POSTO, MOVEXA.AMOSTRA'
            }

            const orderBy = `ORDER BY ${tipoOrdem}`
            select += orderBy;

            const data = await Movexa.sequelize.query(select, {
                type: QueryTypes.SELECT,
            });

            const dadosComResultadosFiltrados = EstatisticaAvancadaController.filtrarResultados(
                data
            );

            const primeiroResultadoInput = parseInt(faixaExames[0]);
            const segundoResultadoInput = parseInt(faixaExames[1]);

            const temFiltroPorResultadosValido =
                segundoResultadoInput !== 0 ? true : false;

            const dadosMaisResumo = {
                somaPacientes: 0,
                somaExames: 0,
                dados: '',
            };

            if (temFiltroPorResultadosValido) {
                const dadosFiltradosPorFaixaDeResultados = EstatisticaAvancadaController.filtrarPorFaixaDeResultados(
                    dadosComResultadosFiltrados,
                    primeiroResultadoInput,
                    segundoResultadoInput
                );

                const somaPacientes = EstatisticaAvancadaController.contarPacientes(
                    dadosFiltradosPorFaixaDeResultados
                );

                dadosMaisResumo.somaPacientes = somaPacientes;
                dadosMaisResumo.somaExames =
                    dadosFiltradosPorFaixaDeResultados.length;
                dadosMaisResumo.dados = dadosFiltradosPorFaixaDeResultados;
                return res.json(dadosMaisResumo);
            }

            const somaPacientes = EstatisticaAvancadaController.contarPacientes(
                dadosComResultadosFiltrados
            );

            dadosMaisResumo.somaPacientes = somaPacientes;
            dadosMaisResumo.somaExames = dadosComResultadosFiltrados.length;
            dadosMaisResumo.dados = dadosComResultadosFiltrados;

            return res.json(dadosMaisResumo);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static filtrarResultados(dados) {
        const regex = /\[(.*?)\]/g;

        const dadosLength = dados.length;
        for (let i = 0; i < dadosLength; i++) {
            const element = dados[i];
            element.descricao = element.descricao.trim();
            element.idade = element.idade.trim();
            element.nome = element.nome.trim();
            if (element.resultado) {
                const resultadoEncontrado = element.resultado.match(regex);
                if (resultadoEncontrado) {
                    const resultadoTratado = resultadoEncontrado.map(r => {
                        r = r.trim();
                        r = r.replace('[', '');
                        r = r.replace(']', '');
                        r = r.replace(',', '.');
                        return r.trim();
                    });
                    const resultadoTratadoSemVazios = resultadoTratado.filter(
                        r => r !== ''
                    );
                    const ehMaiorQueCinco =
                        resultadoTratadoSemVazios.length > 5;
                    const ehMaiorQueDois = resultadoTratadoSemVazios.length > 2;
                    if (ehMaiorQueDois) {
                        element.primeirosDoisResultados = resultadoTratadoSemVazios
                            .slice(0, 2)
                            .join(', ');
                    }
                    if (ehMaiorQueCinco) {
                        element.resultadoEncontrado = resultadoTratadoSemVazios.slice(
                            0,
                            5
                        );
                        element.resultadosFiltrados = element.resultadoEncontrado.join(
                            ', '
                        );
                    } else {
                        element.resultadoEncontrado = resultadoTratadoSemVazios;
                        element.resultadosFiltrados = resultadoTratadoSemVazios.join(
                            ', '
                        );
                    }
                }
            }
        }
        return dados;
    }

    static filtrarPorFaixaDeResultados(
        dados,
        primeiroResultadoInput,
        segundoResultadoInput
    ) {
        const dadosFiltradosPorFaixaDeResultados = [];

        const dadosLength = dados.length;
        for (let i = 0; i < dadosLength; i++) {
            const element = dados[i];
            if (element.resultadoEncontrado) {
                const primeiroResultadoItem = parseFloat(
                    element.resultadoEncontrado[0]
                );
                const ehNaN = isNaN(primeiroResultadoItem);
                if (ehNaN) {
                    if (primeiroResultadoInput === 0) {
                        dadosFiltradosPorFaixaDeResultados.push(element);
                    }
                } else if (primeiroResultadoItem >= primeiroResultadoInput) {
                    if (primeiroResultadoItem <= segundoResultadoInput) {
                        dadosFiltradosPorFaixaDeResultados.push(element);
                    }
                }
            }
        }
        return dadosFiltradosPorFaixaDeResultados;
    }

    static contarPacientes(dados) {
        let somaPacientes = {
            total: 0,
            pacientes: [],
        };
        const dadosLength = dados.length;
        for (let i = 0; i < dadosLength; i++) {
            const element = dados[i];
            const temPaciente = somaPacientes.pacientes.find(p => p === element.idmovpac);
            if (!temPaciente) {
                somaPacientes.pacientes.push(element.idmovpac);
                somaPacientes.total++;
            }

        }

        return somaPacientes.total;
    }

    async gerarRelatorioEstatisticaAvancada(req, res) {
        const {
            dados,
            color,
            logo,
            profile,
            dataini,
            datafim,
        } = req.body;

        try {
            const html = await gerarRelatorioHtml({
                model: '/estatisticas/avancada/index',
                data: {
                    registros: {
                        dados: dados.exames,
                        totais: dados.totais,
                        parte: dados.parte,
                        ehAUltimaParte: dados.ehAUltimaParte
                    },
                },
                profile,
                logo,
                startDate: format(new Date(dataini), 'yyyy-MM-dd'),
                endDate: format(new Date(datafim), 'yyyy-MM-dd'),
                color: `#${color}`,
            });
            return res.status(200).send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export default new EstatisticaAvancadaController();
