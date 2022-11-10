// import * as Yup from 'yup';
import { Op } from 'sequelize';
import Database from '../../database';

class ApoioPosController {
    async create(req, res) {
        try {
            const { Apoiopos } = Database.getModels(req.database);
            const findExame = await Apoiopos.findOne({
                where: {
                    [Op.and]: [
                        { apoio_id: req.params.id },
                        { posto_id: req.body.posto_id },
                    ],
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (findExame) {
                return res.status(400).json({ error: 'Posto já adicionado.' });
            }
            req.body.apoio_id = req.params.id;
            await Apoiopos.create(req.body)
                .then(posData => res.send(posData))
                .catch(err => {
                    throw err;
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return null;
    }

    async delete(req, res) {
        try {
            const { Apoiopos } = Database.getModels(req.database);
            await Apoiopos.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(rowsDestroyed => {
                    return res.status(200).json(rowsDestroyed);
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return true;
    }
}

export default new ApoioPosController();
