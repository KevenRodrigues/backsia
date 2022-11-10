import * as Yup from 'yup';
import Database from '../../database';

class DriveController {
    async index(req, res) {
        try {
            const { Drive, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Drive"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Drive"."codigo" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += DriveController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = DriveController.handleFilters(filter, filtervalue);
                }
            }

            const drives = await Drive.findAll({
                order: Drive.sequelize.literal(`${order} ${orderdesc}`),
                where: Drive.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'descricao',
                    'sigla',
                    'final',
                    'status',
                    'char_resul',
                    'idopera_ultacao',
                    'sia_sigla',
                    'sia_final',
                    [Drive.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const drives_trim = drives.map(drive => {
                    drive.descricao = drive.descricao.trim();
                    drive.motina.descricao = drive.motina.descricao.trim();
                    return drive;
                });
                return res.status(200).json(drives_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const { Drive, Motina } = Database.getModels(req.database);
            const drives = await Drive.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'descricao',
                    'sigla',
                    'final',
                    'espaco',
                    'insercao',
                    'fonte',
                    'estilo',
                    'tamanho',
                    'fontema',
                    'estiloma',
                    'tamanhoma',
                    'char_resul',
                    'status',
                    'char_fonte',
                    'inter_sigla',
                    'inter_final',
                    'cor',
                    'insercaofim',
                    'idopera_ultacao',
                    'drivetextframe',
                    'widthtextam_11',
                    'widthtexlenmenor_15',
                    'widthtexlenmaior_15',
                    'heightex',
                    'borderwidthtex',
                    'corbk',
                    'sia_sigla',
                    'sia_final',
                ],
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!drives) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                drives.descricao = drives.descricao
                    ? drives.descricao.trim()
                    : '';
                drives.sigla = drives.sigla ? drives.sigla.trim() : '';
                drives.final = drives.final ? drives.final.trim() : '';
                drives.inter_sigla = drives.inter_sigla
                    ? drives.inter_sigla.trim()
                    : '';
                drives.inter_final = drives.inter_final
                    ? drives.inter_final.trim()
                    : '';
                drives.sia_sigla = drives.sia_sigla
                    ? drives.sia_sigla.trim()
                    : '';
                drives.sia_final = drives.sia_final
                    ? drives.sia_final.trim()
                    : '';
                drives.fonte = drives.fonte ? drives.fonte.trim() : '';
                drives.estilo = drives.estilo ? drives.estilo.trim() : '';
                drives.fontema = drives.fontema ? drives.fontema.trim() : '';
                drives.estiloma = drives.estiloma ? drives.estiloma.trim() : '';
                drives.cor = drives.cor ? drives.cor.trim() : '';
                drives.corbk = drives.corbk ? drives.corbk.trim() : '';
                drives.motina.descricao = drives.motina.descricao
                    ? drives.motina.descricao.trim()
                    : '';

                return res.status(200).json(drives);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Drive } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                descricao: Yup.string().required(),
                status: Yup.number().required(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const { id, descricao, status } = await Drive.create(
                req.body
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                descricao,
                status,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Drive } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number(),
                descricao: Yup.string(),
                status: Yup.number(),
                idopera_ultacao: Yup.number(),
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const esptabExists = await Drive.findByPk(req.body.id).catch(
                err => {
                    return res.status(400).json({ error: err.message });
                }
            );

            if (!esptabExists) {
                return res.status(400).json({ error: 'Drive não encontrado!' });
            }

            await Drive.update(req.body, {
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
            const { Drive } = Database.getModels(req.database);
            await Drive.destroy({
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

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Drive"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Drive"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'sigla':
                if (filterValue !== null) {
                    filter += ` CAST("Drive"."sigla" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'final':
                if (filterValue !== null) {
                    filter += ` CAST("Drive"."final" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'motina.descricao':
                if (filterValue !== 'todos') {
                    filter += ` CAST("motina"."id" AS TEXT) = '${filterValue}'`;
                }
                break;
            case 'char_resul':
                filter = ` "Drive"."char_resul" = ${parseInt(
                    filterValue,
                    10
                )} `;
                break;
            default:
                // eslint-disable-next-line no-unused-expressions
                filter !== ''
                    ? (filter = ` (Unaccent(upper(trim(coalesce("Drive"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new DriveController();
