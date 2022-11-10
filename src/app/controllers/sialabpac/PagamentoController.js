import pagarme from 'pagarme';
import Pagarme from '../../models/sialabpac/Pagarme';
import Laboratorio from '../../models/sialabpac/Laboratorio';

class PagamentoController {
    async pagarmeSaldo(req, res) {
        try {
            const lab = await Laboratorio.findOne({
                where: { codigo: req.query.labcode },
            }).catch(err => {
                return err;
            });

            const getSaldo = await pagarme.client
                .connect({ api_key: `${lab.pagamento_key}` })
                .then(client => client.balance.primary())
                .then(balance => {
                    return balance;
                });
            res.status(200).json(getSaldo);
        } catch (err) {
            res.status(400).json({
                error:
                    err.message === 'You must supply a valid API key'
                        ? 'É necessário uma Chave de API'
                        : err.messagem,
            });
        }
    }

    async pagarmeTransacoes(req, res) {
        try {
            const lab = await Laboratorio.findOne({
                where: { codigo: req.query.labcode },
            }).catch(err => {
                return err;
            });

            const getTransacoes = await pagarme.client
                .connect({ api_key: `${lab.pagamento_key}` })
                .then(client => client.transactions.all())
                .then(transactions => {
                    return transactions;
                });
            res.status(200).json(getTransacoes);
        } catch (err) {
            res.status(400).json({
                error:
                    err.message === 'You must supply a valid API key'
                        ? 'É necessário uma Chave de API'
                        : err.messagem,
            });
        }
    }

    async pagarmeTransacoesOne(req, res) {
        const { id } = req.params;
        try {
            const lab = await Laboratorio.findOne({
                where: { codigo: req.query.labcode },
            }).catch(err => {
                return err;
            });
            const getTransacao = await pagarme.client
                .connect({ api_key: `${lab.pagamento_key}` })
                .then(client => client.transactions.find({ id }))
                .then(transaction => {
                    return transaction;
                });
            res.status(200).json(getTransacao);
        } catch (err) {
            res.status(400).json({ error: err.response.errors });
        }
    }

    async pagarmeTransferencia(req, res) {
        const { id } = req.params;
        try {
            const lab = await Laboratorio.findOne({
                where: { codigo: req.query.labcode },
            }).catch(err => {
                return err;
            });
            const getTransferencia = await pagarme.client
                .connect({ api_key: `${lab.pagamento_key}` })
                .then(client =>
                    client.transfers.create({
                        amount: 10000,
                        recipient_id: id,
                    })
                )
                .then(transfer => {
                    return transfer;
                });
            res.status(200).json(getTransferencia);
        } catch (err) {
            res.status(400).json({ errors: err.response.errors });
        }
    }

    async pagarmeErrors(req, res) {
        try {
            const error = await Pagarme.findOne({
                where: { codigo: req.params.id },
            }).then(transfer => {
                return transfer;
            });
            res.status(200).json(error);
        } catch (err) {
            res.status(400).json({ errors: err.response.errors });
        }
    }
}

export default new PagamentoController();
