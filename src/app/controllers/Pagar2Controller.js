import Database from '../../database';

class Pagar2Controller {
    async index(req, res) {
        const { Pagar2, Ccusto, Plcontas } = Database.getModels(req.database);
        try {
            const pagar2 = await Pagar2.findAll({
                where: { pagar_id: req.params.id },
                // attributes: [
                //     'id',
                //     ['id', 'codigo'],
                //     'numerodoc',
                //     'parcela',
                //     'fornec_id',
                //     'vencimento',
                //     'datent',
                //     'valor',
                //     'empresa_id',
                //     'operador_id',
                //     'status',
                // ],
                include: [
                    {
                        model: Ccusto,
                        as: 'ccusto',
                        // attributes: ['fantasia'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontas',
                        // attributes: ['fantasia'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(pagar2);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new Pagar2Controller();
