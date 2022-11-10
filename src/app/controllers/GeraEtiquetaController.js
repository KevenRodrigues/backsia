import { QueryTypes } from 'sequelize';

import Database from '../../database';

class GeraEtiquetaController {
    async geraEtiquetasValues(req, res) {
        try {
            const sequelize = Database.instances[req.database];
            const { values } = req.query;
            const etiquetas = [];

            for (let i = 0; i < values.length; i++) {
                const element = JSON.parse(values[i]);
                const value = await sequelize.query(
                    `select gera_etiqueta_lab('
                        ${element.movpac_id}',
                        '${element.etq_coleta}',
                        '${element.etq_triagem}',
                        '${element.recipcol_id}',
                        '${element.reciptri_id}
                    ')`,
                {
                    type: QueryTypes.SELECT,
                }).catch(sequelize, err => {
                    return err.message;
                });

                if (value.length > 0) {
                    for (let i = 0; i < value.length; i++) {
                        const element = value[i];
                        const regExp = /\(([^)]+)\)/;
                        const matches = regExp.exec(element.gera_etiqueta_lab);
                        const newElement = matches[1].split(',');
                        const descricaoRecipiente = newElement[12].split('"')[1].trim()
                        etiquetas.push({
                            marca: newElement[0],
                            posto: newElement[1],
                            amostra: newElement[2],
                            dataentra: newElement[3],
                            horaentra: newElement[4],
                            dtcoleta: newElement[5],
                            hrcoleta: newElement[6],
                            urgente: newElement[7],
                            tubo: newElement[8],
                            nome: newElement[9],
                            movpac_id: newElement[10],
                            recip: newElement[11],
                            desc_recip: descricaoRecipiente,
                            exames: newElement[13],
                            qtdexa: newElement[14],
                            prontuario_id: newElement[15],
                            idade: newElement[16],
                            mes: newElement[17],
                            dia: newElement[18],
                        });
                    }
                }
            }

            return res.status(200).json(etiquetas);
        } catch (error) {
            return res.tatus(400).json({ error: error.message });
        }
    }
}

export default new GeraEtiquetaController();
