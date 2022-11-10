import Database from '../../../database';
import Sacado from '../../models/financial/Sacado';
import Saccontra from '../../models/financial/Saccontra';
import Receber from '../../models/financial/Receber';
import Paramf from '../../models/financial/Paramf';

class ReceberController {
    async index(req, res) {
        try {
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
            let where = ` "Receber"."status" = 'AB' and nn notnull or "Receber"."status" = 'FC'`;
            if (req.query.search && req.query.search.length > 0) {
                where = ` (Unaccent(upper(trim(coalesce("Sacado"."razao",'')))) ILIKE Unaccent('%${search.toUpperCase()}%')) or (CAST("Sacado"."id" AS TEXT) LIKE '%${search.toUpperCase()}%')`;
            } else {
                switch (filter) {
                    case 'codigo':
                        where = ` CAST("Receber"."id" AS TEXT) LIKE '%${filtervalue.toUpperCase()}%'`;
                        break;
                    default:
                        filter !== '' && filter !== undefined
                            ? (where = ` (Unaccent(upper(trim(coalesce("Receber"."${filter}",'')))) ILIKE Unaccent('%${filtervalue.toUpperCase()}%'))`)
                            : null;
                }
            }

            const receber = await Receber.findAll({
                order: Receber.sequelize.literal(`${order} ${orderdesc}`),
                where: Receber.sequelize.literal(where),
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'vencimento',
                    'datpag',
                    'totpago',
                    [`trim(coalesce("Receber"."numerodoc",''))`, 'numerodoc'],
                    [`trim(coalesce("Receber"."parcela",''))`, 'parcela'],
                    'status',
                    [`trim(coalesce("Receber"."obs",''))`, 'obs'],
                    [Receber.sequelize.literal('count(*) OVER ()'), 'total'],
                    'remessa',
                    'nn',
                    'enotas_status_nfse',
                    'status',
                    'status_nexxera',
                    'linha_digitavel',
                ],
                include: [
                    {
                        model: Sacado,
                        as: 'sacado',
                        attributes: ['fantasia','razao','email','cgc_cpf'],
                        where: { id: req.query.labcode },
                    },
                ],
                limit,
                offset: (page - 1) * limit,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(receber);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const receber = await Receber.findOne({
                where: { id: req.params.id },
                attributes: [
                    'id',
                    ['id', 'codigo'],
                    'vencimento',
                    'datpag',
                    [`trim(coalesce("Receber"."obs",''))`, 'obs'],
                    [`trim(coalesce("Receber"."numerodoc",''))`, 'numerodoc'],
                    'totpago',
                    [`trim(coalesce("Receber"."parcela",''))`, 'parcela'],
                    'status',
                    [`trim(coalesce("Receber"."nn",''))`, 'nn'],
                    'enotas_status_nfse',
                    'verif',
                    'nne',
                    'valor',
                    'totjuros',
                    'totdesc',
                    'status_nexxera',
                    'linha_digitavel',
                    'remessa',
                    'nn',
                ],
                include: [
                    {
                        model: Sacado,
                        as: 'sacado',
                        attributes: [['id','sacado_id'],'fantasia','razao','email','cgc_cpf'],
                    },
                ],
            });
            if (receber) {
                return res.status(200).json(receber);
            }
            return res
                .status(400)
                .json({ error: 'Conta a receber nao encontrada.' });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async index3(req, res) {
    try {
      const produtos = await Saccontra.findAll({
        where: { sacado_id: req.params.id, tafec: 1 },
        attributes: [[`SUM(TERMINAIS)`, 'terminais'], 'sistema'],
        group: ['sistema']
      });
      if (produtos) {
        return res.status(200).json(produtos);
      }
      return res.status(400).json({ error: 'Produto nao encontrado.' });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

    async nfse_consultar(req, res) {
    try {
      const fetch = require('node-fetch');
      // Trazer dados dos parametros
      const parametros = await Paramf.findOne({
        where: { id: 1 },
        attributes: [
          [`trim(coalesce(razao,''))`, 'razao'],
          [`trim(coalesce(cnpj,''))`, 'cnpj'],
          'nexxera_key',
          [`trim(coalesce(enotas_apikey,''))`, 'enotas_apikey'],
          [`trim(coalesce(enotas_idempresa,''))`, 'enotas_idempresa'],
          [`trim(coalesce(im,''))`, 'im'],
          [`trim(coalesce(codserv,''))`, 'codserv']
        ]
      });

      const header = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${parametros.enotas_apikey}`,
        Accept: 'application/json'
      };

      const url_consulta_nfse_pdf = `https://api.enotasgw.com.br/v1/empresas/${
        parametros.enotas_idempresa
      }/nfes/porIdExterno/${req.query.codigo.toString()}`;

      const response = await fetch(url_consulta_nfse_pdf, {
        method: 'GET',
        headers: header
      });
      const data = await response.json();

      if (data) {
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: 'NFS-e nao encontrada.' });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    }

    async boleto_consultar(req, res) {
    try {
      const fetch = require('node-fetch');
      // Trazer dados dos parametros
      const parametros = await Paramf.findOne({
        where: { id: 1 },
        attributes: [
          [`trim(coalesce(razao,''))`, 'razao'],
          [`trim(coalesce(cnpj,''))`, 'cnpj'],
          'nexxera_key',
          [`trim(coalesce(nexxera_hash,''))`, 'nexxera_hash'],
          [`trim(coalesce(url_teste_nexxera,''))`, 'url_teste_nexxera'],
          [
            `trim(coalesce(url_homologacao_nexxera,''))`,
            'url_homologacao_nexxera'
          ],
          [`trim(coalesce(url_producao_nexxera,''))`, 'url_producao_nexxera'],
          [`trim(coalesce(ambiente,''))`, 'ambiente']
        ]
      });

      const url_nexxera =
        parametros.ambiente === '1'
          ? parametros.url_teste_nexxera
          : parametros.ambiente === '2'
          ? parametros.url_homologacao_nexxera
          : parametros.url_producao_nexxera;

      const new_nn = req.query.nn.trim().substr(0, 8);

      const url_consulta_boleto_pdf = `${url_nexxera}?key=${parametros.nexxera_key}&hash=${parametros.nexxera_hash}&our_number=${new_nn}`;

      let data = null;

      let tipo_boleto = '';
      if (req.query.status_conta === 'FC') {
        tipo_boleto = 'PAGO';
      } else if (new Date(req.query.vencimento) < new Date()) {
        tipo_boleto = 'VENCIDO';
      } else {
        tipo_boleto = 'A VENCER';
      }

      // Verifica se o parametro esta null em string
      if (req.query.link_nfse === 'null') {
        req.query.link_nfse = null;
      }

      if (req.query.linha_digitavel === 'null') {
        req.query.linha_digitavel = null;
      }
      /// ///

      if (req.query.linha_digitavel && tipo_boleto !== 'PAGO') {
        const response = await fetch(url_consulta_boleto_pdf, {
          method: 'GET'
        });
        data = await response.json();
      } else if (req.query.linha_digitavel === null) {
        data = { status: 'Boleto enviado com sucesso' };
      }

      if (data) {
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: 'Boleto nao encontrado.' });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    }
}

export default new ReceberController();
