import { procSQL, geraId } from './functions/functions';

class UtilController {
    async procSQL(req, res) {
        try {
            const { tabela, coluna, where = {} } = req.query;

            const result = await procSQL(req, tabela, coluna, JSON.parse(where));
            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async geraId(req, res) {
        try {
            const { nome_seq } = req.query;
            const result = await geraId(req, nome_seq);
            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new UtilController();
