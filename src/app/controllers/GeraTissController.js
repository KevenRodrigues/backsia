import geraTiss from './functions/geraTiss/geraTiss';
import geraTiss6Lote from './functions/geraTiss/geraTiss6Lote';

class GeraTissController {
    async geraArquivoTiss(req, res) {
        try {
            const metodos = {
                geraTiss,
                geraTiss6Lote
            }

            const result = await metodos[req.params.metodo](req, req.body)

            if(!result){
                throw new Error('Erro ao gerar arquivo!')
            }

            return res.status(200).json(result);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new GeraTissController();
