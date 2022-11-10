import * as Yup from 'yup';
import AuthPermission from '../../models/sialabpac/Authpermission';

class AuthPermissionController {
    async update(req, res) {
        try {
            const schema = Yup.object().shape({
                prontuarioid: Yup.number().required(),
                prontuario: Yup.string().required(),
                senhawebpro: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res
                    .status(400)
                    .json({ error: 'Validacao dos campos falhou.' });
            }

            const {
                prontuario,
                senhawebpro,
                prontuarioid,
            } = await AuthPermission.put(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                prontuario,
                senhawebpro,
                prontuarioid,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new AuthPermissionController();
