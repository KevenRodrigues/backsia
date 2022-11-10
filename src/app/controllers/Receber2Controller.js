import Database from '../../database';

class Receber2Controller {
    async index(req, res) {
        const { Receber2, Ccusto, Plcontas } = Database.getModels(req.database);
        try {
            const receber2 = await Receber2.findAll({
                where: { receber_id: req.params.id },
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

            return res.status(200).json(receber2);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new Receber2Controller();
