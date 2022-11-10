import Database from '../../database';

class Receber1Controller {
    async index(req, res) {
        const { Receber1, Contas, Banco } = Database.getModels(req.database);
        try {
            const receber1 = await Receber1.findAll({
                where: { receber_id: req.params.id },
                include: [
                    {
                        model: Contas,
                        as: 'contas',
                        attributes: ['id', 'saldo'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(receber1);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new Receber1Controller();
