import { Sequelize, QueryTypes, Op } from 'sequelize';
import { format, parseISO } from 'date-fns';
import * as _ from 'lodash';
import Database from '../../database';
import { gerarRelatorioHtml } from './functions/functions';

class FaturamentoConvenioController {
    async index(req, res) {
        const sequelize = Database.instances[req.database];
        const { Operador, Convenio, Plano } = Database.getModels(req.database);
        const {
            convperm,
            dataInicial,
            dataFinal,
            posto,
            ordem,
            opcaodata,
            chkrelcustoexa,
            chkresul,
            chkobs,
            obs,
            chkfatuni,
            chkrelgeral,
            chkvaloratend,
            optrelgeral,
            chktodosconvplan,
            chktodosinativos,
            chkposto,
            cmbfaturado,
            cmbmodelo,
            chkconfere,
            envio,
            prontuario,
            setor,
            medico,
            apoio,
        } = req.query;

        // Faz validação dos parametros
        const campo = 'ncfat';
        const getParam = await Operador.sequelize
            .query(`select ${campo} from param, param2`, {
                type: Sequelize.QueryTypes.SELECT,
            })
            .catch(err => {
                return res.status(400).json({ error: err.message });
            });
        const { ncfat } = getParam[0];

        const html = [];

        let curfat = [];
        let curgeral = [];
        let curfinal = [];

        const curplanos = [];
        let gerarel = false;
        let cursorfinal = false;
        let mcurgeral = false;

        let relgeral = '';
        let fatuni = '';

        if (chkrelgeral === 'false') {
            relgeral = false;
            let queryPlanos = req.query.plano;
            queryPlanos = queryPlanos.replace("'", '').replace(' ', '');
            queryPlanos = queryPlanos.split(',');

            const getPlanos = await Plano.findAll({
                where: {
                    id: {
                        [Op.in]: queryPlanos,
                    },
                },
                attributes: ['id', 'convenio_id', 'status'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            for (const plano of getPlanos) {
                curplanos.push({
                    id: plano.id,
                    convenio_id: plano.convenio_id,
                });
            }
        } else {
            relgeral = true;
            if (chktodosconvplan === 'true') {
                let getPlanos = [];
                let makeWhere = '';
                if (chktodosinativos === 'false') {
                    makeWhere = { status: 0 };
                }
                if (convperm !== '') {
                    let queryConvPerm = convperm
                        .replace("'", '')
                        .replace(' ', '');
                    queryConvPerm = queryConvPerm.split(',');
                    getPlanos = await Plano.findAll({
                        where: makeWhere,
                        attributes: ['id', 'convenio_id', 'status'],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                where: {
                                    codigo: {
                                        [Op.in]: queryConvPerm,
                                    },
                                },
                                attributes: ['codigo'],
                            },
                        ],
                    }).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
                } else {
                    getPlanos = await Plano.findAll({
                        attributes: ['id', 'convenio_id'],
                        include: [
                            {
                                model: Convenio,
                                as: 'convenio',
                                where: makeWhere,
                                attributes: ['codigo'],
                            },
                        ],
                    }).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
                }

                for (const plano of getPlanos) {
                    curplanos.push({
                        id: plano.id,
                        convenio_id: plano.convenio_id,
                    });
                }
            } else {
                let queryPlanos = req.query.plano;
                queryPlanos = queryPlanos.replace("'", '').replace(' ', '');
                queryPlanos = queryPlanos.split(',');
                const getPlanos = await Plano.findAll({
                    where: {
                        id: {
                            [Op.in]: queryPlanos,
                        },
                    },
                    attributes: ['id', 'convenio_id'],
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                for (const plano of getPlanos) {
                    curplanos.push({
                        id: plano.id,
                        convenio_id: plano.convenio_id,
                    });
                }
            }
        }

        if (chkfatuni === 'false') {
            fatuni = false;
        } else {
            fatuni = true;
        }

        for (const plano of curplanos) {
            gerarel = true;
            if (gerarel) {
                let instrucaosql = `
            SELECT
            DISTINCT(MOVPAC.ID) AS IDMOVPAC,
            PRONTUARIO.NOME,
            MOVEXA.ID,
            MOVEXA.POSTO,
            MOVEXA.AMOSTRA,
            MOVEXA.MOVPAC_ID,
            MOVEXA.DATAENTRA,
            MOVEXA.DTFATURA,
            MOVEXA.EXAME_ID,
            MOVEXA.STATUSEXM,
            MOVEXA.CONVENIO_ID,
            MOVEXA.PLANO_ID,
            MOVEXA.VALCOPARTIC,
            descstatus(MOVEXA.STATUSEXM) as statusexm_descricao,
            desccorstatus(MOVEXA.STATUSEXM) as statusexm_cor,
            PLANO.CODIGO AS CODPLANO,
            CONVENIO.CODIGO AS CODCONV,
            CONVENIO.FANTASIA,
            -- PLANO.ID,
            PLANO.DESCRICAO AS DESCPLANO,
            PLANO.VALCH,
            PLANO.PERCPAC,
            PLANO.PERCCONV,
            PLANO.TABELA_ID,
            CONVENIO.RAZAO,
            CONVENIO.CGC_CPF,
            CONVENIO.ENDERECO,
            CONVENIO.IMPEST,
            -- EXAME.ID,
            EXAME.CODIGO,
            EXAME.DEPARA,
            EXAME.DESCRICAO                      AS DESCEXAME,
            EXAME.FANTASIA                       AS FANTASIA_EXAME,
            CAST('' AS CHAR(50))                 AS TABAMB,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALOREXA,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALORPAC,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALORCONV,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALORCONVESP,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALORPACESP,
            CAST('' AS CHAR(50))                 AS ESPECAMB,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALPACIENTE,
            CAST('00000000.00' AS NUMERIC(10,2)) AS VALCONVENIO,
            CAST('' AS CHAR(50))                 AS AMB,
            CAST('' AS CHAR(50))                 AS OBS,
            CAST('' AS CHAR(50))                 AS MOTIVONC,
            CAST('0' AS NUMERIC(11))             AS PACIENTE,
            CAST('0' AS NUMERIC(1))              AS MARCA,
            MOVEXA.MATRICULA,
            MOVEXA.REQUISICAO,
            MEDICO.CRM,
            MEDICO.NOME_MED,
            MEDICO.UFCRM,
            MEDICO.CPF,
            PRONTUARIO.EMPRESA,
            PRONTUARIO.VALPLANO,
            MOVEXA.VALBRUTO,
            MOVEXA.AMB AS AMBMOVEXA,
            MOVEXA.VALCONV,
            MOVEXA.VALPAC,
            MOVEXA.REDUCAOACRESCIMO,
            MOVEXA.CUSTOUNIT,
            MOVPAC.DESCVAL,
            MOVPAC.ACRESVAL,
            MOVPAC.DESCPERC,
            MOVPAC.ACRESPERC,
            MOVPAC.TOTALPACI,
            MOVPAC.TOTREC,
            MOVPAC.DIFERENCA,
            EXAME.ESPTAB_ID,
            MOVPAC.TOTPAG,
            MOVPAC.CUSTOPAC,
            MOVPAC.ENTREGA_ID,
            ENTREGA.DESCRICAO AS DESCENTREGA,
            ENTREGA.CODIGO AS CODENTREGA,
            PORTE.CODIGO AS CODPORTE,
            PORTE.VALOR AS VALORPORTE,
            PLANO.BANDA_PORTE,
            PLANO.BANDA_UCO,
            CAST('00000000.00' AS NUMERIC(10,2)) AS PESO_PORTE,
            CAST('00000000.00' AS NUMERIC(10,2)) AS PESO_UCO,
            PLANO.TIPOTAB,
            MOVPAC.HORAENTRA,
            PRONTUARIO.POSTO AS POSTO_PRONTU,
            PRONTUARIO.PRONTUARIO,
            EXAME.SETOR_ID,
            SETOR.DESCRICAO AS DESCSETOR,
            POSTO.DESCRICAO AS DESCPOSTO,
            CAST(COALESCE(MOVEXA.QTDEXAME,1) AS NUMERIC(5,0)) AS QTDEXAME,
            EXAME.DEPARA,
            CAST('' AS CHAR(15))  AS CODPROC,
            CAST('' AS CHAR(100)) AS DESCPROC
            FROM MOVEXA
            LEFT JOIN EXAME      ON EXAME.ID = MOVEXA.EXAME_ID
            LEFT JOIN PLANO      ON PLANO.ID = MOVEXA.PLANO_ID
            LEFT JOIN CONVENIO   ON CONVENIO.ID = MOVEXA.CONVENIO_ID
            LEFT JOIN MOVPAC     ON MOVPAC.ID = MOVEXA.MOVPAC_ID
            LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
            LEFT JOIN MEDICO     ON MEDICO.ID = MOVEXA.MEDICO_ID
            LEFT JOIN ENTREGA    ON ENTREGA.ID = MOVPAC.ENTREGA_ID
            LEFT JOIN PORTE      ON PORTE.ID = EXAME.PORTE_ID
            LEFT JOIN SETOR		 ON SETOR.ID = EXAME.SETOR_ID
            LEFT JOIN POSTO		 ON POSTO.CODIGO = MOVEXA.POSTO
        `;

                if (relgeral) {
                    if (!mcurgeral) {
                        curgeral = await sequelize
                            .query(`${instrucaosql} WHERE 1=0`, {
                                type: QueryTypes.SELECT,
                            })
                            .catch(sequelize, err => {
                                return err.message;
                            });
                        mcurgeral = true;
                    }
                } else if (!cursorfinal && fatuni) {
                    curfinal = await sequelize
                        .query(`${instrucaosql} WHERE 1=0`, {
                            type: QueryTypes.SELECT,
                        })
                        .catch(sequelize, err => {
                            return err.message;
                        });
                    cursorfinal = true;
                }

                switch (opcaodata) {
                    case '1':
                        instrucaosql += ` WHERE MOVEXA.DTFATURA BETWEEN '${dataInicial}' AND '${dataFinal}' `;
                        break;
                    case '2':
                        instrucaosql += ` WHERE MOVEXA.DTCOLETA BETWEEN '${dataInicial}' AND '${dataFinal}' `;
                        break;
                    case '3':
                        instrucaosql += ` WHERE MOVEXA.DATAENTRA BETWEEN '${dataInicial}' AND '${dataFinal}' `;
                        break;
                    default:
                        break;
                }

                instrucaosql += ` AND plano.id = '${plano.id}' AND `;

                // DUVIDA DE COMO SERIA ESSA FUNÇÃO NO WEB
                // IF M.RELGERAL = .F. && Grava log de ultima geracao caso nao seja relatorio geral
                // 	    SELECT CURPLANO
                // 	    M.RECATU = RECNO("CURPLANO")
                // 	    REPLACE DTULTGER WITH DATE(), OPERADOR_ID_ULTGER WITH _screen.opera, NOME WITH _screen.nomeopera, DTULTGERINI WITH thisform.textbox_padrao1.Value, DTULTGERFIN WITH thisform.textbox_padrao2.Value IN CURPLANO
                // 	    .metodo_pad.grava_log(.F.,"PLANO","id",CURPLANO.ID,_screen.opera,"CURPLANO")
                // 	    .metodo_pad.grava_dados("CURPLANO")
                // 	    SELECT CURPLANO
                // 	    GO M.RECATU
                // 	ENDIF

                gerarel = false;

                if (posto) {
                    instrucaosql += ` MOVEXA.POSTO IN(${posto})`;
                    gerarel = true;
                }

                instrucaosql += " AND COALESCE(MOVEXA.NAOFATURA,0) = '0' ";

                if (envio) {
                    instrucaosql += ` AND MOVPAC.ENVIO_ID = ${envio}`;
                }
                if (prontuario) {
                    instrucaosql += ` AND MOVPAC.PRONTUARIO_ID = ${prontuario}`;
                }
                if (medico) {
                    instrucaosql += ` AND MOVEXA.MEDICO_ID = ${medico}`;
                }
                if (setor) {
                    instrucaosql += ` AND EXAME.SETOR_ID = ${setor}`;
                }
                if (apoio) {
                    instrucaosql += ` AND EXAME.APOIO_ID = ${apoio}`;
                }
                if (chkresul === 'true') {
                    instrucaosql +=
                        " AND  (MOVEXA.STATUSEXM <> 'FU' AND MOVEXA.STATUSEXM <> 'FM' AND MOVEXA.STATUSEXM <> 'NC' AND MOVEXA.STATUSEXM <> 'TR' AND ";
                    instrucaosql +=
                        " MOVEXA.STATUSEXM <> 'AP' AND MOVEXA.STATUSEXM <> 'ER' AND MOVEXA.STATUSEXM <> 'BL' AND MOVEXA.STATUSEXM <> 'LP') ";
                }

                switch (cmbfaturado) {
                    case 'NÃO':
                        instrucaosql +=
                            " AND COALESCE(MOVEXA.CONFFAT,0) = '0' ";
                        break;
                    case 'SIM':
                        instrucaosql += " AND MOVEXA.CONFFAT = '1' ";
                        break;
                    case 'TODOS':
                        break;
                    default:
                        break;
                }

                switch (ordem) {
                    case 'ALFABETICA':
                        instrucaosql +=
                            ' ORDER BY PRONTUARIO.NOME, MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.ID ';
                        break;
                    case 'OS':
                        instrucaosql +=
                            ' ORDER BY MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.ID ';
                        break;
                    case 'DATA':
                        instrucaosql +=
                            ' ORDER BY MOVEXA.DTFATURA, PRONTUARIO.NOME, MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.ID ';
                        break;
                    case 'ENTREGA':
                        instrucaosql +=
                            ' ORDER BY MOVPAC.ENTREGA_ID, PRONTUARIO.NOME, MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.ID ';
                        break;
                    default:
                        instrucaosql +=
                            ' ORDER BY MOVEXA.POSTO, MOVEXA.AMOSTRA, MOVEXA.ID ';
                        break;
                }

                curfat = await sequelize
                    .query(instrucaosql, {
                        type: QueryTypes.SELECT,
                    })
                    .catch(sequelize, err => {
                        return err.message;
                    });

                curfat.map(item => {
                    item.postoamostra = `${item.posto}-${item.amostra}`;
                    item.especamb = item.especamb ? item.especamb.trim() : '';
                    return item;
                });

                if (curfat.length > 0) {
                    const convenio_spec = await sequelize
                        .query(
                            `SELECT * FROM CONVENIO_ESPEC WHERE CONVENIO_ESPEC.PLANO_ID = ${plano.id}`,
                            {
                                type: QueryTypes.SELECT,
                            }
                        )
                        .catch(sequelize, err => {
                            return err.message;
                        });

                    const tabela1 = await sequelize
                        .query(
                            `SELECT * FROM TABELA1 WHERE TABELA1.TABELA_ID = ${curfat[0].tabela_id}`,
                            {
                                type: QueryTypes.SELECT,
                            }
                        )
                        .catch(sequelize, err => {
                            return err.message;
                        });

                    const valespec = await sequelize
                        .query(
                            `SELECT * FROM VALESPEC WHERE VALESPEC.PLANO_ID = ${plano.id}`,
                            {
                                type: QueryTypes.SELECT,
                            }
                        )
                        .catch(sequelize, err => {
                            return err.message;
                        });

                    for (const fat of curfat) {
                        if (chkvaloratend === 'true') {
                            fat.tabamb = fat.ambmovexa || '';
                            fat.valorexa = fat.valbruto;
                            fat.valorpac = fat.valpac || 0;
                            fat.valorconv = fat.valconv || 0;

                            const findTabela1 = tabela1.find(
                                x => x.exame_id === fat.exame_id
                            );

                            if (findTabela1) {
                                fat.codproc = findTabela1.codproc || '';
                                fat.descproc = findTabela1.descproc || '';
                            }
                        } else {
                            const findConvenioSpec = convenio_spec.find(
                                x => x.esptab_id === fat.esptab_id
                            );

                            if (findConvenioSpec) {
                                fat.valch = findConvenioSpec.valorch || 0;
                            }

                            const findTabela1 = tabela1.find(
                                x => x.exame_id === fat.exame_id
                            );

                            if (findTabela1) {
                                if (fat.tipotab === '2') {
                                    let calcporte = 0;
                                    let calcuco = 0;
                                    let calcvalorexa = 0;

                                    calcporte =
                                        (parseFloat(
                                            findTabela1.peso_porte ?? 0
                                        ) *
                                            parseFloat(fat.valorporte ?? 0) *
                                            parseFloat(fat.banda_porte ?? 0)) /
                                        100;
                                    calcuco =
                                        (parseFloat(findTabela1.peso_uco ?? 0) *
                                            parseFloat(fat.valch ?? 0) *
                                            parseFloat(fat.banda_uco ?? 0)) /
                                        100;
                                    calcvalorexa = calcporte + calcuco;
                                    fat.tabamb = findTabela1.codamb
                                        ? findTabela1.codamb.trim()
                                        : 0;
                                    fat.codproc = findTabela1.codproc ?? 0;
                                    fat.descproc = findTabela1.descproc ?? 0;
                                    fat.valorexa =
                                        calcvalorexa *
                                        parseFloat(fat.qtdexame ?? 1);
                                    fat.valorpac =
                                        (calcvalorexa / 100) *
                                        parseFloat(fat.percpac ?? 0) *
                                        parseFloat(fat.qtdexame ?? 1);
                                    fat.valorconv =
                                        (calcvalorexa / 100) *
                                        parseFloat(fat.percconv ?? 0) *
                                        parseFloat(fat.reducaoacrescimo ?? 1) *
                                        parseFloat(fat.qtdexame ?? 1);
                                    fat.peso_porte = parseFloat(
                                        tabela1.peso_porte ?? 0
                                    );
                                    fat.peso_uco = parseFloat(
                                        tabela1.peso_uco ?? 0
                                    );
                                } else {
                                    fat.tabamb = findTabela1.codamb
                                        ? findTabela1.codamb.trim()
                                        : 0;
                                    fat.codproc = findTabela1.codproc ?? '';
                                    fat.descproc = findTabela1.descproc ?? '';
                                    fat.valorexa =
                                        parseFloat(findTabela1.valorexa ?? 0) *
                                        parseFloat(fat.qtdexame ?? 1);
                                    fat.valorpac =
                                        ((parseFloat(findTabela1.valorexa) *
                                            parseFloat(fat.valch)) /
                                            100) *
                                        parseFloat(fat.percpac ?? 0.0) *
                                        parseFloat(fat.qtdexame ?? 1);
                                    fat.valorconv =
                                        ((parseFloat(findTabela1.valorexa) *
                                            parseFloat(fat.valch)) /
                                            100) *
                                        parseFloat(fat.percconv ?? 0.0) *
                                        parseFloat(
                                            fat.reducaoacrescimo ?? 1.0
                                        ) *
                                        parseFloat(fat.qtdexame ?? 1);
                                }
                            }

                            const findValSpec = await valespec.find(
                                x => x.exame_id === fat.exame_id
                            );

                            if (findValSpec) {
                                fat.especamb = findValSpec.codamb
                                    ? findValSpec.codamb.trim()
                                    : '';
                                fat.valorconvesp =
                                    (parseFloat(findValSpec.valorexa) / 100) *
                                    parseFloat(findValSpec.percconv ?? 0.0) *
                                    parseFloat(fat.reducaoacrescimo ?? 1) *
                                    parseFloat(fat.qtdexame ?? 1);
                                fat.valorpacesp =
                                    (parseFloat(findValSpec.valorexa) / 100) *
                                    parseFloat(findValSpec.percpac ?? 0.0) *
                                    parseFloat(fat.qtdexame ?? 1);
                            }
                        }
                    }
                }

                let temesp = false;

                curfat.map(async fat => {
                    temesp = false;
                    if (
                        parseFloat(fat.valorconvesp ?? 0) > 0 &&
                        chkvaloratend === 'false'
                    ) {
                        fat.valconvenio = fat.valorconvesp;
                        fat.valpaciente = fat.valorpacesp;
                        temesp = true;
                    } else {
                        fat.valconvenio = fat.valorconv;
                    }

                    if (
                        parseFloat(fat.valorpacesp ?? 0) > 0 &&
                        chkvaloratend === 'false'
                    ) {
                        fat.valconvenio = fat.valorconvesp;
                        fat.valpaciente = fat.valorpacesp;
                    } else if (!temesp) {
                        fat.valpaciente = fat.valorpac;
                    }

                    if (
                        (fat.especamb ?? '') !== '' &&
                        chkvaloratend === 'false'
                    ) {
                        fat.amb = fat.especamb;
                    } else {
                        fat.amb = fat.tabamb;
                    }

                    if ((ncfat ?? '0') === '1') {
                        if ((fat.statusexm ?? '') === 'NC') {
                            const curnc = await sequelize
                                .query(
                                    `SELECT MOTIVO.DESCRICAO FROM MOTIVO LEFT JOIN NOVACOL ON NOVACOL.MOTIVO_ID = MOTIVO.ID WHERE NOVACOL.MOVPAC_ID = ${fat.movpac_id} AND NOVACOL.EXAME_ID = ${fat.exame_id}`,
                                    {
                                        type: QueryTypes.SELECT,
                                    }
                                )
                                .catch(sequelize, err => {
                                    return err.message;
                                });
                            fat.valpaciente = 0.0;
                            fat.valconvenio = 0.0;
                            fat.motivonc = `NOVA COLETA : ${curnc.descricao ??
                                ''}`;
                        }
                    }
                    return fat;
                });

                if (chkobs === 'true') {
                    curfat.map(item => {
                        item.obs = obs;
                        return item;
                    });
                }

                if (chkrelgeral === 'true') {
                    if (curfat.length > 0) {
                        curgeral = [...curgeral, ...curfat];
                    }
                } else if (!fatuni) {
                    if (curfat.length > 0) {
                        if (chkrelcustoexa === 'true') {
                            const newCurfat = curfat.map(item => {
                                item.margem =
                                    parseFloat(item.valconvenio) -
                                    parseFloat(item.custounit);
                                return item;
                            });
                            const curfatgroupby = _.groupBy(
                                newCurfat,
                                'postoamostra'
                            );

                            const dados = [];
                            _.forEach(curfatgroupby, (pac, key) => {
                                const obj = {
                                    postoamostra: key,
                                    dataentra: format(
                                        parseISO(pac[0].dataentra),
                                        'dd/MM/yyyy'
                                    ),
                                    nome: pac[0].nome.trim(),
                                    exames: _.sortBy(pac, 'codigo'),
                                    totpac: 1,
                                    totexa: pac.length,
                                    totvenda: parseFloat(
                                        pac.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valconvenio)
                                            );
                                        }, 0)
                                    ).toFixed(2),
                                    totcusto: parseFloat(
                                        pac.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.custounit)
                                            );
                                        }, 0)
                                    ).toFixed(2),
                                    totmargem: parseFloat(
                                        pac.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.margem)
                                            );
                                        }, 0)
                                    ).toFixed(2),
                                };
                                dados.push(obj);
                            });

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totpac);
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totexa);
                                }, 0),
                                totvenda: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.totvenda)
                                    );
                                }, 0),
                                totcusto: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.totcusto)
                                    );
                                }, 0),
                                totmargem: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.totmargem)
                                    );
                                }, 0),
                            };

                            // MONTANDO O RELATORIO PLANO
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatcusto${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { totalgeral, dados };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({ error: err.message });
                            }
                        } else {
                            const curfatgroupby = _.groupBy(
                                curfat,
                                'postoamostra'
                            );
                            const dados = [];
                            _.forEach(curfatgroupby, (pac, key) => {
                                const obj = {
                                    postoamostra: key,
                                    dataentra: format(
                                        parseISO(pac[0].dataentra),
                                        'dd/MM/yyyy'
                                    ),
                                    nome: pac[0].nome.trim(),
                                    exames: _.sortBy(pac, 'codigo'),
                                    totpac: 1,
                                    totch: parseFloat(
                                        pac.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valorexa)
                                            );
                                        }, 0)
                                    ).toFixed(2),
                                    totexa: pac.length,
                                    totgeral: parseFloat(
                                        pac.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.valconvenio
                                                    ).toFixed(2)
                                                )
                                            );
                                        }, 0)
                                    ).toFixed(2),
                                };
                                dados.push(obj);
                            });

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totpac);
                                }, 0),
                                totch: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totch);
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totexa);
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.totgeral)
                                    );
                                }, 0),
                            };

                            // MONTANDO O RELATORIO PLANO
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatplano${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { totalgeral, dados };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({ error: err.message });
                            }

                            // CHAMA NO RETORNO FINAL DO CONTROLLER
                            // if (chkconfere === 'true') {
                            // console.log('CHAMA TELA FATURAMENTO');
                            // }
                        }

                        if (curfat[0].impest === '1') {
                            const curfatgroupby = _.chain(curfat)
                                .groupBy('convenio_id')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('codigo')
                                        .value()
                                )
                                .value();

                            const dados = [];

                            _.forEach(curfatgroupby, (exms, convenio) => {
                                let razao = '';
                                const exames = [];
                                _.forEach(exms, atend => {
                                    razao = atend[0].razao;
                                    exames.push({
                                        exame: atend[0],
                                        totexa: atend.length,
                                        valconvenio: parseFloat(
                                            atend[0].valconvenio
                                        ),
                                        totgeral: parseFloat(
                                            parseFloat(
                                                atend.reduce(
                                                    (prevValue, soma) => {
                                                        return (
                                                            prevValue +
                                                            parseFloat(
                                                                parseFloat(
                                                                    soma.valconvenio
                                                                ).toFixed(2)
                                                            )
                                                        );
                                                    },
                                                    0
                                                )
                                            ).toFixed(2)
                                        ),
                                        totvenda: parseFloat(
                                            atend.reduce((prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.valconvenio)
                                                );
                                            }, 0)
                                        ),
                                        totcusto: parseFloat(
                                            atend.reduce((prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.custounit)
                                                );
                                            }, 0)
                                        ),
                                        totmargem:
                                            parseFloat(
                                                atend.reduce(
                                                    (prevValue, soma) => {
                                                        return (
                                                            prevValue +
                                                            parseFloat(
                                                                soma.valconvenio
                                                            )
                                                        );
                                                    },
                                                    0
                                                )
                                            ) -
                                            parseFloat(
                                                atend.reduce(
                                                    (prevValue, soma) => {
                                                        return (
                                                            prevValue +
                                                            parseFloat(
                                                                soma.custounit
                                                            )
                                                        );
                                                    },
                                                    0
                                                )
                                            ),
                                    });
                                });
                                dados.push({
                                    convenio,
                                    razao,
                                    exames:
                                        opcaodata === 'ENTREGA'
                                            ? _.sortBy(exames, [
                                                  'exame.codentrega',
                                                  'exame.descexame',
                                                  'exame.codigo',
                                              ])
                                            : _.sortBy(exames, 'exame.codigo'),
                                    subtotexa: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.totexa)
                                            );
                                        },
                                        0
                                    ),
                                    subtotgeral: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totgeral
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                    subtotvenda: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totvenda
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                    subtotcusto: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totcusto
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                    subtotmargem: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totmargem
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                });
                            });

                            const totalgeral = {
                                totexa: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotexa)
                                    );
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotgeral)
                                    );
                                }, 0),
                                totvenda: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotvenda)
                                    );
                                }, 0),
                                totcusto: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotcusto)
                                    );
                                }, 0),
                                totmargem: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue +
                                        parseFloat(soma.subtotmargem)
                                    );
                                }, 0),
                            };

                            if (chkrelcustoexa === 'true') {
                                // MONTANDO O RELATORIO FATESTCUSTO
                                const dataReport = JSON.parse(
                                    req.query.dataReport
                                );
                                dataReport.size = 'retrato';
                                dataReport.model = `fatestcusto${
                                    cmbmodelo === '1' ? '' : cmbmodelo
                                }`;
                                dataReport.data = { dados, totalgeral };
                                try {
                                    const reportHtml = await gerarRelatorioHtml(
                                        dataReport
                                    );
                                    html.push(reportHtml);
                                } catch (err) {
                                    res.status(400).json({
                                        error: err.message,
                                    });
                                }
                            } else {
                                // MONTANDO O RELATORIO FATEST
                                const dataReport = JSON.parse(
                                    req.query.dataReport
                                );
                                dataReport.size = 'retrato';
                                dataReport.model = `fatest${
                                    cmbmodelo === '1' ? '' : cmbmodelo
                                }`;
                                dataReport.data = { dados, totalgeral };
                                try {
                                    const reportHtml = await gerarRelatorioHtml(
                                        dataReport
                                    );
                                    html.push(reportHtml);
                                } catch (err) {
                                    res.status(400).json({
                                        error: err.message,
                                    });
                                }
                            }
                        }
                     } //else {
                    //     res.status(400).json({
                    //         error: 'Nenhum registro encontrado.',
                    //     });
                    // }
                } else if (curfat.length > 0) {
                    curfinal = [...curfinal, ...curfat];
                }
            }
        }

        if (curfinal.length >= 0 && fatuni && !relgeral) {
            curfinal = _.groupBy(curfinal, 'convenio_id');
            const convenios = [];
            _.forEach(curfinal, (exms, convenio) => {
                convenios.push({
                    convenio_id: convenio,
                    exms,
                });
            });

            for (const conv of convenios) {
                const { exms } = conv;
                if (chkrelcustoexa === 'true') {
                    const newCurfat = exms.map(item => {
                        item.margem =
                            parseFloat(item.valconvenio) -
                            parseFloat(item.custounit);
                        return item;
                    });
                    const curfatgroupby = _.groupBy(newCurfat, 'postoamostra');
                    const dados = [];
                    _.forEach(curfatgroupby, (pac, key) => {
                        const obj = {
                            postoamostra: key,
                            dataentra: format(
                                parseISO(pac[0].dataentra),
                                'dd/MM/yyyy'
                            ),
                            nome: pac[0].nome.trim(),
                            exames: _.sortBy(pac, 'codigo'),
                            totpac: 1,
                            totexa: pac.length,
                            totvenda: parseFloat(
                                pac.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.valconvenio)
                                    );
                                }, 0)
                            ).toFixed(2),
                            totcusto: parseFloat(
                                pac.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.custounit)
                                    );
                                }, 0)
                            ).toFixed(2),
                            totmargem: parseFloat(
                                pac.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.margem);
                                }, 0)
                            ).toFixed(2),
                        };
                        dados.push(obj);
                    });

                    const totalgeral = {
                        totpac: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totpac);
                        }, 0),
                        totexa: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totexa);
                        }, 0),
                        totvenda: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totvenda);
                        }, 0),
                        totcusto: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totcusto);
                        }, 0),
                        totmargem: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totmargem);
                        }, 0),
                    };

                    // MONTANDO O RELATORIO PLANO
                    const dataReport = JSON.parse(req.query.dataReport);
                    dataReport.size = 'retrato';
                    dataReport.model = `fatcusto${
                        cmbmodelo === '1' ? '' : cmbmodelo
                    }`;
                    dataReport.data = { totalgeral, dados };
                    try {
                        const reportHtml = await gerarRelatorioHtml(dataReport);
                        html.push(reportHtml);
                    } catch (err) {
                        res.status(400).json({ error: err.message });
                    }
                } else {
                    const curfatgroupby = _.groupBy(exms, 'postoamostra');
                    const dados = [];
                    _.forEach(curfatgroupby, (pac, key) => {
                        const obj = {
                            postoamostra: key,
                            dataentra: format(
                                parseISO(pac[0].dataentra),
                                'dd/MM/yyyy'
                            ),
                            nome: pac[0].nome.trim(),
                            exames: _.sortBy(pac, 'codigo'),
                            totpac: 1,
                            totch: parseFloat(
                                pac.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.valorexa)
                                    );
                                }, 0)
                            ).toFixed(2),
                            totexa: pac.length,
                            totgeral: parseFloat(
                                pac.reduce((prevValue, soma) => {
                                    return (
                                        prevValue +
                                        parseFloat(
                                            parseFloat(
                                                soma.valconvenio
                                            ).toFixed(2)
                                        )
                                    );
                                }, 0)
                            ).toFixed(2),
                        };
                        dados.push(obj);
                    });

                    const totalgeral = {
                        totpac: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totpac);
                        }, 0),
                        totch: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totch);
                        }, 0),
                        totexa: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totexa);
                        }, 0),
                        totgeral: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.totgeral);
                        }, 0),
                    };

                    // MONTANDO O RELATORIO PLANO
                    const dataReport = JSON.parse(req.query.dataReport);
                    dataReport.size = 'retrato';
                    dataReport.model = `fatplano${
                        cmbmodelo === '1' ? '' : cmbmodelo
                    }`;
                    dataReport.data = { totalgeral, dados };
                    try {
                        const reportHtml = await gerarRelatorioHtml(dataReport);
                        html.push(reportHtml);
                    } catch (err) {
                        res.status(400).json({ error: err.message });
                    }

                    // CHAMA NO RETORNO FINAL DO CONTROLLER
                    // if (chkconfere === 'true') {
                    // console.log('CHAMA TELA FATURAMENTO');
                    // }
                }

                if (exms[0].impest === '1') {
                    const curfatgroupby = _.chain(exms)
                        .groupBy('convenio_id')
                        .mapValues(values =>
                            _.chain(values)
                                .groupBy('codigo')
                                .value()
                        )
                        .value();

                    const dados = [];

                    _.forEach(curfatgroupby, (exm, convenio) => {
                        let razao = '';
                        const exames = [];
                        _.forEach(exm, atend => {
                            razao = atend[0].razao;
                            exames.push({
                                exame: atend[0],
                                totexa: atend.length,
                                valconvenio: parseFloat(atend[0].valconvenio),
                                totgeral: parseFloat(
                                    parseFloat(
                                        atend.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.valconvenio
                                                    ).toFixed(2)
                                                )
                                            );
                                        }, 0)
                                    ).toFixed(2)
                                ),
                                totvenda: parseFloat(
                                    atend.reduce((prevValue, soma) => {
                                        return (
                                            prevValue +
                                            parseFloat(soma.valconvenio)
                                        );
                                    }, 0)
                                ),
                                totcusto: parseFloat(
                                    atend.reduce((prevValue, soma) => {
                                        return (
                                            prevValue +
                                            parseFloat(soma.custounit)
                                        );
                                    }, 0)
                                ),
                                totmargem:
                                    parseFloat(
                                        atend.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valconvenio)
                                            );
                                        }, 0)
                                    ) -
                                    parseFloat(
                                        atend.reduce((prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.custounit)
                                            );
                                        }, 0)
                                    ),
                            });
                        });
                        dados.push({
                            convenio,
                            razao,
                            exames:
                                opcaodata === 'ENTREGA'
                                    ? _.sortBy(exames, [
                                          'exame.codentrega',
                                          'exame.descexame',
                                          'exame.codigo',
                                      ])
                                    : _.sortBy(exames, 'exame.codigo'),
                            subtotexa: exames.reduce((prevValue, soma) => {
                                return prevValue + parseFloat(soma.totexa);
                            }, 0),
                            subtotgeral: exames.reduce((prevValue, soma) => {
                                return (
                                    prevValue +
                                    parseFloat(
                                        parseFloat(soma.totgeral).toFixed(2)
                                    )
                                );
                            }, 0),
                            subtotvenda: exames.reduce((prevValue, soma) => {
                                return (
                                    prevValue +
                                    parseFloat(
                                        parseFloat(soma.totvenda).toFixed(2)
                                    )
                                );
                            }, 0),
                            subtotcusto: exames.reduce((prevValue, soma) => {
                                return (
                                    prevValue +
                                    parseFloat(
                                        parseFloat(soma.totcusto).toFixed(2)
                                    )
                                );
                            }, 0),
                            subtotmargem: exames.reduce((prevValue, soma) => {
                                return (
                                    prevValue +
                                    parseFloat(
                                        parseFloat(soma.totmargem).toFixed(2)
                                    )
                                );
                            }, 0),
                        });
                    });

                    const totalgeral = {
                        totexa: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.subtotexa);
                        }, 0),
                        totgeral: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.subtotgeral);
                        }, 0),
                        totvenda: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.subtotvenda);
                        }, 0),
                        totcusto: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.subtotcusto);
                        }, 0),
                        totmargem: dados.reduce((prevValue, soma) => {
                            return prevValue + parseFloat(soma.subtotmargem);
                        }, 0),
                    };

                    if (chkrelcustoexa === 'true') {
                        // MONTANDO O RELATORIO FATESTCUSTO
                        const dataReport = JSON.parse(req.query.dataReport);
                        dataReport.size = 'retrato';
                        dataReport.model = `fatestcusto${
                            cmbmodelo === '1' ? '' : cmbmodelo
                        }`;
                        dataReport.data = { dados, totalgeral };
                        try {
                            const reportHtml = await gerarRelatorioHtml(
                                dataReport
                            );
                            html.push(reportHtml);
                        } catch (err) {
                            res.status(400).json({
                                error: err.message,
                            });
                        }
                    } else {
                        // MONTANDO O RELATORIO FATEST
                        const dataReport = JSON.parse(req.query.dataReport);
                        dataReport.size = 'retrato';
                        dataReport.model = `fatest${
                            cmbmodelo === '1' ? '' : cmbmodelo
                        }`;
                        dataReport.data = { dados, totalgeral };
                        try {
                            const reportHtml = await gerarRelatorioHtml(
                                dataReport
                            );
                            html.push(reportHtml);
                        } catch (err) {
                            res.status(400).json({
                                error: err.message,
                            });
                        }
                    }
                }
            }
        }

        if (relgeral) {
            curfat = curgeral;
            if (curfat.length > 0) {
                // tot_totalpaci = 0;
                // tot_totrec = 0;
                // curfat.map(item => {
                //     tot_totalpaci += parseFloat(item.totalpaci || 0);
                //     tot_totrec += parseFloat(item.totrec || 0);
                //     return item;
                // });

                switch (optrelgeral) {
                    case '1':
                        if (chkposto === 'true') {
                            const curfatgroupby = _.chain(curfat)
                                .groupBy('posto')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('postoamostra')
                                        .value()
                                )
                                .value();

                            let dados = [];
                            _.forEach(curfatgroupby, (pac, key) => {
                                let descposto = '';
                                let subtotch = 0;
                                let subtotexa = 0;
                                let subtotgeral = 0;
                                let pacientes = [];
                                _.forEach(pac, (paci, codigo) => {
                                    descposto = paci[0].descposto;
                                    subtotexa += paci.length;
                                    subtotch += paci.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valorexa)
                                            );
                                        },
                                        0
                                    );
                                    subtotgeral += paci.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valconvenio)
                                            );
                                        },
                                        0
                                    );
                                    const paciente = {
                                        postoamostra: codigo,
                                        amostra: paci[0].amostra,
                                        dataentra: format(
                                            parseISO(paci[0].dataentra),
                                            'dd/MM/yyyy'
                                        ),
                                        dtfatura: format(
                                            parseISO(paci[0].dtfatura),
                                            'dd/MM/yyyy'
                                        ),
                                        nome: paci[0].nome,
                                        entrega_id: paci[0].entrega_id,
                                        codconv: paci[0].codconv,
                                        codplano: paci[0].codplano,
                                        exames: _.sortBy(paci, 'codigo'),
                                        totgeral: paci.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.valconvenio)
                                                );
                                            },
                                            0
                                        ),
                                    };
                                    pacientes.push(paciente);
                                });

                                // ORDENAÇÃO
                                switch (ordem) {
                                    case 'ALFABETICA':
                                        pacientes = _.sortBy(pacientes, 'nome');
                                        break;
                                    case 'OS':
                                        pacientes = _.sortBy(
                                            pacientes,
                                            'amostra'
                                        );
                                        break;
                                    case 'DATA':
                                        pacientes = _.sortBy(
                                            pacientes,
                                            'dtfatura'
                                        );
                                        break;
                                    case 'ENTREGA':
                                        pacientes = _.sortBy(
                                            pacientes,
                                            'entrega_id'
                                        );
                                        break;
                                    default:
                                        break;
                                }

                                const obj = {
                                    posto: key,
                                    descposto,
                                    pacientes,
                                    subtotpac: pacientes.length,
                                    subtotch,
                                    subtotexa,
                                    subtotgeral,
                                };
                                dados.push(obj);
                            });

                            dados = _.sortBy(dados, 'posto');

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotpac)
                                    );
                                }, 0),
                                totch: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotch)
                                    );
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotexa)
                                    );
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotgeral)
                                    );
                                }, 0),
                            };

                            // MONTANDO O RELATORIO FATGERALANA
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatgeralanapos${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { dados, totalgeral };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }
                        } else {
                            const curfatgroupby = _.chain(curfat)
                                .groupBy('convenio_id')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('postoamostra')
                                        .value()
                                )
                                .value();

                            const dados = [];
                            _.forEach(curfatgroupby, (pac, key) => {
                                let razao = '';
                                let cgc_cpf = '';
                                let endereco = '';
                                let subtotch = 0;
                                let subtotexa = 0;
                                let subtotgeral = 0;
                                const pacientes = [];
                                _.forEach(pac, (paci, codigo) => {
                                    razao = paci[0].razao;
                                    cgc_cpf = paci[0].cgc_cpf;
                                    endereco = paci[0].endereco;
                                    subtotexa += paci.length;
                                    subtotch += paci.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valorexa)
                                            );
                                        },
                                        0
                                    );
                                    subtotgeral += paci.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.valconvenio)
                                            );
                                        },
                                        0
                                    );
                                    const paciente = {
                                        postoamostra: codigo,
                                        dataentra: format(
                                            parseISO(paci[0].dataentra),
                                            'dd/MM/yyyy'
                                        ),
                                        nome: paci[0].nome,
                                        exames: _.sortBy(paci, 'codigo'),
                                        totgeral: paci.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.valconvenio)
                                                );
                                            },
                                            0
                                        ),
                                    };
                                    pacientes.push(paciente);
                                });
                                const obj = {
                                    id: key,
                                    razao,
                                    cgc_cpf,
                                    endereco,
                                    pacientes,
                                    subtotpac: pacientes.length,
                                    subtotch,
                                    subtotexa,
                                    subtotgeral,
                                };
                                dados.push(obj);
                            });

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotpac)
                                    );
                                }, 0),
                                totch: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotch)
                                    );
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotexa)
                                    );
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotgeral)
                                    );
                                }, 0),
                            };

                            // MONTANDO O RELATORIO FATGERALANA
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatgeralana${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { dados, totalgeral };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }
                        }
                        break;
                    case '2':
                        if (chkposto === 'true') {
                            const curfatgroupby = _.chain(curfat)
                                .groupBy('posto')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('convenio_id')
                                        .mapValues(convenio =>
                                            _.chain(convenio)
                                                .groupBy('postoamostra')
                                                .value()
                                        )
                                        .value()
                                )
                                .value();

                            let dados = [];
                            _.forEach(curfatgroupby, (pac, key) => {
                                let descposto = '';
                                const convenios = [];
                                _.forEach(pac, conv => {
                                    let convenio_id = '';
                                    let razao = '';
                                    let subtotpac = 0;
                                    let subtotch = 0;
                                    let subtotexa = 0;
                                    let subtotgeral = 0;
                                    _.forEach(conv, paci => {
                                        descposto = paci[0].descposto;
                                        convenio_id = paci[0].convenio_id;
                                        razao = paci[0].razao.trim();
                                        subtotpac += 1;
                                        subtotexa += paci.length;
                                        subtotch += paci.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.valorexa)
                                                );
                                            },
                                            0
                                        );
                                        subtotgeral += paci.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(
                                                        parseFloat(
                                                            soma.valconvenio
                                                        ).toFixed(2)
                                                    )
                                                );
                                            },
                                            0
                                        );
                                    });
                                    convenios.push({
                                        id: convenio_id,
                                        razao,
                                        subtotpac,
                                        subtotch,
                                        subtotexa,
                                        subtotgeral,
                                    });
                                });
                                dados.push({
                                    posto: key,
                                    descposto,
                                    convenios,
                                    subtotpac: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.subtotpac)
                                            );
                                        },
                                        0
                                    ),
                                    subtotch: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.subtotch)
                                            );
                                        },
                                        0
                                    ),
                                    subtotexa: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.subtotexa)
                                            );
                                        },
                                        0
                                    ),
                                    subtotgeral: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.subtotgeral
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                });
                            });

                            dados = _.sortBy(dados, 'posto');

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotpac)
                                    );
                                }, 0),
                                totch: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotch)
                                    );
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotexa)
                                    );
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotgeral)
                                    );
                                }, 0),
                            };

                            // // MONTANDO O RELATORIO FATGERALSIN
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatgeralsinpos${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { totalgeral, dados };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }
                        } else {
                            const curfatgroupby = _.chain(curfat)
                                .groupBy('convenio_id')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('postoamostra')
                                        .value()
                                )
                                .value();

                            const dados = [];

                            _.forEach(curfatgroupby, (pac, key) => {
                                let razao = '';
                                let subtotpac = 0;
                                let subtotch = 0;
                                let subtotexa = 0;
                                let subtotgeral = 0;
                                _.forEach(pac, paci => {
                                    razao = paci[0].razao.trim();
                                    subtotpac += 1;
                                    subtotexa += paci.length;
                                    _.forEach(paci, exa => {
                                        subtotch += parseFloat(exa.valorexa);
                                    });
                                    subtotgeral += paci.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.valconvenio
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    );
                                });
                                const obj = {
                                    id: key,
                                    razao,
                                    subtotpac,
                                    subtotch,
                                    subtotexa,
                                    subtotgeral,
                                };
                                dados.push(obj);
                            });

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotpac)
                                    );
                                }, 0),
                                totch: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotch)
                                    );
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotexa)
                                    );
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotgeral)
                                    );
                                }, 0),
                            };

                            // MONTANDO O RELATORIO FATGERALSIN
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatgeralsin${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { totalgeral, dados };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }
                        }

                        break;
                    case '3':
                        {
                            const curfatgroupby = _.chain(curfat)
                                .groupBy('convenio_id')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('codigo')
                                        .value()
                                )
                                .value();

                            const dados = [];

                            _.forEach(curfatgroupby, (exms, convenio) => {
                                let razao = '';
                                const exames = [];
                                _.forEach(exms, atend => {
                                    razao = atend[0].razao;
                                    exames.push({
                                        exame: atend[0],
                                        totexa: atend.length,
                                        valconvenio: parseFloat(
                                            atend[0].valconvenio
                                        ),
                                        totgeral: parseFloat(
                                            parseFloat(
                                                atend.reduce(
                                                    (prevValue, soma) => {
                                                        return (
                                                            prevValue +
                                                            parseFloat(
                                                                parseFloat(
                                                                    soma.valconvenio
                                                                ).toFixed(2)
                                                            )
                                                        );
                                                    },
                                                    0
                                                )
                                            ).toFixed(2)
                                        ),
                                    });
                                });
                                dados.push({
                                    convenio,
                                    razao,
                                    exames:
                                        opcaodata === 'ENTREGA'
                                            ? _.sortBy(exames, [
                                                  'exame.codentrega',
                                                  'exame.descexame',
                                                  'exame.codigo',
                                              ])
                                            : _.sortBy(exames, 'exame.codigo'),
                                    subtotexa: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.totexa)
                                            );
                                        },
                                        0
                                    ),
                                    subtotgeral: exames.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totgeral
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                });
                            });

                            const totalgeral = {
                                totexa: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotexa)
                                    );
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.subtotgeral)
                                    );
                                }, 0),
                            };

                            // MONTANDO O RELATORIO FATEST SUS
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatestsus${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { dados, totalgeral };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }
                        }
                        break;
                    case '4':
                        {
                            curfat.map(item => {
                                item.crm = item.crm.trim();
                                item.crmmed = `${item.crm.trim()}-${item.nome_med.trim()}`;
                                return item;
                            });

                            if (chkposto === 'true') {
                                const curfatgroupby = _.chain(curfat)
                                    .groupBy('posto')
                                    .mapValues(values =>
                                        _.chain(values)
                                            .groupBy('crmmed')
                                            .value()
                                    )
                                    .value();

                                let dados = [];

                                _.forEach(curfatgroupby, (postos, key) => {
                                    const medicos = [];
                                    let descposto = null;
                                    _.forEach(postos, (exames, crm) => {
                                        descposto = exames[0].descposto.trim();
                                        const pacientes = _.uniqBy(
                                            exames,
                                            'postoamostra'
                                        );
                                        medicos.push({
                                            crm,
                                            nome_med: exames[0].nome_med.trim(),
                                            totpac: pacientes.length,
                                            totch: exames.reduce(
                                                (prevValue, soma) => {
                                                    return (
                                                        prevValue +
                                                        parseFloat(
                                                            parseFloat(
                                                                soma.valorexa
                                                            ).toFixed(2)
                                                        )
                                                    );
                                                },
                                                0
                                            ),
                                            totexa: exames.length,
                                            totgeral: exames.reduce(
                                                (prevValue, soma) => {
                                                    return (
                                                        prevValue +
                                                        parseFloat(
                                                            parseFloat(
                                                                soma.valconvenio
                                                            ).toFixed(2)
                                                        )
                                                    );
                                                },
                                                0
                                            ),
                                        });
                                    });

                                    dados.push({
                                        posto: key,
                                        descposto,
                                        medicos: _.sortBy(medicos, 'crm'),
                                        totpac: medicos.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.totpac)
                                                );
                                            },
                                            0
                                        ),
                                        totch: medicos.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(
                                                        parseFloat(
                                                            soma.totch
                                                        ).toFixed(2)
                                                    )
                                                );
                                            },
                                            0
                                        ),
                                        totexa: medicos.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(soma.totexa)
                                                );
                                            },
                                            0
                                        ),
                                        totgeral: medicos.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(
                                                        parseFloat(
                                                            soma.totgeral
                                                        ).toFixed(2)
                                                    )
                                                );
                                            },
                                            0
                                        ),
                                    });
                                });

                                dados = _.sortBy(dados, 'posto');

                                const totalgeral = {
                                    totpac: dados.reduce((prevValue, soma) => {
                                        return (
                                            prevValue + parseFloat(soma.totpac)
                                        );
                                    }, 0),
                                    totch: dados.reduce((prevValue, soma) => {
                                        return (
                                            prevValue +
                                            parseFloat(
                                                parseFloat(soma.totch).toFixed(
                                                    2
                                                )
                                            )
                                        );
                                    }, 0),
                                    totexa: dados.reduce((prevValue, soma) => {
                                        return (
                                            prevValue + parseFloat(soma.totexa)
                                        );
                                    }, 0),
                                    totgeral: dados.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totgeral
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                };

                                // MONTANDO O RELATORIO FATGERALMEDPOS
                                const dataReport = JSON.parse(
                                    req.query.dataReport
                                );
                                dataReport.size = 'retrato';
                                dataReport.model = `fatgeralmedpos${
                                    cmbmodelo === '1' ? '' : cmbmodelo
                                }`;
                                dataReport.data = { dados, totalgeral };
                                try {
                                    const reportHtml = await gerarRelatorioHtml(
                                        dataReport
                                    );
                                    html.push(reportHtml);
                                } catch (err) {
                                    res.status(400).json({
                                        error: err.message,
                                    });
                                }
                            }

                            const curfatgroupby = _.chain(curfat)
                                .groupBy('crmmed')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('convenio_id')
                                        .value()
                                )
                                .value();

                            let dados = [];

                            _.forEach(curfatgroupby, medicos => {
                                const convenios = [];
                                let crm = null;
                                let nome_med = null;

                                _.forEach(medicos, (exames, convenio) => {
                                    crm = exames[0].crm.trim();
                                    nome_med = exames[0].nome_med.trim();
                                    const razao = exames[0].razao.trim();
                                    const pacientes = _.uniqBy(
                                        exames,
                                        'postoamostra'
                                    );
                                    convenios.push({
                                        convenio_id: convenio,
                                        razao,
                                        totpac: pacientes.length,
                                        totch: exames.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(
                                                        parseFloat(
                                                            soma.valorexa
                                                        ).toFixed(2)
                                                    )
                                                );
                                            },
                                            0
                                        ),
                                        totexa: exames.length,
                                        totgeral: exames.reduce(
                                            (prevValue, soma) => {
                                                return (
                                                    prevValue +
                                                    parseFloat(
                                                        parseFloat(
                                                            soma.valconvenio
                                                        ).toFixed(2)
                                                    )
                                                );
                                            },
                                            0
                                        ),
                                    });
                                });

                                dados.push({
                                    crm,
                                    nome_med,
                                    convenios,
                                    totpac: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.totpac)
                                            );
                                        },
                                        0
                                    ),
                                    totch: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totch
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                    totexa: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.totexa)
                                            );
                                        },
                                        0
                                    ),
                                    totgeral: convenios.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totgeral
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                });
                            });

                            const totalgeral = {
                                totpac: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totpac);
                                }, 0),
                                totch: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue +
                                        parseFloat(
                                            parseFloat(soma.totch).toFixed(2)
                                        )
                                    );
                                }, 0),
                                totexa: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totexa);
                                }, 0),
                                totgeral: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue +
                                        parseFloat(
                                            parseFloat(soma.totgeral).toFixed(2)
                                        )
                                    );
                                }, 0),
                            };

                            dados = _.sortBy(dados, 'crm');

                            // MONTANDO O RELATORIO FATGERALMED
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatgeralmed${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { dados, totalgeral };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }
                        }
                        break;
                    case '5':
                        {
                            curfat = curfat.map(item => {
                                item.descsetor = item.descsetor
                                    ? item.descsetor.trim()
                                    : 'NÃO DEFINIDO';
                                return {
                                    posto: item.posto,
                                    descposto: item.descposto.trim(),
                                    descsetor: item.descsetor.trim(),
                                    codigo: item.codigo.trim(),
                                    descexame: item.descexame.trim(),
                                    amb: item.amb ? item.amb.trim() : '',
                                    qtdexame: parseFloat(item.qtdexame),
                                    valexame:
                                        parseFloat(item.valconvenio) *
                                        parseFloat(item.qtdexame),
                                    valconvenio: item.valconvenio,
                                };
                            });

                            const curfatgroupby = _.chain(curfat)
                                .groupBy('posto')
                                .mapValues(values =>
                                    _.chain(values)
                                        .groupBy('descsetor')
                                        .mapValues(exa =>
                                            _.chain(exa)
                                                .groupBy('codigo')
                                                .mapValues(amb =>
                                                    _.chain(amb)
                                                        .groupBy('amb')
                                                        .value()
                                                )
                                                .value()
                                        )
                                        .value()
                                )
                                .value();

                            let dados = [];

                            _.forEach(curfatgroupby, (postos, key) => {
                                let descposto = '';
                                const setores = [];
                                _.forEach(postos, (exams, descsetor) => {
                                    const exames = [];
                                    let totexa = 0;
                                    let totvalexame = 0;
                                    _.forEach(exams, (exm, codigo) => {
                                        const amb = [];
                                        _.forEach(exm, item => {
                                            _.forEach(item, x => {
                                                totexa += 1;
                                                totvalexame += x.valconvenio;
                                                descposto = x.descposto;
                                            });
                                            const examefinal = {
                                                codigo: item[0].codigo.trim(),
                                                descexame: item[0].descexame.trim(),
                                                amb: item[0].amb
                                                    ? item[0].amb.trim()
                                                    : '',
                                                qtdexame: item.length,
                                                valexame:
                                                    parseFloat(
                                                        item[0].valconvenio
                                                    ) * parseFloat(item.length),
                                                valconvenio:
                                                    item[0].valconvenio,
                                            };
                                            amb.push({
                                                ...examefinal,
                                            });
                                        });
                                        exames.push({
                                            codigo,
                                            amb: _.sortBy(amb, 'amb'),
                                        });
                                    });
                                    setores.push({
                                        setor: descsetor,
                                        exames: _.sortBy(exames, 'codigo'),
                                        totexa,
                                        totvalexame,
                                        totmedia: totvalexame / totexa,
                                    });
                                });

                                dados.push({
                                    posto: key,
                                    descposto,
                                    setores: _.sortBy(setores, 'setor'),
                                    totexa: setores.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.totexa)
                                            );
                                        },
                                        0
                                    ),
                                    totvalexame: setores.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(soma.totvalexame)
                                            );
                                        },
                                        0
                                    ),
                                    totmedia: setores.reduce(
                                        (prevValue, soma) => {
                                            return (
                                                prevValue +
                                                parseFloat(
                                                    parseFloat(
                                                        soma.totmedia
                                                    ).toFixed(2)
                                                )
                                            );
                                        },
                                        0
                                    ),
                                });
                            });

                            const totalgeral = {
                                totexa: dados.reduce((prevValue, soma) => {
                                    return prevValue + parseFloat(soma.totexa);
                                }, 0),
                                totvalexame: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue + parseFloat(soma.totvalexame)
                                    );
                                }, 0),
                                totmedia: dados.reduce((prevValue, soma) => {
                                    return (
                                        prevValue +
                                        parseFloat(
                                            parseFloat(soma.totmedia).toFixed(2)
                                        )
                                    );
                                }, 0),
                            };

                            dados = _.sortBy(dados, 'posto');

                            // MONTANDO O RELATORIO FATSET
                            const dataReport = JSON.parse(req.query.dataReport);
                            dataReport.size = 'retrato';
                            dataReport.model = `fatset${
                                cmbmodelo === '1' ? '' : cmbmodelo
                            }`;
                            dataReport.data = { dados, totalgeral };
                            try {
                                const reportHtml = await gerarRelatorioHtml(
                                    dataReport
                                );
                                html.push(reportHtml);
                            } catch (err) {
                                res.status(400).json({
                                    error: err.message,
                                });
                            }

                            // REPLACE ALL CURFAT.DESCSETOR WITH UPPER(NVL(CURFAT.DESCSETOR, "NÃO DEFINIDO")) IN CURFAT

                            // SELECT POSTO, DESCPOSTO, DESCSETOR, CODIGO, DESCEXAME, AMB, VALCONVENIO, SUM(NVL(CURFAT.QTDEXAME,1)) AS QTDEXAME ;
                            // FROM CURFAT ;
                            // GROUP BY POSTO, DESCPOSTO, DESCSETOR, CODIGO, DESCEXAME, AMB, VALCONVENIO;
                            // ORDER BY POSTO, DESCSETOR, CODIGO, AMB ;
                            // INTO CURSOR CURFAT READWRITE

                            // GO TOP IN CURFAT
                            // DO FORM FORM\IMPRIME WITH "FATSET"+IIF(thisform.cmbmodelo.DisplayValue == "1","",thisform.cmbmodelo.DisplayValue),"FATURAMENTO - SUS POR SETOR","CURFAT"
                        }
                        break;
                    default:
                        break;
                }
            } else {
                res.status(400).json({ error: 'Nenhum registro encontrado.' });
            }
        }

        return res.status(200).json({ chkconfere, curfat, html });
    }

    async update(req, res) {
        const { Movexa } = Database.getModels(req.database);
        const { marcados } = req.body;

        await Movexa.sequelize.transaction(async transaction => {
            for (const item of marcados) {
                await Movexa.sequelize
                    .query(
                        `UPDATE MOVEXA SET CONFFAT = '1' WHERE MOVEXA.ID = ${item.id}`,
                        { transaction }
                    )
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
                await Movexa.sequelize
                    .query(
                        `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${item.id},cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${req.userId},'EXAME MARCADO COMO CONFERIDO PARA FATURAMENTO STATUS: ${item.statusexm}','${req.headers.host}')`,
                        { transaction }
                    )
                    .catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
            }
        });
        res.status(200).json({ msg: 'OK' });
    }
}

export default new FaturamentoConvenioController();
