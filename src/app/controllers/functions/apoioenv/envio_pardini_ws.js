/* eslint-disable func-names */
import xml2js from 'xml2js';
import { createClient } from 'soap';
import * as _ from 'lodash';
import { Sequelize, QueryTypes } from 'sequelize';
import { parseISO, format } from 'date-fns';
import Database from '../../../../database';
import { PegaData, PegaHora, rastreaWS } from '../functions';

const envio_pardini_ws = async (req, atendimento, leutubo, curarqapoio) => {
    // IMPORT DATABASE
    const {
        Operador,
        Movexa,
        Etiquetaws,
        Movapoio,
        TabLogReg,
    } = Database.getModels(req.database);
    const sequelize = Database.instances[req.database];

    const builder = new xml2js.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'ISO-8859-1',
        },
    });
    const campo = 'etq_fu';
    const getParam = await Operador.sequelize
        .query(`select ${campo} from param, param2`, {
            type: Sequelize.QueryTypes.SELECT,
        })
        .catch(err => {
            return err;
        });
    const { etq_fu } = getParam[0];

    const formatedDate = date => {
        const parseDate = date ? parseISO(date) : new Date();
        const formatetDate = format(parseDate, 'yyyy-MM-dd');
        return formatetDate;
    };
    const getHour = date => {
        const parseDate = date ? parseISO(date) : new Date();
        const formatetDate = format(parseDate, 'HH:mm:ss');
        return formatetDate;
    };
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

    const xmls = [];

    for (const pac of newCurarqapoio) {
        const pedido = [];

        const loteatual = await sequelize
            .query(`select nextval('loteapoiob2b_id_seq')`, {
                type: QueryTypes.SELECT,
            })
            .then(response => {
                return response[0].nextval;
            })
            .catch(sequelize, err => {
                return err.message;
            });

        const { nome, data_nasc, sexo } = pac;
        const exame = [];
        const medicos = [];

        const validacaoPaciente = {};

        if (data_nasc === '' || data_nasc.length <= 2) {
            validacaoPaciente.DataNasc = {
                _: '',
            };
        }

        if (data_nasc) {
            validacaoPaciente.DataNasc = {
                _: data_nasc,
            };
        }

        _.forEach(pac.exames, item => {
            const codigoAtual = item.codlabexm;
            const exm = {};

            const materialAtual =
                item.materialdi === '1'
                    ? 'DIV'
                    : (item.materiala && item.materiala.trim()) || '';

            if (materialAtual) {
                exm.CodExmApoio = {
                    _: `${materialAtual.trim()}|${codigoAtual.trim()}|1`,
                };
            } else {
                exm.CodExmApoio = {
                    _: `S|${codigoAtual.trim()}|1`,
                };
            }

            exm.CodExmLab = { _: item.idmovexa };

            if (item.descmat) {
                exm.DescMat = {
                    _: item.descmat.trim(),
                };
            }

            let DtColeta = '';
            if (etq_fu === '1') {
                DtColeta = item.dtcoleta || formatedDate();
            } else {
                DtColeta = item.dtcoleta || '';
            }

            let HrColeta = '';
            if (etq_fu === '1') {
                HrColeta = item.hrcoleta || getHour();
            } else {
                HrColeta = item.hrcoleta || '';
            }

            exm.DataColeta = { _: DtColeta };

            if (HrColeta) {
                exm.HoraColeta = { _: `${item.hrcoleta}:00` };
            } else {
                exm.HoraColeta = { _: `${item.horaentra}:00` };
            }

            if (item.conservante && item.conservante.trim()) {
                exm.Conservante = {
                    _: item.conservante.trim(),
                };
            }

            if (item.tpdiurese) {
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'TempoDiurese',
                    },
                    Valor: {
                        _: item.tpdiurese.trim(),
                    },
                };
            }

            if (item.volume) {
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'VolumeDiurese',
                    },
                    Valor: {
                        _: item.volume.trim(),
                    },
                };
            }

            if (item.peso) {
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'Peso',
                    },
                    Valor: {
                        _: `${item.peso.trim()}.0`,
                    },
                };
            }

            if (item.altura) {
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'Altura',
                    },
                    Valor: {
                        _: `${parseFloat(parseFloat(item.altura) / 100).toFixed(
                            2
                        )}.0`,
                    },
                };
            }

            if (item.linf) {
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'LinfocitosAbsoluto',
                    },
                    Valor: {
                        _: item.linf.trim(),
                    },
                };
            }

            if (item.teste_covid === '1') {
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'Sintoma',
                    },
                    Valor: {
                        _: item.sintoma === '1' ? 'S' : 'N',
                    },
                };
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'DataSintoma',
                    },
                    Valor: {
                        _: item.sintoma === '1' ? item.iniciosintomas : '',
                    },
                };
                exm.InformacaoComplementar = {
                    InfoComp: {
                        _: 'MunicipioResidencia',
                    },
                    Valor: {
                        _: item.municipio.trim(),
                    },
                };
            }

            let obsAtual = '';

            if (item.leuc) {
                obsAtual += `Leucocitos: ${item.leuc}`;
            }

            if (item.obsapo) {
                if (obsAtual) {
                    obsAtual = `${obsAtual} ${item.obsapo.trim()}`;
                } else {
                    obsAtual = item.obsap;
                }
            }

            if (obsAtual) {
                exm.Observacao = {
                    _: obsAtual.trim(),
                };
            }

            exm.idMedicoSolicitante = {
                _: item.medico_id || '0',
            };

            exame.push(exm);

            medicos.push({
                medico_id: item.medico_id,
                ufcrm: item.ufcrm ? item.ufcrm.trim() : '',
                crm: item.crm ? item.crm.trim() : '',
                nome_med: item.nome_med ? item.nome_med.trim() : '',
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
            const medicoObj = {};
            medicoObj.siglaConselho = { _: 'CRM' };
            medicoObj.ufConselho = { _: medico.ufcrm };
            medicoObj.numeroConselho = { _: medico.crm };
            medicoObj.Nome = {
                _: medico.nome_med ? medico.nome_med.trim() : 'NÃO INFORMADO',
            };
            medicoObj.seqmed = { _: medico.medico_id };
            arrayMedicos.push(medicoObj);
        }

        pedido.push({
            CodPedLab: { _: pac.postoamostra },
            Paciente: {
                // eslint-disable-next-line radix
                CodPacLab: { _: pac.postoamostra },
                Nome: { _: nome.trim() },
                Sexo: { _: sexo === 'M' ? 'Masculino' : 'Feminino' },
                ...validacaoPaciente,
            },
            Medico: arrayMedicos,
            Exame: exame,
        });

        const obj = {
            Registro: {
                Protocolo: {
                    _: '2',
                },
                ID: {
                    _: loteatual,
                },
                Lote: {
                    CodLab: {
                        _: CodLab,
                    },
                    CodLoteLab: {
                        _: loteatual,
                    },
                    DataLote: {
                        _: formatedDate(),
                    },
                    HoraLote: {
                        _: getHour(),
                    },
                    Pedido: pedido,
                },
            },
        };

        const xml = builder.buildObject(obj);
        xmls.push({ xml, pac });
        // return { xml };
    }

    const envioWs = XML => {
        return new Promise((resolve, reject) => {
            createClient(endWeb, function(err, client) {
                if (err) {
                    reject(err);
                }
                client.getPedido(
                    {
                        login: CodLab,
                        passwd: SenhaLab,
                        XML,
                    },
                    function(error, result) {
                        if (error) {
                            return reject(error);
                        }
                        return resolve(result);
                    }
                );
            });
        });
    };

    const retornoWS = [];
    const report = [];
    const imprimeEtiqueta = [];

    for (const enviows of xmls) {
        const { xml, pac } = enviows;
        const pacPosto = pac.posto;
        const pacAmostra = pac.amostra;
        const pacNome = pac.nome.trim();

        try {
            const result = await envioWs(xml);
            if (result.getPedidoResult.RegistroRejeitado) {
                retornoWS.push({
                    posto: pacPosto,
                    amostra: pacAmostra,
                    paciente: pacNome,
                    status: 'erro',
                    resposta: `Aqui vai o erro do retorno`,
                });
            } else {
                const solicitacao = result.getPedidoResult.RegistroAdmitido;

                const getData = await PegaData(req, getParam[0].dt_banco);

                const DataAtual = format(getData, 'yyyy-MM-dd');
                const HoraAtual = await PegaHora(req, getParam.dt_banco);

                let getCurarqapoio = {};
                const reportExames = [];

                let recipiente = [];

                if (solicitacao.Lote.Pedido.Recipiente.length > 0) {
                    recipiente = solicitacao.Lote.Pedido.Recipiente;
                } else {
                    recipiente.push(solicitacao.Lote.Pedido.Recipiente);
                }

                // GRAVA LOG DE RETORNO DO APOIO
                await rastreaWS(
                    req,
                    `Exames enviados e recebidos pelo apoio`,
                    pac.prontuario_id,
                    pac.idmovpac,
                    pac.idmovexa,
                    parseFloat(pac.layout_ws),
                    0
                );

                const etiquetas = [];

                for (const exames of recipiente) {
                    let examesArray = [];
                    if (Array.isArray(exames.Exame)) {
                        examesArray = exames.Exame;
                    } else {
                        examesArray.push(exames.Exame);
                    }

                    for (const exm of examesArray) {
                        const getExaCod = exm.CodExmApoio.match(
                            /(?<=\|)(.*?)(?=\|)/
                        );
                        const findCurarqapoio = curarqapoio.filter(
                            item =>
                                item.postoamostra === pacPosto + pacAmostra &&
                                item.codlabexm.trim().toUpperCase() ===
                                    getExaCod[0]
                        );
                        // eslint-disable-next-line prefer-destructuring
                        getCurarqapoio = findCurarqapoio[0];

                        let cretiquetaws = '';
                        let etiqueta_id = '';
                        const findtEiqueta = etiquetas.find(
                            item => item.codbarras === exames.CodBarApoio
                        );

                        if (!findtEiqueta) {
                            etiqueta_id = await sequelize
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
                                id: etiqueta_id,
                                apoio_id: getCurarqapoio.id_apoio,
                                loteapoio: solicitacao.Lote.CodLoteLab,
                                codapoio: solicitacao.Lote.Pedido.CodPedApoio,
                                codbarras: exames.CodBarApoio,
                                etiqueta: exames.EtqCodBar,
                                idopera_ultacao: req.userId,
                            };
                            etiquetas.push(cretiquetaws);
                        } else {
                            etiqueta_id = findtEiqueta.id;
                            cretiquetaws = '';
                        }

                        if (
                            (atendimento &&
                                getCurarqapoio.statusexm === 'TR') ||
                            !atendimento
                        ) {
                            getCurarqapoio.statusexm = 'AP';
                        }

                        getCurarqapoio.labapoio = 1;
                        getCurarqapoio.dtapoio = DataAtual;
                        getCurarqapoio.apoio_id = getCurarqapoio.id_apoio;
                        getCurarqapoio.codexmapoiob2b = exames.CodBarApoio;
                        getCurarqapoio.loteapoiob2b =
                            solicitacao.Lote.CodLoteLab;
                        getCurarqapoio.codpedapoio =
                            solicitacao.Lote.Pedido.CodPedApoio;
                        getCurarqapoio.codexmlabb2b = exm.CodExmApoio;
                        getCurarqapoio.etiquetaws_id = etiqueta_id;
                        getCurarqapoio.idopera_ultacao = req.userId;

                        const movapoio = {
                            posto: getCurarqapoio.posto,
                            amostra: getCurarqapoio.amostra,
                            exame_id: getCurarqapoio.exame_id,
                            movpac_id: getCurarqapoio.idmovpac,
                            movexa_id: getCurarqapoio.idmovexa,
                            apoio_id: getCurarqapoio.id_apoio,
                            operador_id: req.userId,
                            data: DataAtual,
                            hora: HoraAtual,
                            arquivo: 'ENVIO VIA WEB SERVICE',
                            idopera_ultacao: req.userId,
                        };

                        let crs_tab_logreg = '';

                        const volume =
                            getCurarqapoio.volume !== null
                                ? getCurarqapoio.volume.trim()
                                : '';

                        if (volume) {
                            crs_tab_logreg = {
                                tabela: 'movexa',
                                idreg: getCurarqapoio.id,
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

                        // AQUI VAI INICIAR UMA TRANSACTION
                        await Movexa.sequelize.transaction(
                            // eslint-disable-next-line no-loop-func
                            async transaction => {
                                await Movexa.sequelize
                                    .query(
                                        `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${getCurarqapoio.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'ENVIO DO EXAME PARA APOIO VIA WS STATUS: ${getCurarqapoio.statusexm}','${req.headers.host}')`
                                    )
                                    .catch(err => {
                                        erroDb = {
                                            tabela: 'RASTREA',
                                            error: err.message,
                                        };
                                    });

                                await Movexa.update(getCurarqapoio, {
                                    where: {
                                        id: getCurarqapoio.id,
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
                                    getCurarqapoio.prontuario_id,
                                    getCurarqapoio.idmovpac,
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
                                getCurarqapoio.prontuario_id,
                                getCurarqapoio.idmovpac
                            );
                            reportExames.push({ ...getCurarqapoio });
                        }
                    }
                }

                report.push({
                    paciente: `${getCurarqapoio.postoamostra} - ${getCurarqapoio.nome}`,
                    razao: getCurarqapoio.razao,
                    exames: reportExames,
                });
                getCurarqapoio = {};
                imprimeEtiqueta.push(...etiquetas);
            }
        } catch (e) {
            if (e.isAxiosError) {
                if (e.root.Envelope.Body.Fault.detail.info) {
                    try {
                        await rastreaWS(
                            req,
                            `Webservice Error: ${e.root.Envelope.Body.Fault.detail.info}`,
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
                            resposta: `Webservice Error: ${e.root.Envelope.Body.Fault.detail.info}`,
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

export default envio_pardini_ws;
