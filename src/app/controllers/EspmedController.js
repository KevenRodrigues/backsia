import * as Yup from 'yup';
import Database from '../../database';

class EspmedController {
    async index(req, res) {
        try {
            const { Espmed, Motina } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';

            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Espmed"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (upper(trim(coalesce(CAST("Espmed"."id" AS TEXT),''))) LIKE '%${search.toUpperCase()}%')`;
            } else {
                switch (filter) {
                    case 'motina.descricao':
                        where = ` (Unaccent(upper(trim(coalesce("motina"."descricao",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`;
                        break;
                    case 'codigo':
                        where = ` CAST("Espmed"."id" AS TEXT) LIKE '%${filtervalue.toUpperCase()}%'`;
                        break;
                    default:
                        filter !== ''
                            ? (where = ` (Unaccent(upper(trim(coalesce("Espmed"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`)
                            : null;
                }
            }

            const espmeds = await Espmed.findAll({
                order: Espmed.sequelize.literal(`${order} ${orderdesc}`),
                where: Espmed.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Espmed.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            try {
                const espmeds_trim = espmeds.map(espmed => {
                    espmed.descricao = espmed.descricao.trim();
                    espmed.motina.descricao = espmed.motina.descricao.trim();
                    return espmed;
                });
                return res.status(200).json(espmeds_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Espmed, Motina } = Database.getModels(req.database);
            const espmeds = await Espmed.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'cnes',
                    'cnes2',
                    'cbos3',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!espmeds) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                espmeds.descricao = espmeds.descricao
                    ? espmeds.descricao.trim()
                    : '';
                espmeds.cnes = espmeds.cnes ? espmeds.cnes.trim() : '';
                espmeds.cbos3 = espmeds.cbos3 ? espmeds.cbos3.trim() : '';
                espmeds.motina.descricao = espmeds.motina.descricao
                    ? espmeds.motina.descricao.trim()
                    : '';

                return res.status(200).json(espmeds);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Espmed } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                cnes: Yup.string(),
                cbos3: Yup.string(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, descricao, cnes, cbos3, status } = await Espmed.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                cnes,
                cbos3,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Espmed } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                cnes: Yup.string(),
                cbos3: Yup.string(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const esptabExists = await Espmed.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!esptabExists) {
                return res.status(400).json({
                    error: 'Especialidade mÃ©dica nÃ£o encontrada!',
                });
            }

            await Espmed.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Espmed } = Database.getModels(req.database);
            await Espmed.destroy({
                where: {
                    id: req.params.id,
                },
            })
                .then(deletedRecord => {
                    if (deletedRecord === 1) {
                        return res
                            .status(200)
                            .json({ message: 'Deletado com sucesso.' });
                    }
                    return res
                        .status(400)
                        .json({ error: 'Nenhum registro encontrado' });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new EspmedController();
