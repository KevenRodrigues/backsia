import Database from '../../database';

class RepresentanteController {
    async index(req, res) {
        try {
            const { Repre, Motina } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order =
                req.query.sortby !== '' && req.query.sortby !== undefined
                    ? req.query.sortby
                    : 'id';

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
                where += ` (Unaccent(upper(trim(coalesce("Repre"."nome",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Repre"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                switch (filter) {
                    default:
                        filter !== '' && filter !== undefined
                            ? (where = ` (Unaccent(upper(trim(coalesce("Ccusto"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`)
                            : null;
                }
            }

            const response = await Repre.findAll({
                attributes: [
                    'id',
                    'nome',
                    'status',
                    'perc',
                    'tiporepre',
                    'banco',
                    'agencia',
                    'corrente',
                    'ret465',
                    'retrepre465',
                    'ret150',
                    'retrepre150',
                    'cgc_cpf',
                    'tipoded',
                    'percded',
                    'for_id',
                    'ban_id',
                    'cen_id',
                    'pl_id',
                    'desccontas',
                    'idopera_ultacao',
                    [Repre.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    // {
                    //     model: Motina,
                    //     as: 'motina',
                    //     attributes: ['id', 'descricao'],
                    // },
                ],
                where: Repre.sequelize.literal(where),
                order: Repre.sequelize.literal(`${order} ${orderdesc}`),
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(response);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new RepresentanteController();
