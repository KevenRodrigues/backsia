import Database from '../../database';

class Pagar1Controller {
    async index(req, res) {
        const { Pagar1, Contas, Banco } = Database.getModels(req.database);
        try {
            const pagar1 = await Pagar1.findAll({
                where: { pagar_id: req.params.id },
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

            return res.status(200).json(pagar1);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new Pagar1Controller();
