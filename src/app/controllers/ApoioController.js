import { QueryTypes } from 'sequelize';
import * as Yup from 'yup';
import Database from '../../database';

class ApoioController {
    async index(req, res) {
        try {
            const { Apoio, Motina } = Database.getModels(req.database);

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
                where = ` (Unaccent(upper(trim(coalesce("Apoio"."razao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Apoio"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += ApoioController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = ApoioController.handleFilters(filter, filtervalue);
                }
            }

            const apoios = await Apoio.findAll({
                order: Apoio.sequelize.literal(`${order} ${orderdesc}`),
                where: Apoio.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'razao',
                    'status',
                    'idopera_ultacao',
                    [Apoio.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const apoios_trim = apoios.map(apoio => {
                apoio.razao = apoio.razao && apoio.razao.trim();
                apoio.motina.descricao = apoio.motina.descricao.trim();
                return apoio;
            });

            return res.status(200).json(apoios_trim);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Apoio,
                Apoioexa,
                Exame,
                Motina,
                Layout,
                Apoiopos,
                Posto,
            } = Database.getModels(req.database);
            const apoio = await Apoio.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    'razao',
                    'endereco',
                    'bairro',
                    'cidade',
                    'cep',
                    'uf',
                    'fone',
                    'fax',
                    'email',
                    'codlab',
                    'obs',
                    'arqrotina',
                    'arqrotinaweb',
                    'pathapo',
                    'senhalab',
                    'ws_lote',
                    'ws_endweb',
                    'ws_senha',
                    'ws_idagente',
                    'ws_versao',
                    'amostra_envio',
                    'amostra_retorno',
                    'layout_ws',
                    'import_param_xml',
                    'dadosconst',
                    'graficos',
                    'unicomvalor',
                    'ws_resultado',
                    'termo_cons_apoio',
                    'status',
                    'idopera_ultacao',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['id', 'descricao'],
                    },
                    {
                        model: Apoioexa,
                        as: 'apoioexa',
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
                                attributes: ['codigo', 'descricao'],
                            },
                            {
                                model: Layout,
                                as: 'layout',
                                attributes: ['id', 'descricao'],
                            },
                        ],
                    },
                    {
                        model: Apoiopos,
                        order: ['id', 'DESC'],
                        as: 'apoiopos',
                        attributes: [
                            'id',
                            'apoio_id',
                            'posto_id',
                            'codlab',
                            'senhalab',
                            'idopera_ultacao',
                        ],
                        include: [
                            {
                                model: Posto,
                                as: 'Posto',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                ],
                order: [
                    [
                        { model: Apoioexa, as: 'apoioexa' },
                        { model: Exame, as: 'exame' },
                        'descricao',
                        'ASC',
                    ],
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!apoio) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }

            apoio.razao = apoio.razao ? apoio.razao.trim() : '';
            apoio.endereco = apoio.endereco ? apoio.endereco.trim() : '';
            apoio.bairro = apoio.bairro ? apoio.bairro.trim() : '';
            apoio.cidade = apoio.cidade ? apoio.cidade.trim() : '';
            apoio.cep = apoio.cep ? apoio.cep.trim() : '';
            apoio.uf = apoio.uf ? apoio.uf.trim() : '';
            apoio.fone = apoio.fone ? apoio.fone.trim() : '';
            apoio.fax = apoio.fax ? apoio.fax.trim() : '';
            apoio.email = apoio.email ? apoio.email.trim() : '';
            apoio.codlab = apoio.codlab ? apoio.codlab.trim() : '';
            apoio.obs = apoio.obs ? apoio.obs.trim() : '';
            apoio.arqrotina = apoio.arqrotina ? apoio.arqrotina.trim() : '';
            apoio.pathapo = apoio.pathapo ? apoio.pathapo.trim() : '';
            apoio.senhalab = apoio.senhalab ? apoio.senhalab.trim() : '';
            apoio.ws_senha = apoio.ws_senha ? apoio.ws_senha.trim() : '';
            apoio.ws_idagente = apoio.ws_idagente
                ? apoio.ws_idagente.trim()
                : '';
            apoio.ws_versao = apoio.ws_versao ? apoio.ws_versao.trim() : '';
            apoio.amostra_envio = apoio.amostra_envio
                ? apoio.amostra_envio.trim()
                : '';
            apoio.amostra_retorno = apoio.amostra_retorno
                ? apoio.amostra_retorno.trim()
                : '';
            apoio.ws_endweb = apoio.ws_endweb ? apoio.ws_endweb.trim() : '';
            apoio.ws_endweb = apoio.ws_endweb ? apoio.ws_endweb.trim() : '';

            apoio.apoioexa.map(apoioexa => {
                if (apoioexa.exame) {
                    apoioexa.exame.codigo = apoioexa.exame.codigo.trim();
                    apoioexa.exame.descricao = apoioexa.exame.descricao.trim();
                }
                return apoioexa;
            });
            return res.status(200).json(apoio);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createUpdate(req, res) {
        try {
            const { Apoio } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                razao: Yup.string()
                    .transform(v => (v === null ? '' : v))
                    .required('Campo razao obrigatorio'),
            });

            await schema
                .validate(req.body, { abortEarly: false })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            // EDIT
            if (req.body.id) {
                const apoio = await Apoio.findByPk(req.body.id);

                if (!apoio) {
                    return res.status(400).json({
                        error: `Nenhum registro encontrado com este id ${req.body.id}`,
                    });
                }

                await Apoio.update(req.body, {
                    where: { id: req.body.id },
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                // Finally update apoio
                const { razao, status } = req.body;
                return res.status(200).json({
                    razao,
                    status,
                });
            }

            // CREATE
            const {
                id,
                razao,
                status,
                apoioexa,
                apoiopos,
            } = await Apoio.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                razao,
                status,
                apoioexa,
                apoiopos,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { Apoio } = Database.getModels(req.database);
            await Apoio.destroy({
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
        return true;
    }

    async webservice(req, res) {
        try {
            const { Apoio } = Database.getModels(req.database);

            const wslote = await Apoio.sequelize
                .query(
                    `
                    SELECT ID, WS_LOTE FROM APOIO
                    WHERE ID = ${req.params.id}
                `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            if (wslote[0].ws_lote === '1') {
                return res.status(200).json(true);
            }
            return res.status(200).json(false);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'codigo':
                filter = ` CAST("Apoio"."id" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'descricao':
                if (filterValue !== null) {
                    filter += ` CAST("Apoio"."descricao" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Apoio"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new ApoioController();
