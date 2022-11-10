/* eslint-disable no-plusplus */
/* eslint-disable no-unused-expressions */
import { Op } from 'sequelize';
import * as Yup from 'yup';
import getDelta from '../utils/getDelta';
import Database from '../../database';
import { geraMapa, gerarRelatorioHtml } from './functions/functions';

import MgPadraoCod1 from '../reports/mapagrade/mg_padrao_cod_1';
import MgPadraoDesc1 from '../reports/mapagrade/mg_padrao_desc_1';
import MgCultura1 from '../reports/mapagrade/mg_cultura_1';
import MgParasitologia1 from '../reports/mapagrade/mg_parasitologia_1';
import MgUranalise1 from '../reports/mapagrade/mg_uranalise_1';
import MgCoagulograma1 from '../reports/mapagrade/mg_coagulograma_1';
import MgHemograma1 from '../reports/mapagrade/mg_hemograma_1';
import MgBioquimica1 from '../reports/mapagrade/mg_bioquimica_1';

class GradeController {
    async index(req, res) {
        try {
            const { Grade, Motina, Setor } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';

            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';

            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Matriz"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Matriz"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += GradeController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = GradeController.handleFilters(filter, filtervalue);
                }
            }

            const grades = await Grade.findAll({
                order: Grade.sequelize.literal(`${order} ${orderdesc}`),
                where: Grade.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'status',
                    'setor_id',
                    'idopera_ultacao',
                    [Grade.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Setor,
                        as: 'setor',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const grades_trim = grades.map(grade => {
                grade.descricao = grade.descricao.trim();
                grade.motina.descricao = grade.motina.descricao.trim();
                grade.setor
                    ? (grade.setor.descricao = grade.setor.descricao.trim())
                    : null;
                return grade;
            });

            return res.status(200).json(grades_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Grade,
                Motina,
                Gradeexa,
                Exame,
                Setor,
            } = Database.getModels(req.database);
            const grade = await Grade.findOne({
                where: { id: req.params.id },
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    {
                        model: Setor,
                        as: 'setor',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Gradeexa,
                        as: 'gradeexa',
                        // attributes: ['id', 'grade_id', 'exame_id', 'ordem'],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!grade) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            grade.descricao = grade.descricao.trim();
            grade.setor
                ? (grade.setor.descricao = grade.setor.descricao.trim())
                : null;
            grade.gradeexa.map(gradeexa => {
                if (gradeexa.exame) {
                    gradeexa.exame.codigo = gradeexa.exame.codigo.trim();
                    gradeexa.exame.descricao = gradeexa.exame.descricao.trim();
                }
                return gradeexa;
            });
            return res.status(200).json(grade);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Grade, Gradeexa } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo descricao obrigatorio'),
                gradeexa: Yup.array().of(
                    Yup.object().shape({
                        exame_id: Yup.number()
                            .transform(value =>
                                Number.isNaN(value) ? undefined : value
                            )
                            .required('Obrigatorio informar o exame.'),
                    })
                ),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (req.body.id) {
                const grade = await Grade.findByPk(req.body.id, {
                    include: [{ model: Gradeexa, as: 'gradeexa' }],
                });

                if (!grade) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                const gradeexaDelta = getDelta(
                    grade.gradeexa,
                    req.body.gradeexa
                );
                await Grade.sequelize
                    .transaction(async transaction => {
                        // Update gradeexa
                        await Promise.all([
                            gradeexaDelta.added.map(async gradeexaD => {
                                await Gradeexa.create(gradeexaD, {
                                    transaction,
                                }).catch(Grade.sequelize, err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            gradeexaDelta.changed.map(async gradeexaData => {
                                const gradeexa = req.body.gradeexa.find(
                                    _gradeexa =>
                                        _gradeexa.id === gradeexaData.id
                                );
                                await Gradeexa.update(gradeexa, {
                                    where: { id: gradeexa.id },
                                    transaction,
                                }).catch(err => {
                                    return res
                                        .status(400)
                                        .json({ error: err.message });
                                });
                            }),
                            gradeexaDelta.deleted.map(async gradeexaDel => {
                                await gradeexaDel
                                    .destroy({ transaction })
                                    .catch(err => {
                                        return res
                                            .status(400)
                                            .json({ error: err.message });
                                    });
                            }),
                        ]);

                        await Grade.update(req.body, {
                            where: { id: req.body.id },
                            transaction,
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                    })
                    .error(err => {
                        return res.status(400).json({ error: err.message });
                    });
                // Finally update grade
                const {
                    descricao,
                    setor_id,
                    status,
                    gradeexa,
                    modelo,
                } = req.body;

                return res.status(200).json({
                    descricao,
                    setor_id,
                    status,
                    gradeexa,
                    modelo,
                });
            }
            const {
                id,
                descricao,
                setor_id,
                status,
                gradeexa,
                modelo,
            } = await Grade.create(req.body, {
                include: [{ model: Gradeexa, as: 'gradeexa' }],
            })
                .then(x => {
                    return Grade.findByPk(x.get('id'), {
                        include: [{ model: Gradeexa, as: 'gradeexa' }],
                    });
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json({
                id,
                descricao,
                setor_id,
                status,
                gradeexa,
                modelo,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Grade } = Database.getModels(req.database);
            await Grade.destroy({
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
        return null;
    }

    async gradeSetor(req, res) {
        try {
            const { Grade, Setor } = Database.getModels(req.database);

            let where = [];

            const { setor_id } = req.query;

            if (setor_id !== '') {
                where = [{ setor_id: parseFloat(setor_id) }, { status: '0' }];
            } else {
                where = [
                    { status: '0' },
                    {
                        setor_id: {
                            [Op.not]: null, // Like: sellDate IS NOT NULL
                        },
                    },
                ];
            }

            const grade = await Grade.findAll({
                where,
                attributes: ['id', 'descricao'],
                include: [
                    {
                        model: Setor,
                        as: 'setor',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!grade) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            return res.status(200).json(grade);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async geraMapas(req, res) {
        const { Posto } = Database.getModels(req.database);
        const {
            dataInicial,
            txthoraini,
            dataFinal,
            txthorafim,
            ordem,
            postoperm,
            txtposto,
            txtamostra,
        } = req.query;
        let {
            posto,
            grades,
            todospostos,
            reimprime,
            urgente,
            dataReport,
        } = req.query;
        dataReport = JSON.parse(dataReport);
        grades = grades.split(',');
        todospostos = todospostos === 'true';
        reimprime = reimprime === 'true';
        urgente = urgente === 'true';

        const html = [];

        if (posto === '' && todospostos) {
            let where = [];
            if (postoperm === '' || postoperm === undefined) {
                where = [];
            } else {
                where = [
                    {
                        codigo: {
                            [Op.in]: postoperm.split(','),
                        },
                    },
                ];
            }
            const getPostos = await Posto.findAll({
                where,
                attributes: ['id', 'codigo'],
            })
                .then(response => {
                    return response;
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (getPostos.length > 0) {
                if (getPostos.length > 0) {
                    // eslint-disable-next-line no-plusplus
                    for (let i = 0; i < getPostos.length; i++) {
                        const element = getPostos[i];
                        if (i === getPostos.length - 1) {
                            posto += `${element.codigo}`;
                        } else {
                            posto += `${element.codigo},`;
                        }
                    }
                }
            }
        }

        const termo = {};
        termo.caption = 'Imprimindo';
        termo.total = grades.length;
        termo.atual = 0;
        termo.visible = true;

        for (const curgra of grades) {
            const gerarel = true;
            let curmapa = [];
            if (gerarel) {
                curmapa = await geraMapa(req, {
                    dataInicial,
                    dataFinal,
                    curgra,
                    reimprime,
                    posto,
                    txthoraini,
                    txthorafim,
                    urgente,
                    ordem,
                    txtposto,
                    txtamostra,
                });
            }

            if (curmapa.length > 0) {
                const { modelo_selecionado } = curmapa[0];

                const dados = {
                    curmapa,
                    dataReport,
                    dataInicial,
                    dataFinal,
                    modelo_selecionado,
                };
                switch (modelo_selecionado) {
                    case 'mg_padrao_cod_1':
                        html.push(await MgPadraoCod1(req, res, dados));
                        break;
                    case 'mg_padrao_desc_1':
                        html.push(await MgPadraoDesc1(req, res, dados));
                        break;
                    case 'mg_cultura_1':
                        html.push(await MgCultura1(req, res, dados));
                        break;
                    case 'mg_parasitologia_1':
                        html.push(await MgParasitologia1(req, res, dados));
                        break;
                    case 'mg_uranalise_1':
                        html.push(await MgUranalise1(req, res, dados));
                        break;
                    case 'mg_coagulograma_1':
                        html.push(await MgCoagulograma1(req, res, dados));
                        break;
                    case 'mg_hemograma_1':
                        html.push(await MgHemograma1(req, res, dados));
                        break;
                    case 'mg_bioquimica_1':
                        html.push(await MgBioquimica1(req, res, dados));
                        break;
                    default:
                        break;
                }
            }
        }
        return res.status(200).json(html);
    }

    async visualizarMapa(req, res) {
        const dataReport = req.body;
        const reportHtml = await gerarRelatorioHtml(dataReport);
        res.status(200).json(reportHtml);
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Grade"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Grade"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Grade"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new GradeController();
