import { add, format, parseISO } from 'date-fns';
import { QueryTypes } from 'sequelize';
import xml2js from 'xml2js';
import crypto from 'crypto';
import * as _ from 'lodash';
import Database from '../../../../database'
import { checa_len_matricula, modulo11c, procSQL, verifica_cpf, estado_tiss, convert_valor } from '../functions';

export default async function geraTissImplementacao(req, body) {
    const { dataini, datafim, convenio_id, empresa_id, modeloGeracao } = body;
    const { ConvenioTiss } = Database.getModels(req.database);
    const sequelize = Database.instances[req.database];

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
    let reducaoacrescimo_mat_med_fil = 0;

    let totguia = 0;
    let totrs = 0;
    let totpac = 0;
    let guialote = 0;
    let dirold = '';
    let numtra = 0;
    let loteConv = 0;
    let nomearq = '';

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

    planos = await sequelize
        .query(`
            SELECT *
            FROM PLANO
            WHERE CONVENIO_ID = ${convenio_id}
        `, {
            type: QueryTypes.SELECT,
        }).catch(() => {
            throw new Error(`Não foi possível buscar os planos do convênio.`);
        })

    if(planos.length === 0){
        throw new Error(`Nenhum plano vinculado ao convênio.`);
    }

    for (let i = 0; i < planos.length; i++) {
        const plano = planos[i];

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
            PLANO.TABELA_ID,
            CONVENIO.ID AS CONVENIO_ID,
            CONVENIO.RAZAO,
            CONVENIO.FANTASIA,
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
            EXAME.DESCRICAO                        AS DESCEXAME,
            CAST('' AS CHAR(15))                   AS TABAMB,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALOREXA,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALORPAC,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALORCONV,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALORCONVESP,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALORPACESP,
            CAST('' AS CHAR(15))                   AS ESPECAMB,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALPACIENTE,
            CAST('00000000.00' AS NUMERIC(10,2))   AS VALCONVENIO,
            CAST('' AS CHAR(15))                   AS AMB,
            TABELA.DEPARA                          AS DEPARATAB,
            TABELA.DEPARA3,
            MOVEXA.REDUCAOACRESCIMO,
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
            ESPMED.DESCRICAO AS DESCESPMED,
            ESPMED.CNES,
            ESPMED.CBOS3,
            ESPMED.CONS,
            CID.CODIGO AS CODCID,
            CID.DESCRICAO AS DESCCID,
            EXAME.ESPTAB_ID,
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
            CAST(COALESCE(MOVEXA.QTDEXAME,1) AS NUMERIC(5,0)) AS QTDEXAFAT,
            convenio.tiss_loginprest, convenio.tiss_senhaprest, movexa.ausenciaCodValidacao, movexa.codValidacao,
            prontuario.tipoIdent, prontuario.IdentificadorBenef, prontuario.templateBiometrico,
            movpac.texto_ind_clinica,
            CONVENIO.CHKLOTEHASH,
            CONVENIO.GERARQNUMTRAN,
            CONVENIO.LOTE
            FROM MOVEXA
            LEFT JOIN EXAME      ON EXAME.ID      = MOVEXA.EXAME_ID
            LEFT JOIN PLANO      ON PLANO.ID      = MOVEXA.PLANO_ID
            LEFT JOIN CONVENIO   ON CONVENIO.ID   = MOVEXA.CONVENIO_ID
            LEFT JOIN TABELA     ON TABELA.ID     = PLANO.TABELA_ID
            LEFT JOIN MOVPAC     ON MOVPAC.ID     = MOVEXA.MOVPAC_ID
            LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
            LEFT JOIN MEDICO     ON MEDICO.ID     = MOVEXA.MEDICO_ID
            LEFT JOIN ESPMED     ON ESPMED.ID     = MEDICO.ESPMED_ID
            LEFT JOIN CID        ON CID.ID        = MOVPAC.CID_ID
            LEFT JOIN PORTE      ON PORTE.ID      = EXAME.PORTE_ID
        `;

        query += `
            WHERE PLANO.ID = ${plano.id}
                AND COALESCE(MOVEXA.NAOFATURA,0) = '0'
                AND COALESCE(EXAME.CONSULTA,0) = '0'
        `

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

        if(modeloGeracao === 'entrada'){
            query += `
                AND MOVEXA.DATAENTRA BETWEEN '${dataini}' AND '${datafim}'
            `
        } else {
            query += `
                AND MOVEXA.DTFATURA BETWEEN '${dataini}' AND '${datafim}'
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

        const convenio_espec = await sequelize
            .query(`
                SELECT *
                FROM CONVENIO_ESPEC
                WHERE CONVENIO_ESPEC.PLANO_ID = ${plano.id}
            `, {
                type: QueryTypes.SELECT,
            }).catch(() => {
                throw new Error(`Não foi possível buscar os dados do convênio.`)
            })

        // INDEX ON ESPTAB_ID TAG ESPTAB_ID

        if(curfat.length > 0){
            const tabela1 = await sequelize
                .query(`
                    SELECT *
                    FROM TABELA1
                    WHERE TABELA1.TABELA_ID = ${curfat[0].tabela_id}
                `, {
                    type: QueryTypes.SELECT,
                }).catch(() => {
                    throw new Error(`Não foi possível buscar os dados das tabelas de faturamento.`)
                })

            // INDEX ON EXAME_ID TAG EXAME_ID

            const valespec = await sequelize
                .query(`
                    SELECT *
                    FROM VALESPEC
                    WHERE VALESPEC.PLANO_ID = ${plano.id}
                `, {
                    type: QueryTypes.SELECT,
                }).catch(() => {
                    throw new Error(`Não foi possível buscar os dados das tabelas de faturamento.`)
                })

            // INDEX ON EXAME_ID TAG EXAME_ID

            for (let i = 0; i < curfat.length; i++) {
                const curfat_item = curfat[i];

                if(body.utiliza_valores_datas_procedimentos_cadastrados === '1'){
                    curfat_item.tabamb = curfat_item.ambmovexa || '';
                    curfat_item.valorexa = parseFloat(curfat_item.valbruto || 0).toFixed(2);
                    curfat_item.valorpac = parseFloat(curfat_item.valpac || 0).toFixed(2);
                    curfat_item.valorconv = parseFloat(curfat_item.valconv || 0).toFixed(2);

                    const tabela1_item = tabela1.find(item => item.exame_id === curfat_item.exame_id);
                    if(tabela1_item.depara3exame && tabela1_item.depara3exame.trim()){
                        curfat_item.depara3 = tabela1_item.depara3exame.trim();
                    }
                } else {
                    const convenio_espec_item = convenio_espec.find(item => item.esptab_id === curfat_item.esptab_id);
                    if(convenio_espec_item){
                        curfat_item.valch = convenio_espec_item.valorch || '0.0000';
                    }

                    const tabela1_item = tabela1.find(item => item.exame_id === curfat_item.exame_id);
                    if(tabela1_item){
                        if(curfat_item.tipotab === '2'){
                            let calcporte = 0;
                            let calcuco = 0;
                            let calcvalorexa = 0;

                            tabela1_item.peso_porte = parseFloat(tabela1_item.peso_porte || 0);
                            tabela1_item.peso_uco = parseFloat(tabela1_item.peso_uco || 0);
                            curfat_item.valorporte = parseFloat(curfat_item.valorporte || 0);
                            curfat_item.banda_porte = parseFloat(curfat_item.banda_porte || 0);
                            curfat_item.valch = parseFloat(curfat_item.valch || 0);
                            curfat_item.banda_uco = parseFloat(curfat_item.banda_uco || 0);
                            curfat_item.percpac = parseFloat(curfat_item.percpac || 0);
                            curfat_item.percconv = parseFloat(curfat_item.percconv || 0);

                            curfat_item.reducaoacrescimo = parseFloat(curfat_item.reducaoacrescimo || 1);
                            curfat_item.qtdexafat = parseFloat(curfat_item.qtdexafat || 1);

                            calcporte = tabela1_item.peso_porte * (curfat_item.valorporte * (curfat_item.banda_porte / 100));
                            calcuco = tabela1_item.peso_uco * (curfat_item.valch * (curfat_item.banda_uco / 100));

                            calcvalorexa = calcporte + calcuco;

                            curfat_item.tabamb = tabela1_item.codamb || '';
                            curfat_item.valorexa = calcvalorexa;

                            curfat_item.valorpac = (((calcvalorexa / 100) * curfat_item.percpac) * curfat_item.qtdexafat).toFixed(2);
                            curfat_item.valorconv = ((((calcvalorexa / 100) * curfat_item.percconv) * curfat_item.reducaoacrescimo) * curfat_item.qtdexafat).toFixed(2);
                            curfat_item.peso_porte = tabela1_item.peso_porte ? parseFloat(tabela1_item.peso_porte).toFixed(2) : '0.00';
                            curfat_item.peso_uco = tabela1_item.peso_uco ? parseFloat(tabela1_item.peso_uco).toFixed(2) : '0.00';
                        } else {
                            tabela1_item.valorexa = parseFloat(tabela1_item.valorexa || 0);
                            curfat_item.percpac = parseFloat(curfat_item.percpac || 0);
                            curfat_item.percconv = parseFloat(curfat_item.percconv || 0);

                            curfat_item.reducaoacrescimo = parseFloat(curfat_item.reducaoacrescimo || 1);
                            curfat_item.valch = parseFloat(curfat_item.valch || 1);
                            curfat_item.qtdexafat = parseFloat(curfat_item.qtdexafat || 1);


                            curfat_item.tabamb = tabela1_item.codamb || '';
                            curfat_item.valorexa = tabela1_item.valorexa * curfat_item.qtdexafat;
                            curfat_item.valorpac = (((tabela1_item.valorexa * curfat_item.valch / 100) * curfat_item.percpac) * curfat_item.qtdexafat).toFixed(2);
                            curfat_item.valorconv = ((((tabela1_item.valorexa * curfat_item.valch / 100) * curfat_item.percconv) * curfat_item.reducaoacrescimo) * curfat_item.qtdexafat).toFixed(2);
                        }

                        if(tabela1_item.depara3exame && tabela1_item.depara3exame.trim()){
                            curfat_item.depara3 = tabela1_item.depara3exame.trim();
                        }
                    }

                    const valespec_item = valespec.find(item => item.exame_id === curfat_item.exame_id);
                    if(valespec_item){
                        valespec.valorexa = parseFloat(valespec.valorexa || 0);
                        valespec.percconv = parseFloat(valespec.percconv || 0);
                        valespec.percpac = parseFloat(valespec.percpac || 0);
                        curfat.reducaoacrescimo = parseFloat(curfat.reducaoacrescimo || 1);
                        curfat.qtdexafat = parseFloat(curfat.qtdexafat || 1);

                        curfat_item.especamb = valespec_item.ambmovexa || '';
                        curfat_item.valorconvesp = ((((valespec.valorexa / 100) * valespec.percconv) * curfat.reducaoacrescimo) * curfat.qtdexafat).toFixed(2);
                        curfat_item.valorpacesp = (((valespec.valorexa / 100) * valespec.percpac) * curfat.qtdexafat).toFixed(2);
                    }
                }
            }

            for (let i = 0; i < curfat.length; i++) {
                const curfat_item = curfat[i];

                if(parseFloat(curfat_item.valorconvesp) && body.utiliza_valores_datas_procedimentos_cadastrados !== '1'){
                    curfat_item.valconvenio = curfat_item.valorconvesp;
                } else {
                    curfat_item.valconvenio = curfat_item.valorconv;
                }

                if(curfat_item.valorpacesp && body.utiliza_valores_datas_procedimentos_cadastrados !== '1'){
                    curfat_item.valpaciente = curfat_item.valorpacesp;
                } else {
                    curfat_item.valpaciente = curfat_item.valpac;
                }

                if(curfat_item.especamb && curfat_item.especamb.trim() && body.utiliza_valores_datas_procedimentos_cadastrados !== '1'){
                    curfat_item.amb = curfat_item.especamb;
                    curfat_item.tabamb = curfat_item.especamb;
                } else {
                    curfat_item.amb = curfat_item.tabamb;
                }
            }

            curfinal = [...curfinal, ...curfat]
        }
    }

    if(curfinal.length === 0){
        throw new Error('Nenhum paciente encontrado no período e convênio informado, não será possivel continuar com a geração do arquivo XML')
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
                            item.requisicao === curfinal_item.requisicao
                    );

                    if (indexObj !== -1) {
                        curmovexa[indexObj].movexames.push(curfinal_item);
                        curmovexa[indexObj].qtdexa += 1;
                    } else {
                        curmovexa.push({
                            idmovpac: curfinal_item.idmovpac,
                            tabamb: curfinal_item.tabamb,
                            requisicao: curfinal_item.requisicao,
                            movexames: [curfinal_item],
                            qtdexa: 1
                        });
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
        curmovexa = curfinal.map(curfinal_item => ({...curfinal_item, qtdexa: 1}));
    }

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

                if (indexObj === -1) {
                    curfinal.push(item);
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

    if(body.tiss_ordem_alfa === '1'){
        curfinal = _.orderBy(curfinal, ['nome', 'posto', 'amostra', 'requisicao'], ['asc', 'asc', 'asc', 'asc']);
    } else {
        curfinal = _.orderBy(curfinal, ['posto', 'amostra', 'requisicao'], ['asc', 'asc', 'asc']);
    }

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

    const xmls = []
    const erros_arquivos_geral = []
    let item_atu = 0;
    while(true){
        const erros = {
            erros_gerais: [],
            erros_itens: []
        }

        numtra    = await procSQL(req, 'convenio', 'numtra', { id: convenio_id});
        loteConv    = await procSQL(req, 'convenio', 'lote', { id: convenio_id});
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

        while(item_atu < curfinal.length){
            const curfinal_item = curfinal[item_atu];

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

            if(!(cnes || '').trim()){
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

            let valtot = 0;
            let lnsequencial = 1;

            for (let i = 0; i < curmovexa.length; i++) {
                const curmovexa_item = curmovexa[i];
                if(body.chkguia === '1' ? curmovexa_item.posto + curmovexa_item.amostra + (curmovexa_item.requisicao || '').trim() === idatu : curmovexa_item.idmovpac === idatu){
                    const procedimentoExecutado = {};

                    let dataate = '';
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

                    if(parametros.ativa_qtdexa !== '1'){
                        const valConvenio = convert_valor(curmovexa_item.valconvenio);
                        const valorTotal = valConvenio * parseInt((curmovexa_item.qtdexa || 0), 10);

                        procedimentoExecutado['ans:valorUnitario'] = valConvenio.toFixed(2);
                        procedimentoExecutado['ans:valorTotal'] = valorTotal.toFixed(2);

                        totrs += valorTotal;
                        valtot += valorTotal;
                    } else {
                        const valConvenio = convert_valor(curmovexa_item.valconvenio);
                        const valorUnitario = valConvenio / parseInt((curmovexa_item.qtdexa || 0), 10);

                        procedimentoExecutado['ans:valorUnitario'] = valorUnitario.toFixed(2);
                        procedimentoExecutado['ans:valorTotal'] = valConvenio.toFixed(2);

                        totrs += valConvenio;
                        valtot += valorTotal;
                    }

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
                valortot: valtot
            }

            curlote.push(curlote_item_new)

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
                'ans:valorTotal': {
                    'ans:valorProcedimentos': valtot.toFixed(2),
                    'ans:valorDiarias': '0.00',
                    'ans:valorTaxasAlugueis': '0.00',
                    'ans:valorMateriais': '0.00',
                    'ans:valorMedicamentos': '0.00',
                    'ans:valorOPME': '0.00',
                    'ans:valorGasesMedicinais': '0.00',
                    'ans:valorTotalGeral': valtot.toFixed(2),
                }
            }

            guias.push(guia)
            item_atu++;

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

        if(body.chknaograva !== '1'){
            await sequelize
                .query(`UPDATE CONVENIO
                        SET NUMTRA = COALESCE(NUMTRA,0) + 1,
                            LOTE = COALESCE(LOTE,0) + 1
                        WHERE CONVENIO.ID = ${convenio_id}`, {
                    type: QueryTypes.SELECT,
                })
                .catch(() => {
                    throw new Error('Erro ao atualizar convênio com novo número de lote e transação.');
                });
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

        if(item_atu === curfinal.length){
            break;
        }
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
