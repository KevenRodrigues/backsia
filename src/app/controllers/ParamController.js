import { QueryTypes } from 'sequelize';
import Database from '../../database';

class ParamController {
    async index(req, res) {
        const { Param } = Database.getModels(req.database);
        try {
            const param = await Param.findAll().catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(param[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Param } = Database.getModels(req.database);
            // const schema = Yup.object().shape({
            //     id: Yup.number(),
            //     descricao: Yup.string(),
            //     status: Yup.number(),
            //     idopera_ultacao: Yup.number(),
            // });

            // if (!(await schema.isValid(req.body))) {
            //     return res.status(400).json({
            //         error: ' Validacao de campos obrigatorios Falhou.',
            //     });
            // }

            await Param.update(req.body, {
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
        return null;
    }

    async indexStatusExame(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Param } = Models;

            const statusParams = req.body;

            let columns = '';

            for (let i = 0; i < statusParams.length; i++) {
                const item = statusParams[i];
                if (i === 0) {
                    columns += 'desc_' + item.value;
                    columns += ', cor_' + item.value;
                } else {
                    columns += ', desc_' + item.value;
                    columns += ', cor_' + item.value;
                }
            }

            const status = await Param.sequelize
                .query(
                    `SELECT ${columns} FROM Param, Param2`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            const retorno = status[0];

            for (let i = 0; i < statusParams.length; i++) {
                const item = statusParams[i];
                const propDesc = 'desc_' + item.value.toLowerCase();
                const propCor = 'cor_' + item.value.toLowerCase();
                item.label = retorno[propDesc].trim();
                item.color = retorno[propCor].trim();
            }

            return res.status(200).json(statusParams);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new ParamController();
