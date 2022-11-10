import * as Yup from 'yup';
import Database from '../../database';

class Tabela1Controller {
    async update(req, res) {
        try {
            const { Tabela1 } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number().required(),
                valorexa: Yup.number(),
                codamb: Yup.string(),
                valorfilme: Yup.number(),
                peso_porte: Yup.number(),
                peso_uco: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const exameExists = await Tabela1.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!exameExists) {
                return res
                    .status(400)
                    .json({ error: 'Exame não encontrado!' });
            }

            await Tabela1.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json(data);
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new Tabela1Controller();
