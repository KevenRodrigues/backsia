import * as Yup from 'yup';
import Unidade from '../../models/sialabpac/Unidade';
import Laboratorio from '../../models/sialabpac/Laboratorio';

class UnidadeController {
    async index(req, res) {
        try {
            const unidades = await Unidade.findAll({
                attributes: [
                    'id',
                    'matriz',
                    'posto',
                    'name',
                    'cep',
                    'endereco',
                    'numero',
                    'complemento',
                    'bairro',
                    'cidade',
                    'uf',
                    'telefone',
                    'horario',
                    'estacionamento',
                ],
                include: [{ model: Laboratorio, attributes: ['name'] }],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            return res.status(200).json(unidades);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const schema = Yup.object().shape({
                laboratorio_id: Yup.number().required(),
                matriz: Yup.boolean().required(),
                posto: Yup.string().required(),
                name: Yup.string().required(),
                cep: Yup.string()
                    .required()
                    .min(8),
                endereco: Yup.string().required(),
                numero: Yup.string().required(),
                complemento: Yup.string().required(),
                bairro: Yup.string().required(),
                cidade: Yup.string().required(),
                uf: Yup.string()
                    .required()
                    .min(2),
                telefone: Yup.string()
                    .required()
                    .min(10),
                horario: Yup.string().required(),
                estacionamento: Yup.string().required(),
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

            const unidadeExist = await Unidade.findOne({
                where: {
                    laboratorio_id: req.body.laboratorio_id,
                    posto: req.body.posto,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (unidadeExist) {
                return res
                    .status(400)
                    .json({ error: 'Unidade já cadastrada!' });
            }

            const {
                id,
                laboratorio_id,
                matriz,
                posto,
                name,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                telefone,
                horario,
                estacionamento,
            } = await Unidade.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                laboratorio_id,
                matriz,
                posto,
                name,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                telefone,
                horario,
                estacionamento,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const schema = Yup.object().shape({
                laboratorio_id: Yup.number().required(),
                matriz: Yup.boolean().required(),
                posto: Yup.string().required(),
                name: Yup.string().required(),
                cep: Yup.string()
                    .required()
                    .min(8),
                endereco: Yup.string().required(),
                numero: Yup.string().required(),
                complemento: Yup.string().required(),
                bairro: Yup.string().required(),
                cidade: Yup.string().required(),
                uf: Yup.string()
                    .required()
                    .min(2),
                telefone: Yup.string()
                    .required()
                    .min(10),
                horario: Yup.string().required(),
                estacionamento: Yup.string().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res
                    .status(400)
                    .json({ error: 'Todos os campos são obrigatórios.' });
            }

            const unidade = await Unidade.findByPk(req.params.id).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (req.body.posto && req.body.posto !== unidade.posto) {
                const unidadeExist = await Unidade.findOne({
                    where: { posto: req.body.posto },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });
                if (unidadeExist) {
                    return res
                        .status(400)
                        .json({ error: 'Posto já cadastrado!' });
                }
            }

            const {
                id,
                laboratorio_id,
                matriz,
                posto,
                name,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                telefone,
                horario,
                estacionamento,
            } = await unidade.update(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                laboratorio_id,
                matriz,
                posto,
                name,
                cep,
                endereco,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                telefone,
                horario,
                estacionamento,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const deleteUnidade = await Unidade.destroy({
                where: { id: req.params.id },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(deleteUnidade);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new UnidadeController();
