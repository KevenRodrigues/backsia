import Database from '../../database';

class ProdutoController {
    async index(req, res) {
        try {
            const { Produto, Motina } = Database.getModels(req.database);
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
                where = ` (Unaccent(upper(trim(coalesce("Produto"."descricao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Produto"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                switch (filter) {
                    case 'motina.descricao':
                        where = ` (Unaccent(upper(trim(coalesce("motina"."descricao",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`;
                        break;
                    case 'id':
                        where = ` CAST("Produto"."id" AS TEXT) LIKE '%${filtervalue.toUpperCase()}%'`;
                        break;
                    default:
                        filter !== ''
                            ? (where = ` (Unaccent(upper(trim(coalesce("Produto"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`)
                            : null;
                }
            }
            
            const produtos = await Produto.findAll({
                order: Produto.sequelize.literal(`${order} ${orderdesc}`),
                where: Produto.sequelize.literal(where),
                attributes: [
                    'id',
                    'descricao',
                    'status',
                    'idopera_ultacao',
                    [Produto.sequelize.literal('count(*) OVER ()'), 'total'],
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
                const produtos_trim = produtos.map(produto => {
                    produto.descricao = produto.descricao
                        ? produto.descricao.trim()
                        : '';
                    produto.motina.descricao =
                        produto.motina === null
                            ? ''
                            : produto.motina.descricao.trim();
                    return produto;
                });
                return res.status(200).json(produtos_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new ProdutoController();
