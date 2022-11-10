import xml2js from 'xml2js';
import * as _ from 'lodash';
import { QueryTypes } from 'sequelize';
import Database from '../../../../database';

const envio_pardini = async (req, curarqapoio) => {
    const builder = new xml2js.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'ISO-8859-1',
        },
    });
    const { codlab, senhalab } = curarqapoio[0];

    const groupBy = _.groupBy(curarqapoio, 'postoamostra');

    const listapedidos = [];
    const report = [];
    const error = '';

    const sequelize = Database.instances[req.database];
    const loteatual = await sequelize
        .query(`select nextval('lotewsdb_id_seq')`, {
            type: QueryTypes.SELECT,
        })
        .then(response => {
            return response[0].nextval;
        })
        .catch(sequelize, err => {
            return err.message;
        });

    _.forEach(groupBy, (pac, postoamostra) => {
        const { nome, altura, peso, data_nasc, sexo, razao } = pac[0];
        const reportExames = [];
        const exames = [];

        _.forEach(pac, item => {
            reportExames.push(item);
            const exm = {
                CodigoExameDB: {
                    _: item.codlabexm.trim(),
                },
            };
            exames.push(exm);
        });

        const paciente = {
            ListaPacienteApoiado: {
                RGPacienteApoiado: { _: postoamostra },
                NomePaciente: { _: nome.trim() },
                SexoPaciente: { _: sexo.trim() },
                DataHoraPaciente: { _: data_nasc },
                NumeroCPF: { _: '' },
                NumeroCadastroNacionalSaude: { _: '' },
            },
            NumeroAtendimentoApoiado: { _: postoamostra },
            CodigoPrioridade: { _: 'R' },
            DescricaoDadosClinicos: { _: 'Nao informado' },
            DescricaoMedicamentos: { _: 'Nao informado' },
            DataHoraDUM: { _: '' },
            Altura: {},
            Peso: {},
            ListaProcedimento: {
                ct_Procedimento_v1: exames,
            },
            ListaSolicitante: {
                NomeSolicitante: { _: 'NÃO INFORMADO' },
                CodigoConselho: { _: 'CRM' },
                CodigoUFConselhoSolicitante: { _: 'PR' },
                CodigoConselhoSolicitante: { _: '0' },
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

        listapedidos.push(paciente);

        report.push({
            paciente: `${postoamostra} - ${nome.trim()}`,
            razao,
            exames: reportExames,
        });
        return null;
    });

    if (!error) {
        const obj = {
            ct_LotePedidos_v1: {
                NumeroLote: { _: loteatual },
                CodigoApoiado: { _: codlab.trim() },
                CodigoSenhaIntegracao: { _: senhalab.trim() },
                ListaPedidos: {
                    ct_Pedidos_v1: listapedidos,
                },
            },
        };

        const xml = builder.buildObject(obj);
        // console.log({ xml, report });
        return { xml, report };
    }

    return { error };
};

export default envio_pardini;
