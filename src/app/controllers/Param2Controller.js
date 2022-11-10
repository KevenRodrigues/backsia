import Database from '../../database';

class Param2Controller {
    async index(req, res) {
        const { Param2 } = Database.getModels(req.database);
        try {
            const param2 = await Param2.findAll().catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(param2[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Param2 } = Database.getModels(req.database);
            await Param2.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json(data);
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return null;
    }
}

export default new Param2Controller();
