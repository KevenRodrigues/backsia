// import * as Yup from 'yup';
import { Op } from 'sequelize';
import Database from '../../database';

class ApoioExaController {
    async index(req, res) {
        try {
            const { Apoioexa, Exame, Layout } = Database.getModels(
                req.database
            );
            const apoioexa = await Apoioexa.findAll({
                where: { apoio_id: req.params.id },
                attributes: [
                    'id',
                    'apoio_id',
                    'exame_id',
                    'layout_id',
                    'valor',
                    'codlab',
                    'dias',
                    'conservante',
                    'obrigavol',
                    'obrigatemp',
                    'tuboesteri',
                    'materiala',
                    'materialdi',
                    'descamo',
                    'obrigapeso',
                    'obrigaalt',
                    'obrigaleuco',
                    'obrigalinfo',
                    'tempodiurese',
                    'horadecoleta',
                    'usa_layout_alterna',
                    'importa_infadicional',
                    'importa_formatohp_diferente',
                    'importa_infadicional_resul',
                    'status',
                    'obrigaidade',
                    'idopera_ultacao',
                    'tira_unidade_resultados_somente_texto',
                    'alinha_resultado_texto_direita',
                    'teste_covid',
                ],
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'codigo', 'descricao'],
                    },
                    {
                        model: Layout,
                        as: 'layout',
                        attributes: ['id', 'descricao'],
                    },
                ],
                order: [[{ model: Exame, as: 'exame' }, 'descricao', 'ASC']],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!apoioexa) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            return res.status(200).json(apoioexa);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Apoioexa, Exame, Layout } = Database.getModels(
                req.database
            );
            const apoioexa = await Apoioexa.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'apoio_id',
                    'exame_id',
                    'layout_id',
                    'valor',
                    'codlab',
                    'dias',
                    'conservante',
                    'obrigavol',
                    'obrigatemp',
                    'tuboesteri',
                    'materiala',
                    'materialdi',
                    'descamo',
                    'obrigapeso',
                    'obrigaalt',
                    'obrigaleuco',
                    'obrigalinfo',
                    'tempodiurese',
                    'horadecoleta',
                    'usa_layout_alterna',
                    'importa_infadicional',
                    'importa_formatohp_diferente',
                    'importa_infadicional_resul',
                    'status',
                    'obrigaidade',
                    'idopera_ultacao',
                    'tira_unidade_resultados_somente_texto',
                    'alinha_resultado_texto_direita',
                    'teste_covid',
                ],
                include: [
                    {
                        model: Exame,
                        as: 'exame',
                        attributes: ['id', 'codigo', 'descricao'],
                    },
                    {
                        model: Layout,
                        as: 'layout',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!apoioexa) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            return res.status(200).json(apoioexa);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async create(req, res) {
        try {
            const { Apoioexa } = Database.getModels(req.database);
            const findExame = await Apoioexa.findOne({
                where: {
                    [Op.and]: [
                        { apoio_id: req.params.id },
                        { exame_id: req.body.exame_id },
                    ],
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (findExame) {
                return res.status(400).json({ error: 'Exame já adicionado.' });
            }
            req.body.apoio_id = req.params.id;
            await Apoioexa.create(req.body)
                .then(apoio => res.send(apoio))
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(200).json(true);
    }

    async update(req, res) {
        try {
            const { Apoioexa } = Database.getModels(req.database);
            const findExame = await Apoioexa.findOne({
                where: {
                    [Op.and]: [
                        { apoio_id: req.body.apoio_id },
                        { exame_id: req.body.exame_id },
                    ],
                    [Op.not]: [{ id: req.body.id }],
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (findExame) {
                return res.status(400).json({ error: 'Exame já adicionado.' });
            }
            await Apoioexa.update(req.body, {
                where: { id: req.body.id },
            })
                .then(async () => {
                    await Apoioexa.findOne({
                        where: { id: req.body.id },
                    }).then(response => res.send(response));
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(200).json(true);
    }

    async updateStatus(req, res) {
        try {
            const { Apoioexa } = Database.getModels(req.database);
            const findExame = await Apoioexa.findOne({
                where: {
                    id: req.params.id,
                },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            if (findExame) {
                const { status } = findExame;
                let update = null;
                if (status === 0) {
                    update = await Apoioexa.update(
                        { status: 1 },
                        {
                            where: { id: req.params.id },
                            returning: true,
                        }
                    ).catch(err => {
                        throw new Error({ error: err.message });
                    });
                } else {
                    update = await Apoioexa.update(
                        { status: 0 },
                        {
                            where: { id: req.params.id },
                            returning: true,
                        }
                    ).catch(err => {
                        throw new Error({ error: err.message });
                    });
                }
                return res.status(200).json(update[1][0]);
            }
            throw new Error('Exame não atualizado.');
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Apoioexa } = Database.getModels(req.database);
            await Apoioexa.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res
                            .status(200)
                            .json({ message: 'Exame deletado com sucesso.' });
                    }
                    return res
                        .status(400)
                        .json({ error: 'Nenhum exame encontrado' });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return true;
    }
}

export default new ApoioExaController();
