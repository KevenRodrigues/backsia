import xml2js from 'xml2js';
import * as _ from 'lodash';
import { parseISO, format } from 'date-fns';

const envio_alvaro = async curarqapoio => {
    const builder = new xml2js.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'ISO-8859-1',
        },
    });
    const { codlab, senhalab } = curarqapoio[0];
    const formatedDate = date => {
        const parseDate = date ? parseISO(date) : new Date();
        const formatetDate = format(parseDate, 'dd/MM/yyyy');
        return formatetDate;
    };
    const groupBy = _.groupBy(curarqapoio, 'postoamostra');

    const solicitacao = [];
    const paciente = [];
    const report = [];
    let error = '';

    _.forEach(groupBy, (pac, postoamostra) => {
        const { nome, data_nasc, sexo, razao } = pac[0];
        const reportExames = [];

        if (!data_nasc) {
            error = `Paciente: ${postoamostra} - ${nome.trim()} está sem sexo informado, favor verificar.`;
            return false;
        }

        paciente.push({
            $: {
                codigo_lis: postoamostra,
                nome: nome.trim(),
                datanasc: formatedDate(data_nasc),
                sexo,
            },
        });
        _.forEach(pac, item => {
            reportExames.push(item);
            const { linf, leuc, volume, peso, altura } = item;
            let dadosadicionais = '';
            dadosadicionais +=
                linf !== null ? `linfocitos=${linf.trim()} ` : '';
            dadosadicionais +=
                leuc !== null ? `leucocitos=${leuc.trim()} ` : '';
            dadosadicionais +=
                volume !== null ? `volume=${volume.trim()} ` : '';
            dadosadicionais += peso !== null ? `peso=${peso.trim()} ` : '';
            dadosadicionais +=
                altura !== null ? `altura=${altura.trim()} ` : '';
            dadosadicionais = dadosadicionais.substr(
                0,
                dadosadicionais.length - 1
            );
            dadosadicionais = dadosadicionais || null;

            solicitacao.push({
                $: {
                    codigo_lis: postoamostra,
                    codigopaciente: postoamostra,
                    data: formatedDate(),
                },
                amostra: {
                    $: {
                        material: item.materiala,
                    },
                    exame: {
                        $: {
                            codigo: item.codlabexm,
                            id_lis: item.idmovexa,
                            dadosadicionais,
                        },
                    },
                },
            });
        });
        report.push({
            paciente: `${postoamostra} - ${nome}`,
            razao,
            exames: reportExames,
        });
        return null;
    });

    if (!error) {
        const obj = {
            solicitacoes: {
                $: { versao: '20090801' },
                entidade: {
                    $: {
                        codigo: codlab,
                        chave: senhalab,
                    },
                    pacientes: {
                        paciente,
                    },
                    solicitacao,
                },
            },
        };

        const xml = builder.buildObject(obj);
        return { xml, report };
    }

    return { error };
};

export default envio_alvaro;
