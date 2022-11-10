import { Sequelize, QueryTypes, Op } from 'sequelize';
import Database from '../../database';

class RepeteExaController {
    async store(req, res) {
        try {
            const { Movexa } = Database.getModels(req.database);

            if (req.body.length > 0) {
                try {
                    for (let i = 0; i < req.body.length; i++) {
                        const item = req.body[i];

                        const sequelize = Database.instances[req.database];

                        const resultado = await sequelize
                            .query(
                                `select resultado from movexa where id = ${item.movexa_id}`,
                                {
                                    type: QueryTypes.SELECT,
                                }
                            )
                            .catch(sequelize, err => {
                                return err.message;
                            });

                        const dataMovexa = {
                            statusexm: 'ER',
                            statusresultado: '',
                            mascaralan: '',
                            formulalan: '',
                            rangerlan: '',
                            assina_ope: null,
                            datalib: null,
                            horalib: null,
                            exportado: 0,
                            impgra: 0,
                            veio: 1,
                            dt_interface: null,
                            motivoer: item.obsmot,
                            resultado_antes_er: resultado[0].resultado || null,
                            resultado: null,
                            idopera_ultacao: req.userId,
                        };

                        await Movexa.update(dataMovexa, {
                            where: { id: item.movexa_id },
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        await Movexa.sequelize.query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                item.movexa_id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'SOLICITADA REPETICAO DO EXAME STATUS: ${item.statusexm.trim()}','${
                                req.headers.host
                            }')`
                        );
                    }

                    return res.status(200).json(req.body);
                } catch (err) {
                    return res.status(400).json({ error: err.message });
                }
            } else {
                return res.status(406).json({
                    error: ' Formato de dados não aceito.',
                });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new RepeteExaController();
