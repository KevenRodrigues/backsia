/* eslint-disable radix */
/* eslint-disable func-names */
import xml2js, { parseString } from 'xml2js';
import axios from 'axios';
import * as _ from 'lodash';
import { Sequelize, QueryTypes } from 'sequelize';
import { format } from 'date-fns';
import Database from '../../../../database';
import { PegaData, PegaHora } from '../functions';

const envio_alvaro_ws = async (req, atendimento, leutubo, curarqapoio) => {
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

    const groupBy = _.groupBy(curarqapoio, 'postoamostra');

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

    const newCurarqapoio = [];

    _.forEach(groupBy, async (pac, postoamostra) => {
        const groupExamesMaterial = _.groupBy(pac, 'materiala');
        const exames = [];
        _.forEach(groupExamesMaterial, (exms, materiala) => {
            exames.push({
                materiala,
                exms,
            });
        });
        newCurarqapoio.push({
            postoamostra,
            ...pac[0],
            exames,
        });
    });

    const errors = [];
    const xmls = [];

    for (const pac of newCurarqapoio) {
        let loteAtual = '';
        let LoteB2B = '';
        // const solicitacao = {};
        let entidade = {};
        // const paciente = {};
        // const medicos = {};
        const Data_Nasc = pac.data_nasc || '';
        const SexoAtual = pac.sexo || '';
        // const Data_Nasc = pac.data_nasc || '';
        // const SexoAtual = pac.sexo || '';

        if (!loteAtual) {
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
        }

        if (!Data_Nasc) {
            errors.push({
                error: `Paciente: ${
                    pac.postoamostra
                } - ${pac.nome.trim()} está sem data de nascimento informado, favor verificar.`,
            });
        }

        if (!SexoAtual) {
            errors.push({
                error: `Paciente: ${
                    pac.postoamostra
                } - ${pac.nome.trim()} está sem sexo informado, favor verificar.`,
            });
        }

        entidade = {
            $: {
                codigo: CodLab,
            },
        };

        entidade.pacientes = {
            paciente: {
                $: {
                    codigolis: loteAtual,
                    // nome: `TESTE - ${pac.nome.trim()}`,
                    nome: `INTEG. - SOFTEASY - ${pac.nome.trim()}`,
                    datanasc: `${Data_Nasc}-00:00`,
                    sexo: SexoAtual,
                },
            },
        };

        pac.crm = pac.crm ? pac.crm.trim() : '';
        pac.ufcrm = pac.ufcrm ? pac.ufcrm.trim() : '';

        let crmFinal = null;
        if (pac.crm.length + pac.ufcrm.length > 5) {
            crmFinal = `${pac.crm}-${pac.ufcrm}`;
            const nome_med = pac.nome_med
                ? 'NAO INFORMADO'
                : pac.nome_med.trim();
            entidade.medicos = {
                medico: {
                    $: {
                        crm: crmFinal,
                        nome: nome_med,
                    },
                },
            };
        }

        let Obsalvaro = '';
        Obsalvaro = pac.obsapo ? pac.obsapo : '';
        Obsalvaro = Obsalvaro.substr(0, 250);
        let dataSolicitacao = format(new Date(), 'yyyy-MM-dd');
        dataSolicitacao += '-00:00';
        let dataColeta = pac.dtcoleta;
        dataColeta = `${dataColeta}T${
            !pac.hrcoleta ? '00:00' : pac.hrcoleta.trim()
        }:00`;

        const amostra = [];

        for (const exame of pac.exames) {
            const exames = [];

            for (const exm of exame.exms) {
                let dadosadicionais = '';
                dadosadicionais += exm.linf
                    ? `linfocitos=${exm.linf.trim()} `
                    : '';
                dadosadicionais += exm.leuc
                    ? `leucocitos=${exm.leuc.trim()} `
                    : '';
                dadosadicionais += exm.volume
                    ? `volume=${exm.volume.trim()} `
                    : '';
                dadosadicionais += exm.peso ? `peso=${exm.peso.trim()} ` : '';
                dadosadicionais += exm.altura
                    ? `altura=${exm.altura.trim()} `
                    : '';
                dadosadicionais += exm.idadegest
                    ? `idadegestacionalsemanas=${exm.idadegest.trim()} `
                    : '';

                if (exm.cadeiab2b && !exm.cadeiab2b.trim()) {
                    dadosadicionais +=
                        exm.rg && !exm.rg.trim() ? '' : `rg:${exm.rg.trim()} `;
                    dadosadicionais +=
                        exm.cpf && !exm.cpf.trim()
                            ? ''
                            : `cpf:${exm.cpf.trim()} `;
                    dadosadicionais +=
                        exm.cadeiab2b && !exm.cadeiab2b.trim()
                            ? ''
                            : `cadeia:${exm.cadeiab2b.trim()} `;
                }

                dadosadicionais = dadosadicionais.substr(
                    0,
                    dadosadicionais.length - 1
                );
                exames.push({
                    $: {
                        codigo: exm.codlabexm ? exm.codlabexm.trim() : null,
                        idlis: exm.idmovexa ? exm.idmovexa : null,
                        dadosadicionais: dadosadicionais || null,
                    },
                });
            }

            amostra.push({
                $: {
                    descricao: exame.descamo ? exame.descamo.trim() : 'BASAL',
                    material: exame.materiala ? exame.materiala.trim() : null,
                },
                exame: [...exames],
            });
        }

        entidade.solicitacao = {
            $: {
                codigolis: loteAtual,
                codigopaciente: loteAtual,
                crm: crmFinal,
                observacao: Obsalvaro,
                data: dataSolicitacao,
                dataColeta,
            },
            amostra,
        };

        if (errors.length === 0) {
            const obj = {
                solicitacoes: {
                    $: {
                        datahora: `${DataAtual}T${HoraAtual}:00.000-03:00`,
                        idagente: curarqapoio[0].ws_idagente.trim(),
                        lis: 'EASYLAB',
                        operador: req.userId,
                        senha: SenhaLab,
                        versao: curarqapoio[0].ws_versao
                            ? curarqapoio[0].ws_versao.trim()
                            : '',
                    },
                    entidade,
                },
            };

            const xml = builder.buildObject(obj);
            xmls.push({ xml, pac });
        }
    }

    if (errors.length > 0) {
        return errors;
    }

    const api = axios.create({
        baseURL: endWeb,
    });

    const retornoWS = [];
    const report = [];
    const imprimeEtiqueta = [];

    for (const enviows of xmls) {
        let { xml } = enviows;
        const pacPosto = enviows.pac.posto;
        const pacAmostra = enviows.pac.amostra;
        const pacNome = enviows.pac.nome.trim();

        let result = '';
        let retWS = '';

        result = await api
            .put('/', xml, {
                headers: { 'Content-Type': 'text/xml' },
            })
            .catch(err => {
                throw new Error(`Webservice Error: ${err.response.data}`);
            });

        if (result && result.data) {
            const incluso = result.data.includes(
                'já está cadastrada para o agente:'
            );
            if (incluso) {
                parseString(result.data, function(err, parseResult) {
                    if (err) {
                        return err;
                    }
                    retWS = parseResult;
                    return true;
                });
                const solicitacao = retWS.aol.solicitacoes[0].solicitacao[0];
                const { idLis } = solicitacao.$;
                let newLote = idLis ? parseInt(idLis.substring(9, 12)) + 1 : 0;
                newLote = String(newLote).padStart(3, '0');
                const postoAmostra = idLis.substring(0, 9);

                xml = xml.split(idLis).join(`${postoAmostra + newLote}`);

                result = await api
                    .put('/', xml, {
                        headers: { 'Content-Type': 'text/xml' },
                    })
                    .catch(err => {
                        throw new Error(
                            `Webservice Error: ${err.response.data}`
                        );
                    });
            }
        }

        // eslint-disable-next-line valid-typeof
        if (result && result.data) {
            // CONVERTE XML PRA OBJETO
            const isXML = result.data.includes(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            );
            if (isXML) {
                parseString(result.data, function(err, parseResult) {
                    if (err) {
                        return err;
                    }
                    retWS = parseResult;
                    return true;
                });
                const solicitacao = retWS.aol.solicitacoes[0].solicitacao[0];

                if (solicitacao.$.incluido === 'true') {
                    let getCurarqapoio = {};
                    const reportExames = [];
                    const etiquetas = [];
                    for (const amostra of solicitacao.amostra) {
                        for (const exame of amostra.exame) {
                            let cretiquetaws = '';
                            let etiqueta_id = '';
                            const findtEiqueta = etiquetas.find(
                                item =>
                                    item.codbarras === amostra.$.codigoBarras
                            );

                            const findCurarqapoio = curarqapoio.filter(
                                item =>
                                    item.postoamostra ===
                                        pacPosto + pacAmostra &&
                                    item.codlabexm.trim().toUpperCase() ===
                                        exame.$.exame.toUpperCase()
                            );
                            // eslint-disable-next-line prefer-destructuring
                            getCurarqapoio = findCurarqapoio[0];

                            if (!findtEiqueta) {
                                etiqueta_id = await sequelize
                                    .query(
                                        `select nextval('etiquetaws_id_seq')`,
                                        {
                                            type: QueryTypes.SELECT,
                                        }
                                    )
                                    .then(response => {
                                        return response[0].nextval;
                                    })
                                    .catch(sequelize, err => {
                                        return err.message;
                                    });

                                cretiquetaws = {
                                    id: etiqueta_id,
                                    apoio_id: getCurarqapoio.id_apoio,
                                    loteapoio: solicitacao.$.idLis,
                                    codapoio: solicitacao.$.idAlvaro,
                                    codbarras: amostra.$.codigoBarras,
                                    etiqueta:
                                        amostra.layoutetiqueta[0].layout[0],
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
                            getCurarqapoio.codexmapoiob2b =
                                amostra.$.codigoBarras;
                            getCurarqapoio.loteapoiob2b = solicitacao.$.idLis;
                            getCurarqapoio.codpedapoio = solicitacao.$.idAlvaro;
                            getCurarqapoio.codexmlabb2b = exame.$.exame;
                            getCurarqapoio.etiquetaws_id = etiqueta_id;

                            const movapoio = {
                                posto: getCurarqapoio.posto,
                                amostra: getCurarqapoio.amostra,
                                exame_id: getCurarqapoio.exame_id,
                                movpac_id: getCurarqapoio.idmovpac,
                                movexa_id: getCurarqapoio.idmovexa,
                                apoio_id: getCurarqapoio.id_apoio,
                                operador_id: result.userId,
                                data: DataAtual,
                                hora: HoraAtual,
                                arquivo: 'envio via web service',
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
                                };
                            }

                            // AQUI VAI INICIAR UMA TRANSACTION
                            await Movexa.sequelize.transaction(
                                // eslint-disable-next-line no-loop-func
                                async transaction => {
                                    await Movexa.sequelize
                                        .query(
                                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${getCurarqapoio.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'ENVIO DO EXAME PARA APOIO VIA WS STATUS: ${getCurarqapoio.statusexm}','${req.headers.host}')`
                                        )
                                        .catch(err => {
                                            return { error: err.message };
                                        });

                                    await Movexa.update(getCurarqapoio, {
                                        where: {
                                            id: getCurarqapoio.id,
                                        },
                                        transaction,
                                    }).catch(Movexa.sequelize, err => {
                                        return { error: err.message };
                                    });

                                    if (cretiquetaws) {
                                        await Etiquetaws.create(cretiquetaws, {
                                            transaction,
                                        }).catch(Movapoio.sequelize, err => {
                                            return { error: err.message };
                                        });
                                    }

                                    await Movapoio.create(movapoio, {
                                        transaction,
                                    }).catch(Movapoio.sequelize, err => {
                                        return { error: err.message };
                                    });

                                    if (crs_tab_logreg) {
                                        await TabLogReg.create(crs_tab_logreg, {
                                            transaction,
                                        }).catch(TabLogReg.sequelize, err => {
                                            return { error: err.message };
                                        });
                                    }
                                }
                            );
                            reportExames.push({ ...getCurarqapoio });
                        }
                    }
                    report.push({
                        paciente: `${getCurarqapoio.postoamostra} - ${getCurarqapoio.nome}`,
                        razao: getCurarqapoio.razao,
                        exames: reportExames,
                    });
                    imprimeEtiqueta.push(...etiquetas);
                } else {
                    if (solicitacao.amostra) {
                        retornoWS.push({
                            posto: pacPosto,
                            amostra: pacAmostra,
                            paciente: pacNome,
                            status: 'erro',
                            resposta: `${solicitacao.$.informacao} ${solicitacao.amostra[0].$.informacao}`,
                        });
                    }
                    retornoWS.push({
                        posto: pacPosto,
                        amostra: pacAmostra,
                        paciente: pacNome,
                        status: 'erro',
                        resposta: solicitacao.$.informacao,
                    });
                }
            } else {
                throw new Error(`Webservice Error: ${result.data}`);
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

export default envio_alvaro_ws;
