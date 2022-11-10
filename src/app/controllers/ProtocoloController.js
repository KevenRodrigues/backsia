import Database from '../../database';

class ProtocoloController {
    async index(req, res) {
        const { protocolo, entregue, conferido } = req.query;
        const posto = protocolo.substr(0, 3);
        const amostra = protocolo.substr(3, 6);
        let where = '';

        switch (true) {
            case entregue === '0' && conferido === '0':
                where = `("Movexa"."statusexm" = 'IM' OR "Movexa"."statusexm" = 'SF' OR "Movexa"."statusexm" = 'EP' OR "Movexa"."statusexm" = 'EN') AND "movpac"."posto" = '${posto}' AND "movpac"."amostra" = '${amostra}'`;
                break;
            case entregue === '1' && conferido === '0':
                where = `("Movexa"."statusexm" = 'IM' OR "Movexa"."statusexm" = 'SF' OR "Movexa"."statusexm" = 'EP' OR "Movexa"."statusexm" = 'EN') AND "movpac"."posto" = '${posto}' AND "movpac"."amostra" = '${amostra}'`;
                break;
            case entregue === '0' && conferido === '1':
                where = `("Movexa"."statusexm" = 'IM' OR "Movexa"."statusexm" = 'SF' OR "Movexa"."statusexm" = 'CF') AND "movpac"."posto" = '${posto}' AND "movpac"."amostra" = '${amostra}'`;
                break;
            case entregue === '1' && conferido === '1':
                where = `("Movexa"."statusexm" = 'IM' OR "Movexa"."statusexm" = 'SF' OR "Movexa"."statusexm" = 'CF' OR "Movexa"."statusexm" = 'EP' OR "Movexa"."statusexm" = 'EN') AND "movpac"."posto" = '${posto}' AND "movpac"."amostra" = '${amostra}'`;
                break;
            default:
        }
        try {
            const {
                Movpac,
                Prontuario,
                Movexa,
                Exame,
                Convenio,
            } = Database.getModels(req.database);

            const registros = await Movexa.findAll({
                where: Movexa.sequelize.literal(where),
                attributes: ['id', 'exame_id', 'convenio_id', 'statusexm'],
                include: [
                    {
                        model: Movpac,
                        as: 'movpac',
                        attributes: ['posto', 'amostra'],
                        include: [
                            {
                                model: Prontuario,
                                as: 'prontuario',
                                attributes: ['nome'],
                            },
                        ],
                    },
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['codigo', 'descricao'],
                    },
                    {
                        model: Convenio,
                        as: 'convenio',
                        attributes: ['fantasia'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            // const registros = await Movpac.findAll({
            //     where: Movpac.sequelize.literal(where),
            //     attributes: ['posto', 'amostra'],
            //     include: [
            //         {
            //             model: Prontuario,
            //             as: 'prontuario',
            //             attributes: ['nome'],
            //         },
            //         {
            //             model: Movexa,
            //             as: 'movexa',
            //             attributes: ['exame_id', 'convenio_id', 'statusexm'],
            //             include: [
            //                 {
            //                     model: Exame,
            //                     as: 'exame',
            //                     attributes: ['codigo', 'descricao'],
            //                 },
            //                 {
            //                     model: Convenio,
            //                     as: 'convenio',
            //                     attributes: ['fantasia'],
            //                 },
            //             ],
            //         },
            //     ],
            // }).catch(err => {
            //     return res.status(400).json({ error: err.message });
            // });

            if (registros.length <= 0) {
                return res
                    .status(204)
                    .json({ msg: 'Nenhum exame encontrado.' });
            }

            return res.status(200).json(registros);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        const { Movexa } = Database.getModels(req.database);
        try {
            req.body.map(paciente => {
                const exames = paciente.movexa;
                exames.map(async exm => {
                    await Movexa.update(exm, {
                        where: { id: exm.id },
                    })
                        .then(async response => {
                            await Movexa.sequelize.query(
                                `INSERT INTO RASTREA (ID,MOVEXA_ID,DATA,HORA,OPERADOR_ID,ACAO,MAQUINA) values (nextval('rastrea_id_seq'),${
                                    exm.id
                                },cast(CURRENT_TIMESTAMP(2) as date),substr(cast(CURRENT_TIMESTAMP(2) as varchar),12,5),${
                                    req.userId
                                },'RESULTADO PROTOCOLADO STATUS: ${exm.statusexm.trim()}','${
                                    req.headers.host
                                }')`
                            );
                        })
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                });
                return null;
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        return res.status(200).json({ msg: 'Sucesso' });
    }
}

export default new ProtocoloController();
