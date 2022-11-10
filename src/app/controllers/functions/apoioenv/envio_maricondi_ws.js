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
    }

    const api = axios.create({
        baseURL: endWeb,
    });

    const retornoWS = [];
    const report = [];
    const imprimeEtiqueta = [];

    for (const enviows of xmls) {
        const { xml, pac } = enviows;
        const pacPosto = pac.posto;
        const pacAmostra = pac.amostra;
        const pacNome = pac.nome.trim();
        const pacRazao = pac.razao.trim();

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
                const tubos = [];
                const Recipiente = retWS.Pedido[0].Recipiente;
                for (const tubo of Recipiente) {
                    let listaexames = '';
                    const codbarra = tubo.CodBarApoio[0];
                    const etiqueta = tubo.EtqCodBar[0];
                    // eslint-disable-next-line no-plusplus
                    for (let index = 0; index < tubo.Exame.length; index++) {
                        const element = tubo.Exame[index];
                        if (index === tubo.Exame.length - 1) {
                            listaexames += `${element.CodExmApoio[0]}`;
                        } else {
                            listaexames += `${element.CodExmApoio[0]},`;
                        }
                    }
                    tubos.push({
                        listaexames,
                        codbarra,
                        etiqueta,
                    });
                }

                const etiquetas = [];

                for (const exm of pac.exames) {
                    const getData = await PegaData(req, dt_banco);
                    const DataAtual = format(getData, 'yyyy-MM-dd');
                    const HoraAtual = await PegaHora(req, dt_banco);

                    const findTubo = tubos.find(item => {
                        return item.listaexames
                            .split(',')
                            .includes(exm.codigo.trim());
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
                                codapoio: retWS.CodLoteApoio[0],
                                idopera_ultacao: req.userId,
                                codbarras: findTubo.codbarra,
                                etiqueta: findTubo.etiqueta,
                            };
                            etiquetas.push(cretiquetaws);
                        } else {
                            etiquetaws_id = findtEiqueta.id;
                            cretiquetaws = '';
                        }

                        let exmCom = null;
                        switch (exm.codigo.trim()) {
                            case '0064':
                                exmCom = '1498';
                                break;
                            case '0174':
                                exmCom = '0188';
                                break;
                            case '0175':
                                exmCom = '0199';
                                break;
                            case '0267':
                            case '0268':
                            case '0864':
                                exmCom = '1155';
                                break;
                            case '0449':
                                exmCom = '0198';
                                break;
                            case '0922':
                                exmCom = '1343';
                                break;
                            case '0973':
                                exmCom = '1456';
                                break;
                            case '1066':
                                exmCom = '1566';
                                break;
                            case '1067':
                                exmCom = '1148';
                                break;
                            case '1213':
                                exmCom = '0182';
                                break;
                            case '1228':
                                exmCom = '0137';
                                break;
                            case '1456':
                                exmCom = '0973';
                                break;
                            case '1656':
                                exmCom = '0183';
                                break;
                            case '1660':
                                exmCom = '0109';
                                break;
                            case '1837':
                                exmCom = '1978';
                                break;
                            case '2065':
                                exmCom = '2068';
                                break;
                            case '2066':
                                exmCom = '2069';
                                break;
                            case '2067':
                                exmCom = '2070';
                                break;
                            case '2080':
                                exmCom = '2081';
                                break;
                            case '2081':
                                exmCom = '2080';
                                break;
                            default:
                                exmCom = '';
                                break;
                        }
                        if (exmCom) {
                            const findExtraTubo = tubos.find(item => {
                                return item.listaexames
                                    .split(',')
                                    .includes(exmCom);
                            });
                            cretiquetaws = {
                                ...cretiquetaws,
                                codbarras2: findExtraTubo.codbarra,
                                etiqueta2: findExtraTubo.etiqueta,
                            };
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
                        exm.codpedapoio = retWS.CodLoteApoio[0];
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

                        // AQUI VAI INICIAR UMA TRANSACTION
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

export default envio_maricondi_ws;
