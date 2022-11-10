import * as Yup from 'yup';
import { QueryTypes } from 'sequelize';
import Database from '../../database';
import { procSQL } from './functions/functions';

class MaterialController {
    async index(req, res) {
        try {
            const { Material, Motina } = Database.getModels(req.database);
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
                where = ` "Material"."status" = 0 and (Unaccent(upper(trim(coalesce("Material"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Material"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += MaterialController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = MaterialController.handleFilters(
                        filter,
                        filtervalue
                    );
                }
            }

            const materiais = await Material.findAll({
                order: Material.sequelize.literal(`${order} ${orderdesc}`),
                where: Material.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'deparamat',
                    'b2b',
                    'idopera_ultacao',
                    [Material.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const materiais_trim = materiais.map(material => {
                    material.descricao = material.descricao
                        ? material.descricao.trim()
                        : '';
                    material.codigo = material.codigo
                        ? material.codigo.trim()
                        : '0';
                    material.status = material.status ? material.status : 0;
                    material.idopera_ultacao = material.idopera_ultacao
                        ? material.idopera_ultacao
                        : 0;
                    material.b2b = material.b2b ? material.b2b.trim() : '';
                    material.deparamat = material.deparamat
                        ? material.deparamat.trim()
                        : '';
                    material.motina.descricao = material.motina.descricao
                        ? material.motina.descricao.trim()
                        : '';
                    return material;
                });
                return res.status(200).json(materiais_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Material, Motina } = Database.getModels(req.database);
            const materiais = await Material.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'codigo',
                    'deparamat',
                    'b2b',
                    'idopera_ultacao',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['id','descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!materiais) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                materiais.descricao = materiais.descricao
                    ? materiais.descricao.trim()
                    : '';
                materiais.codigo = materiais.codigo
                    ? materiais.codigo.trim()
                    : '';
                materiais.status = materiais.status ? materiais.status : 0;
                materiais.idopera_ultacao = materiais.idopera_ultacao
                    ? materiais.idopera_ultacao
                    : 0;
                materiais.deparamat = materiais.deparamat
                    ? materiais.deparamat.trim()
                    : '';
                materiais.b2b = materiais.b2b ? materiais.b2b.trim() : '';
                materiais.motina.descricao = materiais.motina.descricao
                    ? materiais.motina.descricao.trim()
                    : '';

                return res.status(200).json(materiais);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Material } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                codigo: Yup.string().required(),
                deparamat: Yup.string(),
                b2b: Yup.string(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const {
                id,
                descricao,
                status,
                codigo,
                deparamat,
                b2b,
                idopera_ultacao,
            } = await Material.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
                codigo,
                deparamat,
                b2b,
                idopera_ultacao,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Material } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string().required(),
                status: Yup.number().required(),
                codigo: Yup.string().required(),
                deparamat: Yup.string(),
                b2b: Yup.string(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const materialExists = await Material.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!materialExists) {
                return res
                    .status(400)
                    .json({ error: 'Material com codigo nao encontrado' });
            }

            if (
                materialExists &&
                req.body.id !== materialExists.id.toString()
            ) {
                return res
                    .status(400)
                    .json({ error: 'Material com codigo ja cadastrado.' });
            }

            await Material.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        descricao: data[1].descricao,
                        status: data[1].status,
                        deparamat: data[1].deparamat,
                        b2b: data[1].b2b,
                        codigo: data[1].codigo,
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
            const { Material } = Database.getModels(req.database);
            await Material.destroy({
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

    async validaMaterial(req, res) {
        try {
            const { Examematperm } = Database.getModels(req.database);
            const sequelize = Database.instances[req.database];

            let where = ` WHERE CAST(id AS TEXT) = '${req.params.id}'`;

            if (req.body.exame_id) {
                const examematpermResult = await Examematperm.findAll({
                    where: Examematperm.sequelize.literal(
                        `"Examematperm"."exame_id" = '${req.body.exame_id}'`
                    ),
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (examematpermResult.length > 0) {
                    const exame_material_id = await procSQL(
                        req,
                        'exame',
                        'material_id',
                        {id: req.body.exame_id}
                    );

                    where += ` and material.id in (`;
                    if (exame_material_id > 0) {
                        where += ` '${exame_material_id}', `;
                    }

                    for (let i = 0; i < examematpermResult.length; i++) {
                        const element = examematpermResult[i];
                        if (i === examematpermResult.length - 1) {
                            where += ` '${element.material_id}') order by material.descricao `;
                        } else {
                            where += ` '${element.material_id}', `;
                        }
                    }
                }
            }

            const select = `
                SELECT * FROM material ${where}
            `;

            const result = await sequelize
                .query(select, {
                    type: QueryTypes.SELECT,
                })
                .catch(sequelize, err => {
                    return err.message;
                });

            return res.status(200).json(result[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'id':
                filter = ` CAST("Material"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Material"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filterName !== '' && filterName !== undefined
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Material"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new MaterialController();
