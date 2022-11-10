import Database from '../../database';

class EntregaPacController {
    async store(req, res) {
        try {
            const { Movexa, Movpac } = Database.getModels(req.database);

            if (req.body.length > 0) {
                try {
                    for (let i = 0; i < req.body.length; i++) {
                        const item = req.body[i];
                        const dataMovexa = {
                            statusexm: 'EN',
                            idopera_ultacao: req.userId,
                        };

                        await Movexa.update(dataMovexa, {
                            where: { id: item.movexa_id },
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });

                        await Movexa.sequelize.query(
                            `update movpac set entreguepor = '${item.entreguepor}', ndoc = '${item.ndoc}' where id = ${item.movpac_id}`
                        );

                        await Movexa.sequelize.query(
                            `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                item.movexa_id
                            },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                req.userId
                            },'ENTREGA EXAME RECEPCAO: ${item.statusexm.trim()}','${
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

export default new EntregaPacController();
