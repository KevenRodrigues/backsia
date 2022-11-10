import * as Yup from 'yup';
import Database from '../../database';

class UserController {
    async store(req, res) {
        try {
            const { User } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                name: Yup.string().required(),
                email: Yup.string()
                    .email()
                    .required(),
                password: Yup.string()
                    .required()
                    .min(6),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de dados obrigatorios falhou.',
                });
            }

            const userExists = await User.findOne({
                where: { email: req.body.email },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (userExists) {
                return res.status(400).json({ error: 'Usuario ja existe.' });
            }

            const { id, name, email, provider } = await User.create(req.body);

            return res.status(200).json({
                id,
                name,
                email,
                provider,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { User } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                name: Yup.string(),
                email: Yup.string().email(),
                oldPassword: Yup.string().min(6),
                password: Yup.string()
                    .min(6)
                    .when('oldPassword', (oldPassword, field) =>
                        oldPassword ? field.required() : field
                    ),
                confirmPassword: Yup.string().when(
                    'password',
                    (password, field) =>
                        password
                            ? field.required().oneOf([Yup.ref('password')])
                            : field
                ),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de dados obrigatorios falhou.',
                });
            }

            const { email, oldPassword } = req.body;

            const user = await User.findByPk(req.userId);

            if (email !== user.email) {
                const userExists = await User.findOne({ where: { email } });

                if (userExists) {
                    return res
                        .status(400)
                        .json({ error: 'Usuario ja existe.' });
                }
            }

            if (!(await user.checkPassword(oldPassword))) {
                return res.status(400).json({ error: 'Senhas nao conferem' });
            }

            const { id, name, provider } = await user.update(req.body);

            return res.status(200).json({
                id,
                name,
                email,
                provider,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new UserController();
