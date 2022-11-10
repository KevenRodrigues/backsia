import { add, format, parseISO } from 'date-fns';
import { QueryTypes } from 'sequelize';
import xml2js from 'xml2js';
import crypto from 'crypto';
import * as _ from 'lodash';
import Database from '../../../../database'
import { checa_len_matricula, modulo11c, procSQL, verifica_cpf, estado_tiss, convert_valor } from '../functions';

export default async function geraTissImplementacao(req, body) {
    const { convenio_id, empresa_id, modeloGeracao, lotes = [] } = body;
    const { ConvenioTiss } = Database.getModels(req.database);
    const sequelize = Database.instances[req.database];

    const dataini = format(new Date(), 'yyyy-MM-dd');
    const datafim = format(new Date(), 'yyyy-MM-dd');

    let cgc_cpf = '';
    let uf = '';
    let razao = '';
    let logra = '';
    let endereco = '';
    let numero = '';
    let ibge = '';
    let cep = '';
    let responsavel = '';
    let crm = '';
    let cbos = '';
    let codeletron = '';
    let codconv = '';
    let registro = '';
    let cnes = '';
    let arquivo = '';

    let totguia = 0;
    let totrs = 0;
    let totpac = 0;
    let guialote = 0;
    let dirold = '';
    let numtra = 0;
    let loteConv = 0;
    let nomearq = '';
    let totpacatu = 0;
    let reducaoacrescimo_mat_med_fil = 1;
    let dataate = '';
    let deparatab = '';
    const sinteticos = [];

    let usaemp = false;
    let curempresa = null;
    let planos = [];
    let curfinal = []

    const camposParametrosOperador = `
        postoperm,
        convperm
    `;

    let parametrosOperador = await sequelize
        .query(`select ${camposParametrosOperador} from operador, operador2, operador3 where operador.id = ${req.userId} AND operador2.operador_id = ${req.userId} AND operador3.operador_id = ${req.userId}`, {
            type: QueryTypes.SELECT,
        })
        .catch((error) => {
            throw new Error('Erro ao buscar parametros');
        });

    parametrosOperador = parametrosOperador[0]

    const camposParametros = `
        ativa_qtdexa,
        cgc_cpf,
        uf,
        razao,
        logra,
        endereco,
        numero,
        ibge,
        cep,
        responsavel,
        crm,
        cbos,
        cnes,
        nhashtiss
    `;

    let parametros = await sequelize
        .query(`select ${camposParametros} from param, param2`, {
            type: QueryTypes.SELECT,
        })
        .catch((error) => {
            throw new Error('Erro ao buscar parametros');
        });

    parametros = parametros[0]

    if(empresa_id){
        curempresa = await sequelize
            .query(`
                SELECT *
                FROM EMPRESACONV
                LEFT JOIN EMPRESA ON EMPRESA.ID = EMPRESACONV.EMPRESA_ID
                WHERE EMPRESACONV.EMPRESA_ID = ${empresa_id}
                    AND EMPRESACONV.CONVENIO_ID = ${convenio_id}
            `, {
                type: QueryTypes.SELECT,
            }).catch(() => {
                throw new Error(`Não foi possível buscar os dados do convênio e da empresa.`);
            })

        curempresa = curempresa[0]
        usaemp = true;
    } else {
        usaemp = false;
    }

    const xmls = []
    const erros_arquivos_geral = []

    for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];

        let query = `
            SELECT
            DISTINCT(MOVPAC.ID) AS IDMOVPAC,
            MOVPAC.DATAENTRA AS DATAENTRAP,
            MOVPAC.HORAENTRA AS HORAENTRAP,
            PRONTUARIO.NOME,
            PRONTUARIO.VALPLANO,
            PRONTUARIO.CNS,
            PRONTUARIO.RN,
            MOVEXA.ID,
            MOVEXA.POSTO,
            MOVEXA.AMOSTRA,
            MOVEXA.DATAENTRA,
            MOVEXA.DTFATURA,
            MOVEXA.EXAME_ID,
            MOVEXA.SEQUENCIA,
            PLANO.ID,
            PLANO.DESCRICAO AS DESCPLANO,
            PLANO.VALCH,
            PLANO.PERCPAC,
            PLANO.PERCCONV,
            PLANO.FPERCPAC,
            PLANO.FPERCCONV,
            PLANO.PERCPAC,
            PLANO.PERCCONV,
            PLANO.VALFILME,
            PLANO.CODFILME,
            PLANO.TABELA_ID,
            CONVENIO.ID AS CONVENIO_ID,
            CONVENIO.RAZAO,
            CONVENIO.CGC_CPF,
            CONVENIO.ENDERECO,
            CONVENIO.NUMTRA,
            CONVENIO.VALAUT,
            CONVENIO.CODELETRON,
            CONVENIO.REGISTRO,
            CONVENIO.CODCONV,
            CONVENIO.VERIFMATRIC,
            CONVENIO.MODULO11,
            CONVENIO.QTDCHAR,
            CONVENIO.QTDCHAR2,
            CONVENIO.QTDCHAR3,
            CONVENIO.SENHA,
            EXAME.ID,
            EXAME.CODIGO,
            MOVEXA.DESCEXAFAT AS DESCEXAME,
            CAST(TRIM(COALESCE(MOVEXA.AMB,'')) AS CHAR(15))      AS TABAMB,
            CAST(COALESCE(MOVEXA.VALBRUTO,0) AS NUMERIC(10,2))   AS VALOREXA,
            CAST(COALESCE(MOVEXA.VALPAC,0) AS NUMERIC(10,2))     AS VALORPAC,
            CAST(COALESCE(MOVEXA.VALCONV,0) AS NUMERIC(10,2))    AS VALORCONV,
            CAST('00000000.00' AS NUMERIC(10,2))                 AS VALORCONVESP,
            CAST('00000000.00' AS NUMERIC(10,2))                 AS VALORPACESP,
            CAST('' AS CHAR(15))                                 AS ESPECAMB,
            CAST(COALESCE(MOVEXA.VALPAC,0.00) AS NUMERIC(10,2))  AS VALPACIENTE,
            CAST(COALESCE(MOVEXA.VALCONV,0.00) AS NUMERIC(10,2)) AS VALCONVENIO,
            CAST(TRIM(COALESCE(MOVEXA.AMB,'')) AS CHAR(15))      AS AMB,
            TABELA.DEPARA                                        AS DEPARATAB,
            MOVEXA.DEPARA3FAT                                    AS DEPARA3,
            CAST('00000000.0000' AS NUMERIC(12,4))               AS M2FILME,
            CAST(COALESCE(MOVEXA.VALFILMEP,0) AS NUMERIC(12,4))  AS VALORFILMEP,
            CAST(COALESCE(MOVEXA.VALFILMEC,0) AS NUMERIC(12,4))  AS VALORFILMEC,
            CAST('0' AS NUMERIC(11))                             AS QTD,
            CAST('00000000000' AS NUMERIC(11))                   AS MATMED_ID,
            CAST('00000000.00' AS NUMERIC(10,2))                 AS PRECO,
            CAST('00000000.00' AS NUMERIC(10,2))                 AS PRECOTOTC,
            CAST('00000000.00' AS NUMERIC(10,2))                 AS PRECOTOTP,
            CAST('' AS CHAR(20))                                 AS CODTAB,
            CAST('' AS CHAR(55))                                 AS UNIDADE,
            CAST('0' AS NUMERIC(1))                              AS TIPO,
            CAST('' AS CHAR(2))                                  AS TAB,
            CAST('' AS CHAR(2))                                  AS TAB3,
            MOVEXA.REDUCAOACRESCIMO,
            PLANO.MPERCPAC,
            PLANO.MPERCCONV,
            MOVEXA.MATRICULA,
            MOVEXA.DTAUTORIZA,
            MOVEXA.DTAUTORIZAE,
            MOVEXA.REQUISICAO,
            MOVEXA.GUIAPRINCIPAL,
            MOVEXA.AUTORIZA,
            MEDICO.CRM,
            MEDICO.NOME_MED,
            MEDICO.CPF,
            MEDICO.UNCP,
            MEDICO.UFCRM,
            MEDICO.ID AS MEDICO_ID,
            A.DESCRICAO AS DESCESPMED,
            A.CNES,
            A.CBOS3,
            A.CONS,
            MEDICOREA.ID AS MEDREA_ID,
            MEDICOREA.CRM AS CRM_MEDREA,
            MEDICOREA.NOME_MEDREA,
            MEDICOREA.CPF AS CPF_MEDREA,
            MEDICOREA.UF AS UF_MEDREA,
            B.DESCRICAO AS DESCESPMEDREA,
            B.CNES AS CNESREA,
            B.CBOS3 AS CBOS3REA,
            B.CONS AS CONSREA,
            CID.CODIGO AS CODCID,
            CID.DESCRICAO AS DESCCID,
            MOVEXA.AMB AS AMBMOVEXA,
            MOVEXA.VALBRUTO,
            MOVEXA.VALPAC,
            MOVEXA.VALCONV,
            MOVEXA.VALGUIA,
            PORTE.CODIGO AS CODPORTE,
            PORTE.VALOR AS VALORPORTE,
            PLANO.BANDA_PORTE,
            PLANO.BANDA_UCO,
            CAST('00000000.00' AS NUMERIC(10,2)) AS PESO_PORTE,
            CAST('00000000.00' AS NUMERIC(10,2)) AS PESO_UCO,
            PLANO.TIPOTAB,
            EXAME.ESPTAB_ID,
            EXAME.PROFEXECESP,
            MOVEXA.CONVENIO_SET_ID AS CONVENIO_SET_ID_MOVEXA,
            CONVENIO_SET.ID AS CONVENIO_SET_ID,
            EXAMATMED_CONV.ID AS EXAMATMED_CONV_ID,
            EXAMATMED_CONV.NAOCOBRA_MATMED,
            CAST(COALESCE(MOVEXA.QTDEXAME,1) AS NUMERIC(5,0)) AS QTDEXAFAT,
            convenio.tiss_loginprest, convenio.tiss_senhaprest, movexa.ausenciaCodValidacao, movexa.codValidacao,
            prontuario.tipoIdent, prontuario.IdentificadorBenef, prontuario.templateBiometrico,
            movpac.texto_ind_clinica,
            convenio.chkLoteHash,
            CONVENIO.GERARQNUMTRAN
            FROM MOVEXA
            LEFT JOIN EXAME          ON EXAME.ID      = MOVEXA.EXAME_ID
            LEFT JOIN PLANO          ON PLANO.ID      = MOVEXA.PLANO_ID
            LEFT JOIN CONVENIO       ON CONVENIO.ID   = MOVEXA.CONVENIO_ID
            LEFT JOIN TABELA         ON TABELA.ID     = PLANO.TABELA_ID
            LEFT JOIN MOVPAC         ON MOVPAC.ID     = MOVEXA.MOVPAC_ID
            LEFT JOIN PRONTUARIO     ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
            LEFT JOIN MEDICO         ON MEDICO.ID     = MOVEXA.MEDICO_ID
            LEFT JOIN ESPMED A       ON A.ID          = MEDICO.ESPMED_ID
            LEFT JOIN MEDICOREA      ON MEDICOREA.ID  = MOVEXA.MEDICOREA_ID
            LEFT JOIN ESPMED B       ON B.ID          = MEDICOREA.ESPMED_ID
            LEFT JOIN ESPTAB         ON ESPTAB.ID     = EXAME.ESPTAB_ID
            LEFT JOIN CID            ON CID.ID        = MOVPAC.CID_ID
            LEFT JOIN PORTE          ON PORTE.ID      = EXAME.PORTE_ID
            LEFT JOIN CONVENIO_SET   ON CONVENIO_SET.CONVENIO_ID   = PLANO.CONVENIO_ID AND CONVENIO_SET.SETOR_ID = EXAME.SETOR_ID
            LEFT JOIN EXAMATMED_CONV ON EXAMATMED_CONV.CONVENIO_ID = PLANO.CONVENIO_ID AND EXAMATMED_CONV.EXAME_ID = MOVEXA.EXAME_ID
        `;

        query += ` WHERE MOVEXA.CONVENIO_ID = ${lote.convenio_id} AND MOVEXA.LOTEFAT_ID = ${lote.lotefat_id}  `
	    query += ` AND COALESCE(MOVEXA.LOTEFAT_STATUS,'') = 'FC' `
	    query += ` AND COALESCE(MOVEXA.CONFFAT,0) = '1' `
	    query += ` AND COALESCE(MOVEXA.NAOFATURA,0) = '0' `
	    query += ` AND COALESCE(MOVEXA.CONSULTAEXA,0) = '0' `

        if(parametrosOperador.postoperm.trim()){
            query += `
                AND (MOVEXA.POSTO IN ('${parametrosOperador.postoperm.trim().split(',').join("','")}'))
            `
        }

        if(parametrosOperador.convperm.trim()){
            query += `
                AND (CONVENIO.CODIGO IN ('${parametrosOperador.convperm.trim().split(',').join("','")}'))
            `
        }

        query += `
            ORDER BY MOVEXA.POSTO, MOVEXA.AMOSTRA
        `

        const curfat = await sequelize
            .query(query, {
                type: QueryTypes.SELECT,
            }).catch(() => {
                throw new Error(`Não foi possível buscar os dados de faturamento.`)
            })

        if(curfat.length > 0){
            curfinal = [...curfinal, ...curfat]
        } else {
            throw new Error('Nenhum paciente encontrado no período e convênio informado, não será possivel continuar com a geração do arquivo XML')
        }

        const curfatcopia = _.cloneDeep(curfat)

        for (let idx = 0; idx < curfatcopia.length; idx++) {
            const curfatcopia_item = curfatcopia[idx];

            query = `
                SELECT
                    MOVMAT.ID,
                    MOVMAT.EXAME_ID,
                    MOVMAT.MATMED_ID,
                    MOVMAT.QTDMAT AS QTD,
                    MOVMAT.DESCMATMED AS DESCRICAO,
                    MOVMAT.VALPRECO AS PRECO,
                    MOVMAT.CODTABMATMED AS CODTAB,
                    MOVMAT.UNIDADEMATMED AS UNIDADE,
                    MOVMAT.TIPOMATMED AS TIPO,
                    MOVMAT.TAB3MOVMAT AS TAB3,
                    MOVMAT.AGRUPAMAT_MATMED AS AGRUPAMAT,
                    MOVMAT.MPERCCONVMATMED AS MPERCCONV,
                    MOVMAT.MPERCPACMATMED AS MPERCPAC,
                    MOVMAT.REDUCAOACRESCIMO
                FROM MOVMAT
                LEFT JOIN MATMED ON MATMED.ID = MOVMAT.MATMED_ID
                WHERE MOVMAT.MOVEXA_ID = ${curfatcopia_item.id}
            `

            const curexamatmed = await sequelize
                .query(query, {
                    type: QueryTypes.SELECT,
                }).catch(() => {
                    throw new Error(`Não foi possível buscar os dados de faturamento.`)
                })

            if(curexamatmed.length > 0){
                curexamatmed.forEach(curexamatmed_item => {
                    if(curexamatmed_item.agrupamat === '1'){
                        const curfat_agrupado = curfat.filter(x => x.matmed_id === curexamatmed_item.matmed_id && x.idmovpac === curfatcopia_item.idmovpac)

                        if(curfat_agrupado.length === 0){
                            let ocurfatcopia = _.cloneDeep(curfatcopia_item)

                            delete ocurfatcopia.descexame;
                            delete ocurfatcopia.amb;
                            delete ocurfatcopia.valorfilmec;
                            delete ocurfatcopia.valorfilmep;
                            delete ocurfatcopia.valconvenio;
                            delete ocurfatcopia.valpaciente;
                            delete ocurfatcopia.valorexa;

                            let clone = _.cloneDeep(curexamatmed_item)

                            ocurfatcopia = {...clone, ...ocurfatcopia}

                            delete ocurfatcopia.id
                            delete ocurfatcopia.exame_id

                            ocurfatcopia.descexame = curexamatmed_item.descricao
                            ocurfatcopia.matmed_id = curexamatmed_item.matmed_id
                            ocurfatcopia.qtd = parseInt((curexamatmed_item.qtd || 0), 10)
                            ocurfatcopia.precototc = (((convert_valor(curexamatmed_item.preco) * parseInt((curexamatmed_item.qtd || 0), 10)) / 100) * parseFloat(curexamatmed_item.mpercconv || 0)).toFixed(2);
                            ocurfatcopia.precototp = (((convert_valor(curexamatmed_item.preco) * parseInt((curexamatmed_item.qtd || 0), 10)) / 100) * parseFloat(curexamatmed_item.mpercpac || 0)).toFixed(2);

                            curfat_agrupado.push({...ocurfatcopia})
                        }
                    } else {
                        const curfat_agrupado = curfat.filter(x => x.matmed_id === curexamatmed_item.matmed_id && x.idmovpac === curfatcopia_item.idmovpac)

                        if(curfat_agrupado.length === 0){
                            let ocurfatcopia = _.cloneDeep(curfatcopia_item)

                            delete ocurfatcopia.descexame;
                            delete ocurfatcopia.amb;
                            delete ocurfatcopia.valorfilmec;
                            delete ocurfatcopia.valorfilmep;
                            delete ocurfatcopia.valconvenio;
                            delete ocurfatcopia.valpaciente;
                            delete ocurfatcopia.valorexa;

                            let clone = _.cloneDeep(curexamatmed_item)

                            ocurfatcopia = {...clone, ...ocurfatcopia}

                            delete ocurfatcopia.id
                            delete ocurfatcopia.exame_id

                            ocurfatcopia.descexame = curexamatmed_item.descricao
                            ocurfatcopia.matmed_id = curexamatmed_item.matmed_id
                            ocurfatcopia.qtd = parseInt((curexamatmed_item.qtd || 0), 10)
                            ocurfatcopia.precototc = (((convert_valor(curexamatmed_item.preco) * parseInt((curexamatmed_item.qtd || 0), 10)) / 100) * parseFloat(curexamatmed_item.mpercconv || 0)).toFixed(2);
                            ocurfatcopia.precototp = (((convert_valor(curexamatmed_item.preco) * parseInt((curexamatmed_item.qtd || 0), 10)) / 100) * parseFloat(curexamatmed_item.mpercpac || 0)).toFixed(2);

                            curfat_agrupado.push({...ocurfatcopia})
                        } else {
                            let ocurfatcopia = _.cloneDeep(curexamatmed_item)
                            delete ocurfatcopia.id
                            delete ocurfatcopia.exame_id

                            ocurfatcopia.descexame = curexamatmed_item.descricao
                            ocurfatcopia.matmed_id = curexamatmed_item.matmed_id
                            ocurfatcopia.qtd = parseInt((curexamatmed_item.qtd || 0), 10) + parseInt((curfat_agrupado[0].qtd || 0), 10)
                            ocurfatcopia.precototc = ((((convert_valor(curexamatmed_item.preco) * parseInt((curexamatmed_item.qtd || 0), 10)) / 100) * parseFloat(curexamatmed_item.mpercconv || 0)) + parseFloat(curfat_agrupado[0].precototc || 0)).toFixed(2);
                            ocurfatcopia.precototp = ((((convert_valor(curexamatmed_item.preco) * parseInt((curexamatmed_item.qtd || 0), 10)) / 100) * parseFloat(curexamatmed_item.mpercpac || 0)) + parseFloat(curfat_agrupado[0].precototp || 0)).toFixed(2);

                            curfat_agrupado.push({...ocurfatcopia})
                        }
                    }
                });
            }
        }

        if(body.chkguiaprinc === '1'){
            curfinal = curfinal.map(x => {
                return {...x, requisicao: x.guiaprincipal || ''}
            })
        }

        let curmovexa = [];
        if(body.chkagrupa === '1' || parametros.ativa_qtdexa === '1'){
            if(parametros.ativa_qtdexa !== '1'){
                curfinal
                    .forEach(curfinal_item => {
                        const indexObj = curmovexa.findIndex(
                            item =>
                                item.idmovpac === curfinal_item.idmovpac &&
                                item.tabamb === curfinal_item.tabamb &&
                                item.requisicao === curfinal_item.requisicao &&
                                item.valconv === curfinal_item.valconv
                        );

                        if(curfinal_item.tipo === '0'){
                            if (indexObj !== -1) {
                                curmovexa[indexObj].movexames.push(curfinal_item);
                                curmovexa[indexObj].qtdexa += 1;
                            } else {
                                curmovexa.push({
                                    idmovpac: curfinal_item.idmovpac,
                                    tabamb: curfinal_item.tabamb,
                                    requisicao: curfinal_item.requisicao,
                                    valconv: curfinal_item.valconv,
                                    movexames: [curfinal_item],
                                    qtdexa: 1
                                });
                            }
                        }

                    });

                const curmovexa_new = []

                curmovexa.map(curmovexa_item => {
                    curmovexa_new.push({...curmovexa_item.movexames[0], qtdexa: curmovexa_item.qtdexa})
                })

                curmovexa = curmovexa_new;
            } else {
                curfinal
                    .forEach(curfinal_item => {
                        const indexObj = curmovexa.findIndex(
                            item =>
                                item.idmovpac === curfinal_item.idmovpac &&
                                item.tabamb === curfinal_item.tabamb &&
                                item.requisicao === curfinal_item.requisicao
                        );

                        if(curfinal_item.tipo === '0'){
                            if (indexObj !== -1) {
                                curmovexa[indexObj].movexames.push(curfinal_item);
                                curmovexa[indexObj].qtdexa += parseFloat(curfinal_item.qtdexafat || 1);
                                curmovexa[indexObj].valorexa += parseFloat(curfinal_item.valorexa || 0);
                                curmovexa[indexObj].valorpac += parseFloat(curfinal_item.valorpac || 0);
                                curmovexa[indexObj].valorconv += parseFloat(curfinal_item.valorconv || 0);
                                curmovexa[indexObj].valorconvesp += parseFloat(curfinal_item.valorconvesp || 0);
                                curmovexa[indexObj].valorpacesp += parseFloat(curfinal_item.valorpacesp || 0);
                                curmovexa[indexObj].valpaciente += parseFloat(curfinal_item.valpaciente || 0);
                                curmovexa[indexObj].valconvenio += parseFloat(curfinal_item.valconvenio || 0);
                            } else {
                                curmovexa.push({
                                    idmovpac: curfinal_item.idmovpac,
                                    tabamb: curfinal_item.tabamb,
                                    requisicao: curfinal_item.requisicao,
                                    movexames: [curfinal_item],
                                    qtdexa: parseFloat(curfinal_item.qtdexafat || 0),
                                    valorexa: parseFloat(curfinal_item.valorexa || 0),
                                    valorpac: parseFloat(curfinal_item.valorpac || 0),
                                    valorconv: parseFloat(curfinal_item.valorconv || 0),
                                    valorconvesp: parseFloat(curfinal_item.valorconvesp || 0),
                                    valorpacesp: parseFloat(curfinal_item.valorpacesp || 0),
                                    valpaciente: parseFloat(curfinal_item.valpaciente || 0),
                                    valconvenio: parseFloat(curfinal_item.valconvenio || 0),
                                });
                            }
                        }

                    });

                const curmovexa_new = []

                curmovexa.map(curmovexa_item => {
                    curmovexa_new.push({
                        ...curmovexa_item.movexames[0],
                        qtdexa: curmovexa_item.qtdexa,
                        valorexa: curmovexa_item.valorexa,
                        valorpac: curmovexa_item.valorpac,
                        valorconv: curmovexa_item.valorconv,
                        valorconvesp: curmovexa_item.valorconvesp,
                        valorpacesp: curmovexa_item.valorpacesp,
                        valpaciente: curmovexa_item.valpaciente,
                        valconvenio: curmovexa_item.valconvenio,
                    })
                })

                curmovexa = curmovexa_new;
            }
        } else {
            curmovexa = curfinal
                .filter(curfinal_item => (curfinal_item.tipo === '0'))
                .map(curfinal_item => ({...curfinal_item, qtdexa: 1}));
        }

        let curmatmed = curfinal.filter(curfinal_item => (curfinal_item.tipo !== '0'))

        const curfinal_agrupado = _.groupBy(_.cloneDeep(curfinal), 'idmovpac');
        const movpacs = Object.keys(curfinal_agrupado)

        curfinal = []
        movpacs.forEach(idmovpac => {
            curfinal_agrupado[idmovpac].forEach(item => {
                if(body.tiss_ordem_alfa === '1'){
                    const indexObj = curfinal.findIndex(
                        x =>
                            x.nome === item.nome &&
                            x.posto === item.posto &&
                            x.amostra === item.amostra &&
                            (x.requisicao || '').trim() === (item.requisicao || '').trim()
                    );

                    if (indexObj !== -1) {
                        curfinal[indexObj].push(item);
                    } else {
                        curfinal.push({...item});
                    }
                } else {
                    const indexObj = curfinal.findIndex(
                        x =>
                            x.posto === item.posto &&
                            x.amostra === item.amostra &&
                            (x.requisicao || '').trim() === (item.requisicao || '').trim()
                    );

                    if (indexObj === -1) {
                        curfinal.push(item);
                    }
                }
            })
        });

        cgc_cpf     = usaemp ? curempresa.cgc_cpf : parametros.cgc_cpf;
        uf          = usaemp ? curempresa.uf : parametros.uf;
        razao       = usaemp ? curempresa.razao : parametros.razao;
        logra       = usaemp ? curempresa.logra : parametros.logra;
        endereco    = usaemp ? curempresa.endereco : parametros.endereco;
        numero      = usaemp ? curempresa.numero : parametros.numero;
        ibge        = usaemp ? curempresa.ibge : parametros.ibge;
        cep         = usaemp ? curempresa.cep : parametros.cep;
        responsavel = usaemp ? curempresa.responsavel : parametros.responsavel;
        crm         = usaemp ? curempresa.crm : parametros.crm;
        cbos        = usaemp ? curempresa.cbos : parametros.cbos;
        codeletron  = usaemp ? curempresa.codeletron : curfinal[0].codeletron;
        codconv     = usaemp ? curempresa.codconv : curfinal[0].codconv;
        registro    = usaemp ? curempresa.registro : curfinal[0].registro;
        cnes        = usaemp ? curempresa.cnes : parametros.cnes;

        const lchkLoteHash = (body.chklotehash || '0') !== '0';
        const lchkGerArqNumTran = (body.chkgerarqnumtran || '0') !== '0';

        const erros = {
            erros_gerais: [],
            erros_itens: []
        }

        numtra    = await procSQL(req, 'convenio', 'numtra', { id: convenio_id});
        loteConv    = lote.lotefat_id;
        let dataatu = new Date();
        const horaatu = format(new Date(), 'HH:mm:ss');

        if(['13', '14', '15'].includes(body.chkversao)){
            dataatu = format(new Date(), 'yyyy-MM-dd')
        }

        const versoes = {
            '6': {
                xml: 'tissV3_02_00',
                versao: '3.02.00',
                tagVersaoPadrao: 'ans:versaoPadrao',
            },
            '9': {
                xml: 'tissV3_03_00',
                versao: '3.03.00',
                tagVersaoPadrao: 'ans:Padrao',
            },
            '10': {
                xml: 'tissV3_03_01',
                versao: '3.03.01',
                tagVersaoPadrao: 'ans:Padrao',
            },
            '11': {
                xml: 'tissV3_03_02',
                versao: '3.03.02',
                tagVersaoPadrao: 'ans:Padrao',
            },
            '12': {
                xml: 'tissV3_03_03',
                versao: '3.03.03',
                tagVersaoPadrao: 'ans:Padrao',
            },
            '13': {
                xml: 'tissV3_04_00',
                versao: '3.04.00',
                tagVersaoPadrao: 'ans:Padrao',
            },
            '14': {
                xml: 'tissV3_04_01',
                versao: '3.04.01',
                tagVersaoPadrao: 'ans:Padrao',
            },
            '15': {
                xml: 'tissV3_05_00',
                versao: '3.05.00',
                tagVersaoPadrao: 'ans:Padrao',
            },
        }

        const identificacaoPrestador = {}
        const versaoPadrao = {
            [versoes[body.chkversao].tagVersaoPadrao]: versoes[body.chkversao].versao
        }

        if(!codconv){
            cgc_cpf = cgc_cpf.replace(/[^\d]/g, '');

            if(!cgc_cpf){
                if(usaemp){
                    erros.erros_gerais.push('CAMPO CNPJ NÃO INFORMADO CORRETAMENTE NA EMPRESA');
                } else {
                    erros.erros_gerais.push('CAMPO CNPJ NÃO INFORMADO CORRETAMENTE NOS PARAMETROS');
                }
            }

            identificacaoPrestador['ans:CNPJ'] = cgc_cpf;
        } else {
            identificacaoPrestador['ans:codigoPrestadorNaOperadora'] = codconv.trim();
        }

        if(!registro){
            if(usaemp){
                erros.erros_gerais.push('CAMPO REGISTRO NÃO INFORMADO CORRETAMENTE NO CADASTRO DE EMPRESA CODIGO DOS CONVENIOS');
            } else {
                erros.erros_gerais.push('CAMPO REGISTRO NÃO INFORMADO CORRETAMENTE NO CADASTRO DE CONVENIO');
            }
        }

        const guias = [];
        const curlote = [];

        for (let i = 0; i < curfinal.length; i++) {
            const curfinal_item = curfinal[i];

            const cabecalhoGuia = {}
            const dadosAutorizacao = {}
            const dadosBeneficiario = {}
            const contratadoSolicitante = {}
            const profissionalSolicitante = {}
            const dadosSolicitacao = {}
            const contratadoExecutante = {}
            const procedimentosExecutados = []

            if(['13', '14', '15'].includes(body.chkversao)){
                if(body.chkguiaprinc === '1'){
                    cabecalhoGuia['ans:guiaPrincipal'] = (curfinal_item.requisicao || '').trim();
                }

                if(!curfinal_item.tipoident){
                    curfinal_item.tipoident = '01'
                }

                if(body.chkguiaope === '1' && ['14', '15'].includes(body.chkversao)){
                    dadosAutorizacao['ans:numeroGuiaOperadora'] = (curfinal_item.requisicao || '').trim();
                }
            } else {
                // if(parseFloat(curfinal_item.valaut || 0) > 0){
                //     if(curfinal_item.dtautoriza){
                //         dadosAutorizacao['ans:dataValidadeSenha'] = ''
                //     }
                // }

                if(curfinal_item.cns){
                    dadosBeneficiario['ans:numeroCNS'] = (curfinal_item.cns || '').trim()
                }
            }

            totguia += 1
            guialote += 1

            if(!(curfinal_item.requisicao || '').trim()){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: "CAMPO GUIA NÃO INFORMADO"
                })
            }

            if(!curfinal_item.dtautoriza){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: "CAMPO DATA DA AUTORIZACAO DA GUIA NÃO INFORMADO"
                })
            }

            const lcdata = curfinal_item.dtautoriza;

            if(!curfinal_item.autoriza && curfinal_item.senha === '1'){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: "CAMPO NUMERO DA AUTORIZAÇÃO NÃO INFORMADO"
                })
            }

            if(curfinal_item.autoriza && curfinal_item.autoriza.toString().trim()){
                dadosAutorizacao['ans:senha'] = curfinal_item.autoriza.toString().trim();
            }

            if(curfinal_item.verifmatric === '1' && curfinal_item.modulo11 === '1'){
                if(!modulo11c(curfinal_item.matricula)){
                    erros.erros_itens.push({
                        posto: curfinal_item.posto,
                        amostra: curfinal_item.amostra,
                        codigo: curfinal_item.codigo,
                        erroa: "NUMERO DE MATRICULA INVALIDO"
                    })
                }
            }

            if(parseInt(curfinal_item.qtdchar || 0, 10) + parseInt(curfinal_item.qtdchar2 || 0, 10) + parseInt(curfinal_item.qtdchar3 || 0, 10) !== 0){
                const checaMatricula = checa_len_matricula((curfinal_item.matricula || '').trim(), curfinal_item, true)
                if(!checaMatricula.status){
                    erros.erros_itens.push({
                        posto: curfinal_item.posto,
                        amostra: curfinal_item.amostra,
                        codigo: curfinal_item.codigo,
                        erroa: checaMatricula.erro
                    })
                }
            }

            if(curfinal_item.rn === '1'){
                dadosBeneficiario['ans:atendimentoRN'] = 'S'
            } else {
                dadosBeneficiario['ans:atendimentoRN'] = 'N'
            }

            let cpf = (curfinal_item.cpf || '').replace(/[^\d]/g, '');

            if(body.chkcodconv === '1'){
                const medicocod = await procSQL(req, 'medicocod', 'medicocod', {
                    medico_id: curfinal_item.medico_id
                });

                if(medicocod){
                    contratadoSolicitante['ans:codigoPrestadorNaOperadora'] = (medicocod || '').replace('.', '').replace('/', '').replace('-', '').trim()
                } else {
                    erros.erros_itens.push({
                        posto: curfinal_item.posto,
                        amostra: curfinal_item.amostra,
                        codigo: curfinal_item.codigo,
                        erroa: `CODIGO DO CONVENIO DO MEDICO CRM: ${(curfinal_item.crm || '').trim()} NÃO INFORMADO`
                    })

                    if(cpf.length === 14){
                        contratadoSolicitante['ans:cnpjContratado'] = cpf
                    } else {
                        contratadoSolicitante['ans:cpfContratado'] = cpf || '00000000000';
                    }

                    if(!cpf){
                        erros.erros_itens.push({
                            posto: curfinal_item.posto,
                            amostra: curfinal_item.amostra,
                            codigo: curfinal_item.codigo,
                            erroa: `CPF DO MEDICO CRM: ${curfinal_item.crm} NÃO INFORMADOO`
                        })
                    } else if (!verifica_cpf(cpf)){
                        erros.erros_itens.push({
                            posto: curfinal_item.posto,
                            amostra: curfinal_item.amostra,
                            codigo: curfinal_item.codigo,
                            erroa: `CPF DO MEDICO CRM: ${curfinal_item.crm} É INVALIDO`
                        })
                    }
                }
            } else {
                if(cpf.length === 14){
                    contratadoSolicitante['ans:cnpjContratado'] = cpf
                } else {
                    contratadoSolicitante['ans:cpfContratado'] = cpf || '00000000000';
                }

                if(!cpf){
                    erros.erros_itens.push({
                        posto: curfinal_item.posto,
                        amostra: curfinal_item.amostra,
                        codigo: curfinal_item.codigo,
                        erroa: `CPF DO MEDICO CRM: ${curfinal_item.crm} NÃO INFORMADOO`
                    })
                } else {
                    if (!verifica_cpf(cpf)){
                        erros.erros_itens.push({
                            posto: curfinal_item.posto,
                            amostra: curfinal_item.amostra,
                            codigo: curfinal_item.codigo,
                            erroa: `CPF DO MEDICO CRM: ${curfinal_item.crm} É INVALIDO`
                        })
                    }
                }
            }

            if(['9', '10', '11', '12', '13', '14', '15'].includes(body.chkversao)){
                profissionalSolicitante['ans:conselhoProfissional'] = curfinal_item.cons || '06' ;
            } else {
                profissionalSolicitante['ans:conselhoProfissional'] = curfinal_item.cons || '6' ;
            }

            if(!(curfinal_item.crm || '').trim().replace(/[^\d]/g, '')){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: `CRM DO MEDICO ${(curfinal_item.nome_med || '').trim()} NÃO INFORMADO`
                })
            }

            if(!(curfinal_item.ufcrm || '')){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: `UF DO MEDICO CRM: ${curfinal_item.crm} NÃO INFORMADO`
                })
            }

            if(!(curfinal_item.cbos3 || '')){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: `CBOS TISS 3 DO MEDICO CRM: ${curfinal_item.crm} NÃO INFORMADO`
                })
            }

            if(!(curfinal_item.dtautorizae || '')){
                erros.erros_itens.push({
                    posto: curfinal_item.posto,
                    amostra: curfinal_item.amostra,
                    codigo: curfinal_item.codigo,
                    erroa: `CAMPO DATA DA EMISSAO DA GUIA NÃO INFORMADO`
                })
            }

            if(body.chkversao === '15' && curfinal_item.texto_ind_clinica){
                dadosSolicitacao['ans:indicacaoClinica'] = curfinal_item.texto_ind_clinica.trim()
            } else {
                dadosSolicitacao['ans:indicacaoClinica'] = 1
            }

            if(body.chkversao !== '15'){
                contratadoExecutante['ans:codigoPrestadorNaOperadora'] = (codconv || '').toString().trim()
            } else {
                if(!codconv){
                    cgc_cpf = cgc_cpf.replace(/[^\d]/g, '');

                    if(!cgc_cpf){
                        if(usaemp){
                            erros.erros_gerais.push('CAMPO CNPJ NÃO INFORMADO CORRETAMENTE NA EMPRESA');
                        } else {
                            erros.erros_gerais.push('CAMPO CNPJ NÃO INFORMADO CORRETAMENTE NOS PARAMETROS');
                        }
                    }

                    identificacaoPrestador['ans:cnpjContratado'] = cgc_cpf;
                } else {
                    contratadoExecutante['ans:codigoPrestadorNaOperadora'] = codconv.toString().trim()
                }
            }

            if(!razao){
                if(usaemp){
                    erros.erros_gerais.push('CAMPO RAZAO SOCIAL NÃO INFORMADO CORRETAMENTE NA EMPRESA');
                } else {
                    erros.erros_gerais.push('CAMPO RAZAO SOCIAL NÃO INFORMADO CORRETAMENTE NOS PARAMETROS');
                }
            }

            if(!cnes){
                if(usaemp){
                    erros.erros_gerais.push('CAMPO CNES NÃO INFORMADO CORRETAMENTE NA EMPRESA');
                } else {
                    erros.erros_gerais.push('CAMPO CNES NÃO INFORMADO CORRETAMENTE NOS PARAMETROS');
                }
            }

            let idatu = ''
            if(body.chkguia === '1'){
                idatu = curfinal_item.posto + curfinal_item.amostra + (curfinal_item.requisicao || '').trim();
            } else {
                idatu = curfinal_item.idmovpac;
            }

            const curfilme = []

            let valtot = 0;
            let valfil = 0;
            let codfilme = '';
            let lnsequencial = 1;

            for (let i = 0; i < curmovexa.length; i++) {
                const curmovexa_item = curmovexa[i];
                if(body.chkguia === '1' ? curmovexa_item.posto + curmovexa_item.amostra + (curmovexa_item.requisicao || '').trim() === idatu : curmovexa_item.idmovpac === idatu){
                    const procedimentoExecutado = {};

                    if(['13', '14', '15'].includes(body.chkversao)){
                        procedimentoExecutado['ans:sequencialItem'] = lnsequencial;

                        dataate = curfinal_item.dataentrap || format(new Date(), 'yyyy-MM-dd');
                    } else {
                        dataate = curfinal_item.dataentrap || format(new Date(), 'yyyy-MM-dd');
                    }

                    let horaate = (curfinal_item.horaentrap || '12:00') + ':00';
                    let lchorafinal = `${parseInt(horaate.split(':')[0], 10) + 2}:${horaate.split(':')[1]}:${horaate.split(':')[2]}`
                    lchorafinal = parseInt(lchorafinal.split(':')[0], 10) > 21 ? '23:59:59' : lchorafinal;

                    if(!curmovexa_item.depara3 || !curmovexa_item.depara3.trim()){
                        erros.erros_itens.push({
                            posto: curmovexa_item.posto,
                            amostra: curmovexa_item.amostra,
                            codigo: curmovexa_item.codigo,
                            erroa: `CODIGO DEPARA TISS 3 DA TABELA DE PREÇO NÃO INFORMADO`
                        })
                    }

                    curmovexa_item.amb = (curmovexa_item.amb || '')
                        .toString()
                        .trim()
                        .replace('.', '')
                        .replace('-')
                        .replace(',', '');

                    const amb =
                        curmovexa_item.amb
                        ? curmovexa_item.amb.substr(0, 8).padStart(8,0)
                        : '00000000';

                    if(amb === '00000000'){
                        erros.erros_itens.push({
                            posto: curmovexa_item.posto,
                            amostra: curmovexa_item.amostra,
                            codigo: curmovexa_item.codigo,
                            erroa: `CAMPO COD AMB INCORRETO`
                        })
                    }

                    const somamattiss = await procSQL(req, 'convenio', 'exibmattiss', {id: curmovexa_item.convenio_id});
                    if(somamattiss === '1'){
                        curmovexa_item.valorfilmec = 0;
                    }

                    if(body.chkseparafilme === '1' && parseFloat(curmovexa_item.valorfilmec || 0) > 0 ){
                        curmovexa_item.codfilme = curmovexa_item.codfilme.replace('.', '').replace('-', '').replace(',', '')

                        codfilme = curmovexa_item.codfilme;

                        if(!codfilme){
                            erros.erros_itens.push({
                                posto: curmovexa_item.posto,
                                amostra: curmovexa_item.amostra,
                                codigo: curmovexa_item.codigo,
                                erroa: `CAMPO CODIGO DO FILME NAO INFORMADO NO CADASTRO DE PLANOS`
                            })
                        }

                        curfilme.push({
                            exame_id: curmovexa_item.exame_id,
                            valorfilmec: curmovexa_item.valorfilmec,
                            reducaoacrescimo: reducaoacrescimo_mat_med_fil
                        })

                        if(parametros.ativa_qtdexa !== '1'){
                            const valConvenio = convert_valor(curmovexa_item.valconvenio);
                            const valorfilmec = convert_valor(curmovexa_item.valorfilmec);

                            const valorTotal = valConvenio * parseInt((curmovexa_item.qtdexa || 0), 10);
                            const valorTotalFilmec = valorfilmec * parseInt((curmovexa_item.qtdexa || 0), 10);

                            procedimentoExecutado['ans:valorUnitario'] = valConvenio.toFixed(2);
                            procedimentoExecutado['ans:valorTotal'] = valorTotal.toFixed(2);

                            // totrs += valorTotal;
                            valtot += valorTotal;
                            valfil += valorTotalFilmec;
                        } else {
                            const valConvenio = convert_valor(curmovexa_item.valconvenio);
                            const valorUnitario = valConvenio / parseInt((curmovexa_item.qtdexa || 0), 10);
                            const valorfilmec = convert_valor(curmovexa_item.valorfilmec);

                            procedimentoExecutado['ans:valorUnitario'] = valorUnitario.toFixed(2);
                            procedimentoExecutado['ans:valorTotal'] = valConvenio.toFixed(2);

                            // totrs += valConvenio;
                            valtot += valorTotal;
                            valfil += valorfilmec;
                        }
                    } else {
                        if(parametros.ativa_qtdexa !== '1'){
                            const valConvenio = convert_valor(curmovexa_item.valconvenio);
                            const valorfilmec = convert_valor(curmovexa_item.valorfilmec);

                            const valorTotal = valConvenio * parseInt((curmovexa_item.qtdexa || 0), 10);
                            const valorTotalFilmec = valorfilmec * parseInt((curmovexa_item.qtdexa || 0), 10);

                            procedimentoExecutado['ans:valorUnitario'] = (valConvenio + valorfilmec).toFixed(2);
                            procedimentoExecutado['ans:valorTotal'] = (valorTotal + valorTotalFilmec).toFixed(2);

                            // totrs += valorTotal;
                            valtot += valorTotal + valorTotalFilmec;
                            valfil += valorTotalFilmec;
                        } else {
                            const valConvenio = convert_valor(curmovexa_item.valconvenio);
                            const valorfilmec = convert_valor(curmovexa_item.valorfilmec);

                            const valorUnitario = valConvenio / parseInt((curmovexa_item.qtdexa || 0), 10);

                            procedimentoExecutado['ans:valorUnitario'] = (valorUnitario + valorfilmec).toFixed(2);
                            procedimentoExecutado['ans:valorTotal'] = (valConvenio + valorfilmec).toFixed(2);

                            // totrs += valConvenio;
                            valtot += valorTotal + valorfilmec;
                            valfil += valorfilmec;
                        }
                    }

                    if(body.chkequipesadt === '1'){
                        if(!curmovexa_item.medrea_id){
                            erros.erros_itens.push({
                                posto: curmovexa_item.posto,
                                amostra: curmovexa_item.amostra,
                                codigo: curmovexa_item.codigo,
                                erroa: `MEDICO REALIZANTE NÃO INFORMADO`
                            })
                        }

                        const cpf = (curmovexa_item.cpf_medrea || '').trim().replace(/[^\d]/g, '');

                        let conselho = ''
                        if(['9', '10', '11', '12'].includes(body.chkversao)){
                            conselho = curmovexa_item.cons || '06' ;
                        } else {
                            conselho = curmovexa_item.cons || '6' ;
                        }

                        procedimentoExecutado['ans:equipeSadt'] = {
                            'ans:grauPart': '00',
                            'ans:codProfissional': {
                                'ans:cpfContratado': cpf || '00000000000',
                            },
                            'ans:nomeProf': (curmovexa_item.nome_medrea || '').trim(),
                            'ans:conselho': conselho,
                            'ans:numeroConselhoProfissional': (curmovexa_item.crm_medrea || '').trim(),
                            'ans:UF': estado_tiss(curmovexa_item.uf_medrea || parametros.uf),
                            'ans:CBOS': (curmovexa_item.cbos3rea || '').trim().replace('.',''),
                        }
                    }

                    deparatab = (curmovexa_item.depara3 || '').trim()

                    const procedimentoExecutadoItem = {
                        ...procedimentoExecutado,
                        'ans:dataExecucao': dataate,
                        'ans:horaInicial': horaate,
                        'ans:horaFinal': lchorafinal,
                        'ans:procedimento': {
                            'ans:codigoTabela': (curmovexa_item.depara3 || '').trim(),
                            'ans:codigoProcedimento': amb,
                            'ans:descricaoProcedimento': curmovexa_item.descexame.substr(0, 60).trim(),
                        },
                        'ans:quantidadeExecutada': curmovexa_item.qtdexa,
                        'ans:viaAcesso': 1,
                        'ans:tecnicaUtilizada': 1,
                        'ans:reducaoAcrescimo': (curmovexa_item.reducaoacrescimo || '1') === '1' ? 1 : (curmovexa_item.reducaoacrescimo || '').toString().replace(',', '.'),
                    }

                    procedimentosExecutados.push(procedimentoExecutadoItem)
                    lnsequencial++;
                }
            }

            const curlote_item_new = {
                nome: curfinal_item.nome,
                requisicao: curfinal_item.requisicao,
                data: curfinal_item.dtfatura,
                matricula: curfinal_item.matricula,
            }

            if(body.chkseparafilme === '1' && valfil > 0){
                curlote_item_new.valortot = valtot + valfil;
                totrs += valtot + valfil;
            } else {
                curlote_item_new.valortot = valtot;
                totrs += valtot;
            }

            curlote.push(curlote_item_new)

            const despesas = []

            let totmat = 0;
			let totmed = 0;
			let tottax = 0;
			let tagoutrasdespesas = false
			let totoutdesp = 0;

            if(body.chkseparafilme === '1' && valfil > 0){
                curfilme.forEach((curfilme_item, curfilme_index) => {
                    const valorfilmec = convert_valor(curfilme_item.valorfilmec);

                    const desepesa = {
                        'ans:sequencialItem': curfilme_index + 1,
                        'ans:codigoDespesa': '03',
                        'ans:servicosExecutados': {
                            'ans:dataExecucao': dataate,
                            'ans:horaInicial': '00:00:00',
                            'ans:horaFinal': '00:00:00',
                            'ans:codigoTabela': deparatab,
                            'ans:codigoProcedimento': codfilme,
                            'ans:quantidadeExecutada': 1,
                            'ans:unidadeMedida': '005',
                            'ans:reducaoAcrescimo': (curfilme_item.reducaoacrescimo || '1') === '1' ? 1 : (curfilme_item.reducaoacrescimo || '').toString().replace(',', '.'),
                            'ans:valorUnitario': valorfilmec.toFixed(2),
                            'ans:valorTotal': valorfilmec.toFixed(2),
                            'ans:descricaoProcedimento': 'MATERIAIS',
                            'ans:registroANVISA': 0,
                            'ans:codigoRefFabricante': 0,
                            'ans:autorizacaoFuncionamento': 'X',
                        }
                    }

                    despesas.push(desepesa)

                    totoutdesp += valorfilmec;
                    totmat += valorfilmec;
                });
            }

            let new_curmatmed = []

            if(body.chkguia === '1'){
                new_curmatmed = curmatmed.filter(item => item.idmovpac === curfinal.idmovpac && (item.requisicao || '').trim() === (curfinal_item.requisicao || '').trim())
            } else {
                new_curmatmed = curmatmed.filter(item => item.idmovpac === curfinal.idmovpac)
            }

            const curmat = [];
            let colnum = 1;
            new_curmatmed = _.groupBy(new_curmatmed, "matmed_id");
            _.forEach(new_curmatmed, (itens, matmed_id) => {
                let qtd = 0;
                let precototc = 0;

                itens.forEach((item) => {
                    qtd += parseInt(item.qtd || 0, 10);
                    precototc += convert_valor(item.precototc);
                });

                let precototcuni = precototc / qtd;

                curmat.push({
                    colnum,
                    matmed_id,
                    qtd,
                    precototc,
                    precototcuni
                });

                colnum++;
            });

            curmat.forEach((curmat_item, curmat_index) => {
                const despesa = {}

                if(curmat.tipo === '2'){
                    despesa['ans:codigoDespesa'] = '02';
                    totmed += convert_valor(curmat_item.precototc);
                } else if(curmat.tipo === '3'){
                    despesa['ans:codigoDespesa'] = '03';
                    tottax += convert_valor(curmat_item.precototc);
                } else {
                    despesa['ans:codigoDespesa'] = '01';
                    totmat += convert_valor(curmat_item.precototc);
                }

                if(!(curmat_item.tab3 || '').trim()){
                    erros.erros_itens.push({
                        posto: curfinal_item.posto,
                        amostra: curfinal_item.amostra,
                        codigo: curfinal_item.codigo,
                        erroa: `CAMPO TAB 3 MAT/MED NAO INFORMADO`
                    })
                }

                totoutdesp += curmat_item.precototc;
                totrs += curmat_item.precototc;

                despesas.push({
                    'ans:sequencialItem': curmat_index + 1,
                    'ans:servicosExecutados': {
                        'ans:dataExecucao': dataate,
                        'ans:horaInicial': '00:00:00',
                        'ans:horaFinal': '00:00:00',
                        'ans:codigoTabela': (curmat_item.tab3 || '').trim(),
                        'ans:codigoProcedimento': (curmat_item.codtab || ''),
                        'ans:quantidadeExecutada': curmat_item.qtd,
                        'ans:unidadeMedida': '005',
                        'ans:reducaoAcrescimo': (reducaoacrescimo_mat_med_fil || '1') === '1' ? 1 : (reducaoacrescimo_mat_med_fil || '').toString().replace(',', '.'),
                        'ans:valorUnitario': curmat_item.precototcuni.toFixed(2),
                        'ans:valorTotal': curmat_item.precototc.toFixed(2),
                        'ans:descricaoProcedimento': (curmat_item.descexame || '').trim(),
                        'ans:registroANVISA': 0,
                        'ans:codigoRefFabricante': 0,
                        'ans:autorizacaoFuncionamento': 'X',
                    },
                    ...despesa
                });
            })

            let outrasDespesas = {}
            if(despesas.length > 0){
                outrasDespesas = {
                    'ans:outrasDespesas': {
                        'ans:despesas': despesas
                    }
                }
            }

            const guia = {
                'ans:cabecalhoGuia': {
                    ...cabecalhoGuia,
                    'ans:registroANS': (codeletron || '').trim(),
                    'ans:numeroGuiaPrestador': (curfinal_item.requisicao || '').trim(),
                },
                'ans:dadosAutorizacao': {
                    ...dadosAutorizacao,
                    'ans:dataAutorizacao': lcdata
                },
                'ans:dadosBeneficiario': {
                    ...dadosBeneficiario,
                    'ans:numeroCarteira': (curfinal_item.matricula || '').trim(),
                    'ans:nomeBeneficiario': (curfinal_item.nome || '').trim(),
                },
                'ans:dadosSolicitante': {
                    'ans:contratadoSolicitante':  {
                        ...contratadoSolicitante,
                        'ans:nomeContratado': (curfinal_item.nome_med || '').trim()
                    },
                    'ans:profissionalSolicitante': {
                        ...profissionalSolicitante,
                        'ans:nomeProfissional': (curfinal_item.nome_med || '').trim(),
                        'ans:numeroConselhoProfissional': (curfinal_item.crm || '').trim().replace(/[^\d]/g, ''),
                        'ans:UF': estado_tiss(curfinal_item.ufcrm || parametros.uf),
                        'ans:CBOS': (curfinal_item.cbos3 || '').trim().replace('.', ''),
                    }
                },
                'ans:dadosSolicitacao': {
                    ...dadosSolicitacao,
                    'ans:dataSolicitacao': curfinal_item.dtautorizae || '0000-00-00',
                    'ans:caraterAtendimento': 1,
                },
                'ans:dadosExecutante': {
                    'ans:contratadoExecutante': {
                        ...contratadoExecutante,
                        'ans:nomeContratado': (razao || '').trim()
                    },
                    'ans:CNES': (cnes || '').trim().replace(/[^\d]/g, ''),
                },
                'ans:dadosAtendimento': {
                    'ans:tipoAtendimento': '05',
                    'ans:indicacaoAcidente': 2,
                    'ans:tipoConsulta': 1,
                },
                'ans:procedimentosExecutados': {
                    'ans:procedimentoExecutado': procedimentosExecutados
                },
                ...outrasDespesas,
                'ans:valorTotal': {
                    'ans:valorProcedimentos': valtot.toFixed(2),
                    'ans:valorDiarias': '0.00',
                    'ans:valorTaxasAlugueis': tottax.toFixed(2),
                    'ans:valorMateriais': totmat.toFixed(2),
                    'ans:valorMedicamentos': totmed.toFixed(2),
                    'ans:valorOPME': '0.00',
                    'ans:valorGasesMedicinais': '0.00',
                    'ans:valorTotalGeral': valtot.toFixed(2),
                }
            }

            guias.push(guia)

            if(body.chkguiaout === '1'){
                if(guialote === parseInt(body.qtdout, 10)){
                    guialote = 0;
                    break;
                }
            } else if(body.chkguia100 === '1'){
                if(guialote === 100){
                    guialote = 0;
                    break;
                }
            } else if(body.chkguia50 === '1'){
                if(guialote === 50){
                    guialote = 0;
                    break;
                }
            }
        }

        // Final

        const obj = {
            'ans:mensagemTISS': {
                $: {
                    'xmlns:ans': 'http://www.ans.gov.br/padroes/tiss/schemas',
                    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                    'xsi:schemaLocation': `http://www.ans.gov.br/padroes/tiss/schemas http://www.ans.gov.br/padroes/tiss/schemas/${versoes[body.chkversao].xml}.xsd`,
                },
                _: {
                    'ans:cabecalho': {
                        'ans:identificacaoTransacao': {
                            'ans:tipoTransacao': 'ENVIO_LOTE_GUIAS',
                            'ans:sequencialTransacao': numtra.toString(),
                            'ans:dataRegistroTransacao': dataatu,
                            'ans:horaRegistroTransacao': horaatu,
                        },
                        'ans:origem': {
                            'ans:identificacaoPrestador': {
                                ...identificacaoPrestador,
                            },
                        },
                        'ans:destino': {
                            'ans:registroANS': (registro || '').trim()
                        },
                        ...versaoPadrao
                    },
                    'ans:prestadorParaOperadora': {
                        'ans:loteGuias': {
                            'ans:numeroLote': loteConv,
                            'ans:guiasTISS': {
                                'ans:guiaSP-SADT': guias
                            },
                        },
                    }
                }
            }
        }

        const builder = new xml2js.Builder({
            xmldec: {
                version: '1.0',
                encoding: 'ISO-8859-1',
            },
            renderOpts: {
                pretty: false,
            },
        });

        let xmlInicial = builder.buildObject(obj);
        xmlInicial = xmlInicial.replace('[object Object]', '')

        const tagFinal = '</ans:prestadorParaOperadora>'
        const posInicial = xmlInicial.indexOf(tagFinal);

        const stringHash = xmlInicial.match(/\>(.*?)\</g).map(x => x.replace('>', '').replace('<', '').trim());
        let hash = crypto.createHash('md5').update(stringHash.join('')).digest("hex");

        let xmlFinal = xmlInicial.substring(0, posInicial + tagFinal.length);
        xmlFinal += `<ans:epilogo><ans:hash>${hash}</ans:hash></ans:epilogo></ans:mensagemTISS>`

        let filename = hash;
        if(lchkLoteHash){
            filename = `${loteConv.padStart(20, '0')}_${hash}`;
        } else if(lchkGerArqNumTran && numtra) {
            filename = `${numtra}`;
        } else if(parametros.nhashtiss === '1'){
            if(body.chknumaut === '1'){
                filename = `${numtra.padStart(20, '0')}_${hash}`;
            }
        }

        let totval = 0;
        let totrequi = 0;

        for(let i = 0; i < curlote.length; i++){
            const curlote_item = curlote[i];
            totrequi += 1;
            totval += convert_valor(curlote_item.valortot);
        }

        filename = `${filename}.xml`

        sinteticos.push({
            arq: filename,
            total: totval,
            conv: curfinal[0].fantasia,
            dti: dataini,
            dtf: datafim,
            totreq: totrequi
        });

        xmls.push({lote: loteConv, nome_arquivo_xml: filename, hash, xml: xmlFinal, guias: curlote, erros, dataini, datafim})
        erros_arquivos_geral.push(erros)
    }

    await ConvenioTiss.create({
        data_ger: format(new Date(), 'yyyy-MM-dd'),
        hora_ger: format(new Date(), 'HH:mm'),
        convenio_id,
        operador_id: req.userId,
        idopera_ultacao: req.userId,
        dataini,
        datafin: datafim,
        arquivo: ''
    });

    return {xmls, sinteticos, erros_arquivos_geral, dataini, datafim};
}
