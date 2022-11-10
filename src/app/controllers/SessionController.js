import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import authConfig from '../../config/auth';
import Database from '../../database';

class SessionControler {
    async store(req, res) {
        try {
            const { User } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                name: Yup.string().required(),
                email: Yup.string()
                    .email()
                    .required(),
                password: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios falhou.',
                });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res
                    .status(400)
                    .json({ error: 'Usuario nao encontrado.' });
            }

            if (!(await user.checkPassword(password))) {
                return res.status(400).json({ error: 'Senhas n�o conferem.' });
            }

            const { id, name } = user;

            return res.status(200).json({
                user: {
                    id,
                    name,
                    email,
                },
                token: jwt.sign({ id }, authConfig.secret, {
                    expiresIn: authConfig.expiresIn,
                }),
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new SessionControler();
