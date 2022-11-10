import xml2js from 'xml2js';
import * as _ from 'lodash';
import { QueryTypes } from 'sequelize';
import { parseISO, format } from 'date-fns';
import Database from '../../../../database';

const envio_pardini = async (req, curarqapoio) => {
    const builder = new xml2js.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'ISO-8859-1',
        },
    });
    const { codlab } = curarqapoio[0];
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

    const pedido = [];
    const report = [];
    const error = '';

    const sequelize = Database.instances[req.database];
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

    _.forEach(groupBy, (pac, postoamostra) => {
        const { nome, altura, peso, data_nasc, sexo, razao } = pac[0];
        const reportExames = [];
        const exame = [];

        const validacoesPedido = {
            CodPedLab: { _: postoamostra },
        };

        if (peso) {
            validacoesPedido.Peso = {
                _: peso.trim(),
            };
        }

        if (altura) {
            validacoesPedido.Altura = {
                _: altura
                    ? parseFloat(parseFloat(altura) / 100).toFixed(2)
                    : '',
            };
        }

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

        _.forEach(pac, item => {
            const codigoAtual = item.codlabexm;
            const exm = {};
            const materialAtual =
                item.materialdi === '1' ? 'DIV' : item.materiala.trim() || '';
            reportExames.push(item);

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
            exm.DataColeta = { _: item.dtcoleta };
            exm.HoraColeta = { _: item.hrcoleta };

            if (item.tpdiurese) {
                exm.TempoDiurese = {
                    _: item.tpdiurese.trim(),
                };
            }

            if (item.volume) {
                exm.VolumeDiurese = {
                    _: item.volume.trim(),
                };
            }

            if (item.conservante && item.conservante.trim()) {
                exm.Conservante = {
                    _: item.conservante.trim(),
                };
            }

            let obsAtual = '';

            if (item.leuc) {
                obsAtual += `Leucocitos: ${item.leuc}`;
            }

            if (item.linf) {
                obsAtual += item.leuc ? ' ' : '';
                obsAtual += `Linfocitos: ${item.leuc}`;
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

            exame.push(exm);
        });

        pedido.push({
            ...validacoesPedido,
            Paciente: {
                // eslint-disable-next-line radix
                CodPacLab: { _: parseInt(postoamostra) },
                Nome: { _: nome.trim() },
                ...validacaoPaciente,
                Sexo: { _: sexo === 'M' ? 'Masculino' : 'Feminino' },
            },
            Exame: exame,
        });

        report.push({
            paciente: `${postoamostra} - ${nome.trim()}`,
            razao,
            exames: reportExames,
        });
        return null;
    });

    if (!error) {
        const obj = {
            Registro: {
                ID: {
                    _: loteatual,
                },
                Protocolo: {
                    _: '1',
                },
                Lote: {
                    CodLab: {
                        _: codlab.trim(),
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
        // console.log({ xml, report });
        return { xml, report };
    }

    return { error };
};

export default envio_pardini;
