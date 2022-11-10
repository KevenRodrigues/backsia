import Notificacao from '../../models/sialabpac/Notificacaos';

class NotificacaoController {
    async store(req, res) {
        try {
            const { user_id, laboratorio_id, mensagem, lida } = req.body;

            const notificacao = await Notificacao.create({
                user_id,
                laboratorio_id,
                mensagem,
                lida,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(notificacao);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new NotificacaoController();
