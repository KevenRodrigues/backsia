/* eslint-disable radix */
/* eslint-disable prefer-destructuring */
/* eslint-disable func-names */
import xml2js, { parseString } from 'xml2js';
import axios from 'axios';
import * as _ from 'lodash';
import { Sequelize, QueryTypes } from 'sequelize';
import { parseISO, format } from 'date-fns';
import Database from '../../../../database';
import { PegaData, PegaHora, rastreaWS } from '../functions';

const envio_maricondi_ws = async (req, atendimento, leutubo, curarqapoio) => {
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
        renderOpts: {
            newline: '',
        },
        xmldec: {
            version: '1.0',
            encoding: 'ISO-8859-1',
        },
    });

    const campo = 'dt_banco';
    const getParam = await Operador.sequelize
        .query(`select ${campo} from param, param2`, {
            type: Sequelize.QueryTypes.SELECT,
        })
        .catch(err => {
            return err;
        });
    const { dt_banco } = getParam[0];

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
    let loteAtual = '';
    let LoteB2B = '';

    for (const pac of newCurarqapoio) {
        const pedido = [];

        const lote = await sequelize
            .query(`select nextval('lotewsmaricondi_id_seq')`, {
                type: QueryTypes.SELECT,
            })
            .then(response => {
                return response[0].nextval;
            })
            .catch(sequelize, err => {
                return err.message;
            });

        if (atendimento) {
            loteAtual = `${pac.posto}${pac.amostra}001`;
        } else {
            const getCurloteb2b = await sequelize
                .query(
                    `SELECT MAX(LOTEAPOIOB2B) AS LOTEAPOIOB2B FROM MOVEXA WHERE MOVPAC_ID = ${pac.movpac_id}`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .then(response => {
                    if (response[0].loteapoiob2b) {
                        return response[0];
                    }
                    return 0;
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            if (getCurloteb2b.loteapoiob2b) {
                if (getCurloteb2b.loteapoiob2b.length) {
                    let lotetrim = getCurloteb2b.loteapoiob2b.trim();
                    lotetrim = lotetrim.substring(9, 12);
                    LoteB2B = parseInt(lotetrim) + 1;
                    LoteB2B = String(LoteB2B).padStart(3, '0');
                }
            } else {
                LoteB2B = '001';
            }

            loteAtual = pac.posto + pac.amostra + LoteB2B;
        }

        const { nome, data_nasc, sexo } = pac;
        const exame = [];

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

            exm.CodExmApoio = { _: codigoAtual.trim() };
            exm.CodExmLab = { _: item.idmovexa };

            if (item.descmat) {
                exm.DescMat = {
                    _: item.descmat.trim(),
                };
            }

            exm.DataColeta = { _: item.dtcoleta || formatedDate() };

            const HrColeta = item.hrcoleta || '';
            if (HrColeta) {
                exm.HoraColeta = { _: `${item.hrcoleta}:00` };
            } else {
                exm.HoraColeta = { _: `${item.horaentra}:00` };
            }

            exame.push(exm);
        });

        pedido.push({
            CodPedLab: { _: loteAtual },
            DataPed: { _: formatedDate() },
            HoraPed: { _: getHour() },
            Obs: { _: '' },
            Paciente: {
                // eslint-disable-next-line radix
                CodPacLab: { _: loteAtual },
                Nome: { _: nome.trim() },
                Sexo: { _: sexo === 'M' ? 'Masculino' : 'Feminino' },
                ...validacaoPaciente,
            },
            Exame: exame,
        });

        const obj = {
            Registro: {
                Protocolo: {
                    _: '2',
                },
                ID: {
                    _: lote,
                },
                Lote: {
                    CodLab: {
                        _: CodLab,
                    },
                    CodLoteLab: {
                        _: lote,
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

    const api = axios.create({
        baseURL: endWeb,
    });

    const retornoWS = [];
    const report = [];

    for (const enviows of xmls) {
        const { xml, pac } = enviows;
        const pacPosto = pac.posto;
        const pacAmostra = pac.amostra;
        const pacNome = pac.nome.trim();

        let result = '';
        let retWS = '';

        result = await api
            .post('/cadastraPedido.wslab', xml, {
                headers: {
                    idcliente: CodLab,
                    chaveseguranca: SenhaLab,
                    'Content-Type': 'application/xml',
                    isxml: true,
                },
            })
            .catch(err => {
                if (err) {
                    throw new Error(
                        `Webservice Error: Falha na conexão via web service do endereço requisitado. Verifique se o endereço do apoio está correto, ou se o apoio encontra-se em funcionamento.`
                    );
                }
            });

        if (result.data.includes('Log de Erros')) {
            const posicaoInicial = result.data.indexOf('<body>') + 10;
            const posicaoFinal = result.data.indexOf('</body>');
            const erro = result.data.substring(posicaoInicial, posicaoFinal);
            retornoWS.push({
                posto: pacPosto,
                amostra: pacAmostra,
                paciente: pacNome,
                status: 'erro',
                resposta: erro,
            });
        } else {
            const isXML = result.data.includes('<?xml');
            if (isXML) {
                parseString(result.data, function(err, parseResult) {
                    if (err) {
                        return err;
                    }
                    // eslint-disable-next-line prefer-destructuring
                    retWS = parseResult.RegistroCodBarras.Lote[0];
                    return true;
                });

                let getCurarqapoio = {};
                const reportExames = [];

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

                // SEPARACAO
                const tuboExame = [];
                const Recipiente = retWS.Pedido[0].Recipiente;
                for (const tubo of Recipiente) {
                    for (const exame of tubo.Exame[0].CodExmApoio) {
                        const foundIndex = tuboExame.findIndex(
                            x => x.exame === exame
                        );

                        if (foundIndex >= 0) {
                            const newExame = tuboExame[foundIndex];
                            newExame.etiquetas.push({
                                CodBarApoio: tubo.CodBarApoio[0],
                                EtqCodBar: tubo.EtqCodBar[0],
                            });
                            tuboExame[foundIndex] = newExame;
                        } else {
                            tuboExame.push({
                                exame,
                                etiquetas: [
                                    {
                                        CodBarApoio: tubo.CodBarApoio[0],
                                        EtqCodBar: tubo.EtqCodBar[0],
                                    },
                                ],
                            });
                        }
                    }
                }

                let tuboAtual = '';
                let exmAtual = '';
                for (const exm of tuboExame) {
                    const findCurarqapoio = curarqapoio.filter(
                        item =>
                            item.postoamostra === pacPosto + pacAmostra &&
                            item.codlabexm.trim().toUpperCase() === exm.exame
                    );
                    // eslint-disable-next-line prefer-destructuring
                    getCurarqapoio = findCurarqapoio[0];

                    const getData = await PegaData(req, dt_banco);

                    const DataAtual = format(getData, 'yyyy-MM-dd');
                    const HoraAtual = await PegaHora(req, dt_banco);

                    let etiqueta_id = '';

                    let etiqueta = {
                        apoio_id: getCurarqapoio.id_apoio,
                        loteapoio: loteAtual,
                        codapoio: retWS.CodLoteApoio[0],
                        idopera_ultacao: req.userId,
                    };

                    // eslint-disable-next-line no-plusplus
                    for (let index = 0; index < exm.etiquetas.length; index++) {
                        const element = exm.etiquetas[index];
                        if (
                            tuboAtual !== element.CodBarApoio &&
                            exmAtual !== exm.exame
                        ) {
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
                            tuboAtual = element.CodBarApoio;
                            exmAtual = exm.exame;
                        }
                        etiqueta = {
                            id: etiqueta_id,
                            ...etiqueta,
                            [`codbarras${
                                index === 0 ? '' : index + 1
                            }`]: element.CodBarApoio,
                            [`etiqueta${
                                index === 0 ? '' : index + 1
                            }`]: element.EtqCodBar,
                        };
                    }

                    if (
                        (atendimento && getCurarqapoio.statusexm === 'TR') ||
                        !atendimento
                    ) {
                        getCurarqapoio.statusexm = 'AP';
                    }

                    getCurarqapoio.labapoio = 1;
                    getCurarqapoio.dtapoio = DataAtual;
                    getCurarqapoio.codexmapoiob2b =
                        exm.etiquetas[0].CodBarApoio;
                    getCurarqapoio.loteapoiob2b = loteAtual;
                    getCurarqapoio.codpedapoio = retWS.CodLoteApoio[0];
                    getCurarqapoio.codexmlabb2b = exm.exame;
                    getCurarqapoio.etiquetaws_id = etiqueta_id;
                    getCurarqapoio.apoio_id = getCurarqapoio.id_apoio;
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

                            await Etiquetaws.create(etiqueta, {
                                transaction,
                            }).catch(Movapoio.sequelize, err => {
                                erroDb = {
                                    tabela: 'ETIQUETAWS',
                                    error: err.message,
                                };
                            });

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

                report.push({
                    paciente: `${getCurarqapoio.postoamostra} - ${getCurarqapoio.nome}`,
                    razao: getCurarqapoio.razao,
                    exames: reportExames,
                });
            }
        }
    }

    if (!atendimento) {
        if (!leutubo) {
            return { retornoWS, report };
        }
    }

    const retornoTubo = [];

    for (const item of report) {
        for (const exame of item.exames) {
            retornoTubo.push({ ...exame });
        }
    }

    return { retornoWS, retornoTubo };
};

export default envio_maricondi_ws;
