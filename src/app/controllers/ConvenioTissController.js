import Database from '../../database';

class ConvenioTissController {
    async indexConv(req, res) {
        try {
            const { ConvenioTiss } = Database.getModels(req.database);
            const registros = await ConvenioTiss.findAll({
                where: { convenio_id: req.params.convenio_id },
                attributes: [
                    'id',
                    'convenio_id',
                    'data_ger',
                    'hora_ger',
                    'dataini',
                    'datafin',
                    'operador_id',
                    'arquivo',
                    'idopera_ultacao',
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!registros) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(registros);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new ConvenioTissController();
