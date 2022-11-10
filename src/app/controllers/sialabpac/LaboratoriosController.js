import * as Yup from 'yup';
import Laboratorio from '../../models/sialabpac/Laboratorio';
import Unidade from '../../models/sialabpac/Unidade';

class LaboratoriosController {
    async index(req, res) {
        try {
            const laboratorios = await Laboratorio.findAll({
                order: [['codigo', 'ASC']],
                attributes: [
                    'id',
                    'codigo',
                    'name',
                    'color1',
                    'color2',
                    'ativo',
                ],
                include: [
                    {
                        model: Unidade,
                        attributes: ['id', 'posto', 'name', 'matriz'],
                    },
                ],
            });
            if (Array.isArray(laboratorios) && laboratorios.length) {
                return res.status(200).json(laboratorios);
            }
            return res
                .status(400)
                .json({ error: 'Laboratório nao encontrado.' });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async index1(req, res) {
        try {
            const laboratorios = await Laboratorio.findByPk(req.params.id);
            if (laboratorios) {
                return res.status(200).json(laboratorios);
            }
            return res
                .status(400)
                .json({ error: 'Laboratório nao encontrado.' });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexPowerBi(req, res) {
        try {
            const laboratorios = await Laboratorio.findOne({
                where: { codigo: req.params.codigo },
                attributes: ['powerbi'],
            });

            if (laboratorios) {
                return res.status(200).json(laboratorios);
            }
            return res
                .status(400)
                .json({ error: 'Laboratório nao encontrado.' });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const schema = Yup.object().shape({
                codigo: Yup.number().required(),
                name: Yup.string().required(),
                cnpj: Yup.string()
                    .required()
                    .min(14),
                color1: Yup.string()
                    .required()
                    .min(7),
                color2: Yup.string()
                    .required()
                    .min(7),
                color3: Yup.string()
                    .required()
                    .min(7),
                ativo: Yup.boolean(),
            });

            if (!(await schema.isValid(req.body))) {
                return res
                    .status(400)
                    .json({ error: 'Todos os campos são obrigatórios.' });
            }

            const { admin_user } = await req.user;

            if (admin_user !== true) {
                return res.status(400).json({
                    error:
                        'Somente administradores podem cadastrar laboratórios',
                });
            }

            const labExist = await Laboratorio.findOne({
                where: { codigo: req.body.codigo },
            });

            if (labExist) {
                return res
                    .status(400)
                    .json({ error: 'Laboratório já cadastrado!' });
            }

            const {
                id,
                codigo,
                name,
                cnpj,
                color1,
                color2,
                color3,
                ativo,
            } = await Laboratorio.create(req.body);

            return res.status(200).json({
                id,
                codigo,
                name,
                cnpj,
                color1,
                color2,
                color3,
                ativo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const schema = Yup.object().shape({
                codigo: Yup.number(),
                name: Yup.string(),
                cnpj: Yup.string().min(14),
                color1: Yup.string().min(7),
                color2: Yup.string().min(7),
                color3: Yup.string().min(7),
                ativo: Yup.boolean(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({ error: 'Dados inválidos.' });
            }

            const laboratorio = await Laboratorio.findByPk(req.params.id);

            if (req.body.codigo && req.body.codigo !== laboratorio.codigo) {
                const labExist = await Laboratorio.findOne({
                    where: { codigo: req.body.codigo },
                });
                if (labExist) {
                    return res.status(400).json('Laboratório já cadastrado!');
                }
            }

            const {
                id,
                codigo,
                name,
                cnpj,
                color1,
                color2,
                color3,
                ativo,
            } = await laboratorio.update(req.body);

            return res.status(200).json({
                id,
                codigo,
                name,
                cnpj,
                color1,
                color2,
                color3,
                ativo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const deleteLaboratorio = await Laboratorio.destroy({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json(deleteLaboratorio);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new LaboratoriosController();
