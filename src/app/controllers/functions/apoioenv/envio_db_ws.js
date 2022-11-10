/* eslint-disable radix */
/* eslint-disable func-names */
import xml2js from 'xml2js';
import { createClient } from 'soap';
import * as _ from 'lodash';
import { Sequelize, QueryTypes } from 'sequelize';
import { format } from 'date-fns';
import Database from '../../../../database';
import { PegaData, PegaHora, rastreaWS } from '../functions';

const envio_db_ws = async (req, atendimento, leutubo, curarqapoio) => {
    const {
        Operador,
        Movexa,
        Etiquetaws,
        Movapoio,
        TabLogReg,
    } = Database.getModels(req.database);
    const sequelize = Database.instances[req.database];

    const builder = new xml2js.Builder({
        headless: true,
    });

    const groupBy = _.groupBy(curarqapoio, 'postoamostra');

    const newCurarqapoio = [];

    _.forEach(groupBy, async (pac, postoamostra) => {
        newCurarqapoio.push({
            postoamostra,
            ...pac[0],
            exames: [...pac],
        });
    });

    let CodLab = '';
    let SenhaLab = '';
    const endWeb = curarqapoio[0].ws_endweb
        ? curarqapoio[0].ws_endweb.trim()
        : '';

    if (!curarqapoio[0].codlabpos) {
        CodLab = curarqapoio[0].codlab ? curarqapoio[0].codlab.trim() : '';
        SenhaLab = curarqapoio[0].senhalab
            ? curarqapoio[0].senhalab.trim()
            : '';
    } else {
        CodLab = curarqapoio[0].codlabpos
            ? curarqapoio[0].codlabpos.trim()
            : '';
        SenhaLab = curarqapoio[0].senhalabpos
            ? curarqapoio[0].senhalabpos.trim()
            : '';
    }

    const campo = 'dt_banco';
    const getParam = await Operador.sequelize
        .query(`select ${campo} from param, param2`, {
            type: Sequelize.QueryTypes.SELECT,
        })
        .catch(err => {
            return err;
        });

    const getData = await PegaData(req, getParam[0].dt_banco);
    const DataAtual = format(getData, 'yyyy-MM-dd');
    const HoraAtual = await PegaHora(req, getParam.dt_banco);

    const xmls = [];
    let loteAtual = '';

    for (const pac of newCurarqapoio) {
        const { nome, altura, peso, data_nasc, sexo } = pac;
        const exames = [];
        const medicos = [];

        loteAtual = await sequelize
            .query(`select nextval('lotewsdb_id_seq')`, {
                type: QueryTypes.SELECT,
            })
            .then(response => {
                return response[0].nextval;
            })
            .catch(sequelize, err => {
                return err.message;
            });

        _.forEach(pac.exames, item => {
            const exm = {
                CodigoExameDB: {
                    _: item.codlabexm ? item.codlabexm.trim() : '',
                },
                DescricaoRegiaoColeta: {},
                VolumeUrinario: { _: item.volume ? item.volume.trim() : '' },
            };

            if (item.obgloccol === '0') {
                exm.DescricaoRegiaoColeta = {
                    _: item.descmat ? item.descmat.trim() : '',
                };
            } else {
                exm.DescricaoRegiaoColeta = {
                    _: item.local_coleta ? item.local_coleta.trim() : '',
                };
            }

            exames.push(exm);
            medicos.push({
                medico_id: item.medico_id,
                ufcrm: item.ufcrm ? item.ufcrm.trim() : 'PR',
                crm: item.crm ? item.crm.trim() : '0',
                nome_med: item.nome_med
                    ? item.nome_med.trim()
                    : 'NÃO INFORMADO',
            });
        });

        const getMedicos = _.groupBy(medicos, 'medico_id');
        const newGetMedicos = [];
        _.forEach(getMedicos, async med => {
            newGetMedicos.push({
                ...med[0],
            });
        });

        const arrayMedicos = [];
        for (const medico of newGetMedicos) {
            const medicoObj = {
                NomeSolicitante: { _: medico.nome_med },
                CodigoConselho: { _: 'CRM' },
                CodigoUFConselhoSolicitante: { _: medico.ufcrm },
                CodigoConselhoSolicitante: { _: medico.crm },
            };
            arrayMedicos.push(medicoObj);
        }

        const paciente = {
            ListaPacienteApoiado: {
                RGPacienteApoiado: { _: '' },
                NomePaciente: { _: nome.trim() },
                SexoPaciente: { _: sexo.trim() },
                DataHoraPaciente: { _: data_nasc },
                //
                // ATENÇÃO
                // PRECISA VALIDAR SE É TESTE DE CODIV PARA COLOCAR O CPF
                //
                //
                // NumeroCPF: { _: '' },
            },
            CodigoPrioridade: { _: 'R' },
            DescricaoDadosClinicos: { _: 'Nao informado' },
            DescricaoMedicamentos: { _: 'Nao informado' },
            Altura: {},
            Peso: {},
            UsoApoiado: { _: '' },
            PostoColeta: { _: '' },
            ListaSolicitante: {
                ct_Solicitante_v2: arrayMedicos,
            },
            ListaProcedimento: {
                ct_Procedimento_v2: exames,
            },
        };

        if (altura) {
            paciente.Altura = {
                _: altura
                    ? parseFloat(parseFloat(altura) / 100).toFixed(2)
                    : '',
            };
        } else {
            paciente.Altura = {
                _: '0',
            };
        }

        if (peso) {
            paciente.Peso = {
                _: peso,
            };
        } else {
            paciente.Peso = {
                _: '0',
            };
        }

        const obj = {
            atendimento: {
                CodigoApoiado: { _: CodLab },
                CodigoSenhaIntegracao: { _: SenhaLab },
                Pedido: {
                    NumeroAtendimentoApoiado: { _: loteAtual },
                    ...paciente,
                },
            },
        };

        const xml = builder.buildObject(obj);
        xmls.push({ xml, pac });
    }

    const retornoWS = [];
    const report = [];
    const imprimeEtiqueta = [];

    const envioWs = XML => {
        return new Promise((resolve, reject) => {
            createClient(
                endWeb,
                {
                    escapeXML: false,
                },
                function(err, client) {
                    if (err) {
                        reject(err);
                    }
                    client.RecebeAtendimento(XML, function(error, result) {
                        if (error) {
                            return reject(error);
                        }
                        return resolve(result);
                    });
                }
            );
        });
    };

    for (const enviows of xmls) {
        const { xml, pac } = enviows;
        const pacPosto = pac.posto;
        const pacAmostra = pac.amostra;
        const pacNome = pac.nome.trim();
        const pacRazao = pac.razao.trim();

        try {
            const result = await envioWs(xml);
            const retWS = result.RecebeAtendimentoResult;

            const reportExames = [];

            // SEPARACAO
            const tubos = [];
            const Recipiente = retWS.Confirmacao.ConfirmacaoPedidov2
                .ct_ConfirmacaoPedidoEtiqueta_v2
                ? retWS.Confirmacao.ConfirmacaoPedidov2
                      .ct_ConfirmacaoPedidoEtiqueta_v2[0].Amostras &&
                  retWS.Confirmacao.ConfirmacaoPedidov2
                      .ct_ConfirmacaoPedidoEtiqueta_v2[0].Amostras
                      .ct_AmostraEtiqueta_v2
                : [];
            if (Recipiente) {
                for (const tubo of Recipiente) {
                    const codbarra = tubo.NumeroAmostra;
                    const etiqueta = tubo.EtiquetaAmostra;
                    tubos.push({
                        exames: tubo.Exames,
                        codbarra,
                        etiqueta,
                    });
                }
            }

            const etiquetas = [];

            const processado = retWS.StatusLote.ct_StatusLote_v2[0].Pedidos
                .ct_StatusLotePedido_v2[0].Procedimentos
                ? retWS.StatusLote.ct_StatusLote_v2[0].Pedidos
                      .ct_StatusLotePedido_v2[0].Procedimentos
                      .ct_StatusLoteProcedimento_v2
                : [];
            const naoprocessado = retWS.StatusLote.ct_StatusLote_v2[0].Pedidos
                .ct_StatusLotePedido_v2[0].ErrosProcedimentos
                ? retWS.StatusLote.ct_StatusLote_v2[0].Pedidos
                      .ct_StatusLotePedido_v2[0].ErrosProcedimentos
                      .ct_ConfirmacaoProcedimento_v2
                : [];

            if (naoprocessado.length) {
                for (const item of naoprocessado) {
                    retornoWS.push({
                        posto: pacPosto,
                        amostra: pacAmostra,
                        paciente: pacNome,
                        status: 'erro',
                        resposta: `Webservice Error: Exame ${item.CodigoExameDB} - ${item.ErroIntegracao.ct_ErroIntegracao_v2[0].Descricao}`,
                    });
                }
            }

            if (processado.length) {
                for (const exm of pac.exames) {
                    const findTubo = tubos.find(item => {
                        return item.exames
                            .split(';')
                            .includes(exm.codlabexm.trim());
                    });

                    if (findTubo) {
                        let cretiquetaws = '';
                        let etiquetaws_id = '';
                        const findtEiqueta = etiquetas.find(
                            item => item.codbarras === findTubo.codbarra
                        );

                        if (!findtEiqueta) {
                            etiquetaws_id = await sequelize
                                .query(`select nextval('etiquetaws_id_seq')`, {
                                    type: QueryTypes.SELECT,
                                })
                                .then(response => {
                                    return response[0].nextval;
                                })
                                .catch(sequelize, err => {
                                    return err.message;
                                });

                            cretiquetaws = {
                                id: etiquetaws_id,
                                apoio_id: exm.id_apoio,
                                loteapoio: loteAtual,
                                codapoio:
                                    retWS.Confirmacao.ConfirmacaoPedidov2
                                        .ct_ConfirmacaoPedidoEtiqueta_v2[0]
                                        .NumeroAtendimentoDB,
                                idopera_ultacao: req.userId,
                                codbarras: findTubo.codbarra,
                                etiqueta: findTubo.etiqueta,
                            };
                            etiquetas.push(cretiquetaws);
                        } else {
                            etiquetaws_id = findtEiqueta.id;
                            cretiquetaws = '';
                        }

                        if (
                            (atendimento && exm.statusexm === 'TR') ||
                            !atendimento
                        ) {
                            exm.statusexm = 'AP';
                        }

                        exm.labapoio = 1;
                        exm.dtapoio = DataAtual;
                        exm.codexmapoiob2b = findTubo.codbarra;
                        exm.loteapoiob2b = loteAtual;
                        exm.codpedapoio =
                            retWS.Confirmacao.ConfirmacaoPedidov2.ct_ConfirmacaoPedidoEtiqueta_v2[0].NumeroAtendimentoDB;
                        exm.codexmlabb2b = exm.codlabexm.trim();
                        exm.etiquetaws_id = etiquetaws_id;
                        exm.apoio_id = exm.id_apoio;
                        exm.idopera_ultacao = req.userId;

                        const movapoio = {
                            posto: exm.posto,
                            amostra: exm.amostra,
                            exame_id: exm.exame_id,
                            movpac_id: exm.idmovpac,
                            movexa_id: exm.idmovexa,
                            apoio_id: exm.id_apoio,
                            operador_id: req.userId,
                            data: DataAtual,
                            hora: HoraAtual,
                            arquivo: 'ENVIO VIA WEB SERVICE',
                            idopera_ultacao: req.userId,
                        };

                        let crs_tab_logreg = '';

                        const volume =
                            exm.volume !== null ? exm.volume.trim() : '';

                        if (volume) {
                            crs_tab_logreg = {
                                tabela: 'movexa',
                                idreg: exm.id,
                                idopera: req.userId,
                                field: 'VOLUME',
                                oldval: '',
                                newval: volume.trim(),
                                data: DataAtual,
                                maquina: req.headers.host,
                                hora: HoraAtual,
                                idopera_ultacao: req.userId,
                            };
                        }

                        let erroDb = '';

                        await Movexa.sequelize.transaction(
                            // eslint-disable-next-line no-loop-func
                            async transaction => {
                                await Movexa.sequelize
                                    .query(
                                        `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${exm.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'ENVIO DO EXAME PARA APOIO VIA WS STATUS: ${exm.statusexm}','${req.headers.host}')`
                                    )
                                    .catch(err => {
                                        erroDb = {
                                            tabela: 'RASTREA',
                                            error: err.message,
                                        };
                                    });

                                await Movexa.update(exm, {
                                    where: {
                                        id: exm.id,
                                    },
                                    transaction,
                                }).catch(Movexa.sequelize, err => {
                                    erroDb = {
                                        tabela: 'MOVEXA',
                                        error: err.message,
                                    };
                                });

                                if (cretiquetaws) {
                                    await Etiquetaws.create(cretiquetaws, {
                                        transaction,
                                    }).catch(Movapoio.sequelize, err => {
                                        erroDb = {
                                            tabela: 'ETIQUETAWS',
                                            error: err.message,
                                        };
                                    });
                                }

                                await Movapoio.create(movapoio, {
                                    transaction,
                                }).catch(Movapoio.sequelize, err => {
                                    erroDb = {
                                        tabela: 'MOVAPOIO',
                                        error: err.message,
                                    };
                                });

                                if (crs_tab_logreg) {
                                    await TabLogReg.create(crs_tab_logreg, {
                                        transaction,
                                    }).catch(TabLogReg.sequelize, err => {
                                        erroDb = {
                                            tabela: 'TABLOGREG',
                                            error: err.message,
                                        };
                                    });
                                }
                            }
                        );

                        if (erroDb) {
                            try {
                                await rastreaWS(
                                    req,
                                    `Erro ao gravar no cursor ${erroDb.tabela} - ${erroDb.erro}`,
                                    exm.prontuario_id,
                                    exm.idmovpac,
                                    null,
                                    null,
                                    1
                                );

                                retornoWS.push({
                                    posto: pacPosto,
                                    amostra: pacAmostra,
                                    paciente: pacNome,
                                    status: 'erro',
                                    resposta: `Erro ao gravar no cursor ${erroDb.tabela} - ${erroDb.erro}`,
                                });
                            } catch (err) {
                                throw new Error(
                                    `${pacPosto}-${pacAmostra} - ${pacNome} - Erro ao gravar RASTREAWS`
                                );
                            }
                        } else {
                            // GRAVA LOG DE RETORNO DO APOIO
                            await rastreaWS(
                                req,
                                `Paciente atualizado com as informações do apoio`,
                                exm.prontuario_id,
                                exm.idmovpac
                            );
                            reportExames.push({ ...exm });
                        }
                    }
                }

                report.push({
                    paciente: `${pacPosto}${pacAmostra} - ${pacNome}`,
                    razao: pacRazao,
                    exames: reportExames,
                });

                imprimeEtiqueta.push(...etiquetas);
            }
        } catch (e) {
            if (e.isAxiosError) {
                if (e.root.Envelope.Body.Fault.detail.ExceptionDetail) {
                    try {
                        await rastreaWS(
                            req,
                            `Webservice Error: ${e.root.Envelope.Body.Fault.detail.ExceptionDetail.Message}`,
                            pac.prontuario_id,
                            pac.idmovpac,
                            null,
                            null,
                            1
                        );

                        retornoWS.push({
                            posto: pacPosto,
                            amostra: pacAmostra,
                            paciente: pacNome,
                            status: 'erro',
                            resposta: `Webservice Error: ${e.root.Envelope.Body.Fault.detail.ExceptionDetail.Message}`,
                        });
                    } catch (err) {
                        throw new Error(
                            `${pacPosto}-${pacAmostra} - ${pacNome} - Erro ao gravar RASTREAWS`
                        );
                    }
                }
            } else if (e.Fault) {
                const fault = e.Fault.faultstring;
                const posicaoInicial =
                    e.body.indexOf('<Descricao><![CDATA[') + 20;
                const posicaoFinal = e.body.indexOf(
                    ']]]]><![CDATA[></Descricao>'
                );
                const erro = e.body.substring(posicaoInicial, posicaoFinal);

                retornoWS.push({
                    posto: pacPosto,
                    amostra: pacAmostra,
                    paciente: pacNome,
                    status: 'erro',
                    resposta: `${fault} - ${erro}`,
                });
            } else {
                retornoWS.push({
                    posto: pacPosto,
                    amostra: pacAmostra,
                    paciente: pacNome,
                    status: 'erro',
                    resposta: e.message,
                });
            }
        }
    }

    if (!atendimento) {
        if (!leutubo) {
            return { retornoWS, report, imprimeEtiqueta };
        }
    }

    const retornoTubo = [];

    for (const item of report) {
        for (const exame of item.exames) {
            retornoTubo.push({ ...exame });
        }
    }

    return { retornoWS, retornoTubo, imprimeEtiqueta };
};

export default envio_db_ws;
