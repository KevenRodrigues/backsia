import * as Yup from 'yup';
import Database from '../../database';

class ContatoController {
    async index(req, res) {
        try {
            const { Contato, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Contato"."nome",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Contato"."funcao" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                switch (filter) {
                    case 'motina.descricao':
                        where = ` (Unaccent(upper(trim(coalesce("motina"."descricao",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`;
                        break;
                    case 'codigoid':
                        where = ` CAST("Contato"."id" AS TEXT) LIKE '%${filtervalue.toUpperCase()}%'`;
                        break;
                    default:
                        filter !== ''
                            ? (where = ` (Unaccent(upper(trim(coalesce("Contato"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`)
                            : null;
                }
            }

            const contatos = await Contato.findAll({
                order: Contato.sequelize.literal(`${order} ${orderdesc}`),
                where: Contato.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigoid'],
                    'nome',
                    'funcao',
                    'email',
                    'fone',
                    'status',
                    'idopera_ultacao',
                    [Contato.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const contatos_trim = contatos.map(contato => {
                    contato.nome = contato.nome.trim();
                    contato.motina.descricao = contato.motina.descricao.trim();
                    return contato;
                });
                return res.status(200).json(contatos_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Contato, Motina } = Database.getModels(req.database);
            const contatos = await Contato.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'nome',
                    'funcao',
                    'email',
                    'fone',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!contatos) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                contatos.nome = contatos.nome ? contatos.nome.trim() : '';
                contatos.funcao = contatos.funcao ? contatos.funcao.trim() : '';
                contatos.email = contatos.email ? contatos.email.trim() : '';
                contatos.motina.descricao = contatos.motina.descricao
                    ? contatos.motina.descricao.trim()
                    : '';

                return res.status(200).json(contatos);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexConv(req, res) {
        try {
            const { Contato, Motina } = Database.getModels(req.database);
            const registros = await Contato.findAll({
                where: { convenio_id: req.params.convenio_id, status: 0 },
                attributes: [
                    'id',
                    'convenio_id',
                    'nome',
                    'fone',
                    'fax',
                    'email',
                    'funcao',
                    'ramal',
                    'cel',
                    'ddd',
                    'datanasc',
                    'obs',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!registros) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            const registros_trim = registros.map(registro => {
                registro.nome = registro.nome.trim();
                registro.motina.descricao = registro.motina.descricao.trim();
                return registro;
            });
            return res.status(200).json(registros_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Contato } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                nome: Yup.string().required(),
                funcao: Yup.string(),
                email: Yup.string(),
                fone: Yup.string(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, nome, funcao, email, status } = await Contato.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                nome,
                funcao,
                email,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Contato } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                nome: Yup.string(),
                funcao: Yup.string(),
                email: Yup.string(),
                fone: Yup.string(),
                status: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const contatoExists = await Contato.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!contatoExists) {
                return res
                    .status(400)
                    .json({ error: 'Contato não encontrado!' });
            }

            await Contato.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        nome: data[1].nome,
                        funcao: data[1].funcao,
                        email: data[1].email,
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
            const { Contato } = Database.getModels(req.database);
            await Contato.destroy({
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

export default new ContatoController();
