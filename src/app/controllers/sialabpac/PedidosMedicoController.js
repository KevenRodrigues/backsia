import aws from 'aws-sdk';
import Pedidosmedico from '../../models/sialabpac/PedidosMedico';

const s3 = new aws.S3();

class PedidosmedicoController {
    async store(req, res) {
        try {
            const { id } = req.params;

            const { originalname: name, key, location: url } = req.file;

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            const file = await Pedidosmedico.create({
                name,
                key,
                url: newUrl,
                preagendado_id: id,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(file);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { key } = req.params;

            const params = { Bucket: 'sialab', Key: key };

            s3.deleteObject(params, function(err, data) {
                if (err) console.log(err, err.stack);
            });

            const pedidomedico = await Pedidosmedico.findOne({
                where: { key },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            await pedidomedico.destroy().catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json('Excluído com sucesso!');
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new PedidosmedicoController();
