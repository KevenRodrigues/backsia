import * as Yup from 'yup';
import User from '../../models/sialabpac/User';

class UserController {
    async index(req, res) {
        try {
            const { id } = req.user;
            const users = await User.findOne({
                where: id,
                attributes: ['id', 'name', 'email'],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json(users);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const schema = Yup.object().shape({
                name: Yup.string().required(),
                email: Yup.string()
                    .email()
                    .required(),
                password: Yup.string()
                    .required()
                    .min(6),
                password_match: Yup.string().required(),
                cpf: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({ error: 'Validation fails.' });
            }

            const userExist = await User.findOne({
                where: { email: req.body.email },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (userExist) {
                return res
                    .status(400)
                    .json({ error: 'Usuario já cadastrado.' });
            }

            if (req.body.password !== req.body.password_match) {
                return res
                    .status(400)
                    .json({ error: 'Password does not match!' });
            }

            const {
                id,
                name,
                email,
                admin_user,
                super_user,
                cpf,
            } = await User.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                name,
                email,
                admin_user,
                super_user,
                cpf,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const schema = Yup.object().shape({
                name: Yup.string(),
                email: Yup.string().email(),
                oldPassword: Yup.string(),
                password: Yup.string()
                    .transform(v => (v === '' ? undefined : v))
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

            if (
                !(await schema.validate(req.body).catch(err => {
                    return res.status(400).json(err);
                }))
            );

            const { email, oldPassword } = req.body;

            const user = await User.findByPk(req.user.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (email && email !== user.email) {
                const userExist = await User.findOne({
                    where: { email },
                });
                if (userExist) {
                    return res.status(400).json({
                        error: 'Usuario ja existente no banco de dados!',
                    });
                }
            }

            if (oldPassword && !(await user.checkPassword(oldPassword))) {
                return res.status(400).json({ error: 'Senhas nao conferem!' });
            }

            const { id, name, admin_user, super_user } = await user
                .update(req.body)
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                name,
                email,
                admin_user,
                super_user,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { name } = await User.findByPk(req.params.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            await User.destroy({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res
                .status(200)
                .json({ msg: `UsuÃ¡rio ${name} deletado com sucesso!` });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new UserController();
