import * as Yup from 'yup';
import aws from 'aws-sdk';

import { QueryTypes, Op } from 'sequelize';
import { format, sub } from 'date-fns';

import AuthPermission from '../models/sialabpac/Authpermission';
import Database from '../../database';
import {
    calculaIdade,
    gerarRelatorioHtml,
    PegaData,
} from './functions/functions';
import { format, sub, parseISO } from 'date-fns';
import { QueryTypes, Op, col } from 'sequelize';
const s3 = new aws.S3();

class ProntuarioController {
    async index(req, res) {
        try {
            const {
                Prontuario,
                Motina,
                Posto,
                Envio,
                Convenio,
                Plano,
                Cid,
                Operador,
                Medico,
                Entrega,
            } = Database.getModels(req.database);
            const { page = 1, limit = 10 } = req.query;

            const order = req.query.sortby !== '' ? req.query.sortby : 'id';
            const orderdesc = req.query.sortbydesc === 'true' ? 'ASC' : 'DESC';
            const filter = req.query.filterid !== '' ? req.query.filterid : '';
            const filtervalue =
                req.query.filtervalue !== '' ? req.query.filtervalue : '';
            // Verificacao se usuario possui postos permitidos para filtros apenas eles
            const postoperm =
                req.query.postoperm !== '' ? req.query.postoperm : '';

            const search =
                req.query.search && req.query.search.length > 0
                    ? req.query.search
                    : '';
            let where = '';
            if (req.query.search && req.query.search.length > 0) {
                if (postoperm !== '') {
                    where +=
                        where === ''
                            ? ` ("Prontuario"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("Prontuario"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                } else {
                    
                    let where_data_nasc = '';
                    let where_cpf = '';

                    //WHERE POSTO+PRONTUARIO NÃO ESTÁ SENDO UTILIZADO POR ENQUANTO
                    // var where_posto_prontuario =
                    //     " or CONCAT(posto, prontuario) like '%" + search + "%'";

                    //VERIFICANDO SE O USUÁRIO DIGITOU UMA DATA PARA PESQUISA
                    if (
                        search.toUpperCase().split('/').length - 1 == 2 &&
                        search.toUpperCase().length == 10 &&
                        new Date(search.toUpperCase()).valueOf() != NaN
                    ) {
                        where_data_nasc =
                        ` or "Prontuario"."data_nasc" = '${search}'`;
                    }

                    //VERIFICANDO SE O USUÁRIO DIGITOU UM CPF PARA PESQUISA
                    if (search.replace(/\D/g, '') != '') {
                        where_cpf = ` or regexp_replace("Prontuario"."cpf", '\\D', '', 'g') ILIKE Unaccent('%${search.replace(
                            /\D/g,
                            ''
                        )}%')`;
                    }

                    where =
                        ` (Unaccent(upper(trim(coalesce("Prontuario"."nome",'')))) ILIKE Unaccent('%${search.toUpperCase()}%'))` +
                        where_cpf +
                        where_data_nasc;
                }
            } else {
                const filters = req.query.filters
                    ? JSON.parse(req.query.filters)
                    : [];

                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i += 1) {
                        if (i > 0 && filters[i].value !== 'todos' && where)
                            where += ' AND ';

                        where += ProntuarioController.handleFilters(
                            filters[i].id,
                            filters[i].value
                        );
                    }
                } else {
                    where = ProntuarioController.handleFilters(
                        filter,
                        filtervalue
                    );
                }

                if (postoperm !== '') {
                    where +=
                        where === ''
                            ? ` ("Prontuario"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`
                            : ` and ("Prontuario"."posto" in ('${postoperm.replace(
                                  /,/gi,
                                  "','"
                              )}'))`;
                }
            }

            const prontuarios = await Prontuario.findAll({
                order: Prontuario.sequelize.literal(`${order} ${orderdesc}`),
                where: Prontuario.sequelize.literal(where),
                attributes: [
                    'id',
                    'envio_id',
                    'entrega_id',
                    'medico_id',
                    'convenio_id',
                    'plano_id',
                    'operador_id',
                    'posto',
                    'prontuario',
                    'nome',
                    'sexo',
                    'obs',
                    'data_nasc',
                    'rg',
                    'endereco',
                    'cidade',
                    'uf',
                    'cep',
                    'bairro',
                    'cor',
                    'gruposang',
                    'fatorrh',
                    'matric',
                    'ddd1',
                    'ddd2',
                    'fone1',
                    'fone2',
                    'email',
                    'qtd',
                    'cpf',
                    'estadocivi',
                    'valplano',
                    'status',
                    'idopera_ultacao',
                    'empresa',
                    'fotopac_url',
                    'fotopac_key',
                    'nome_pai',
                    'nome_mae',
                    'bpaibge',
                    'titular',
                    'cns',
                    'cid_id',
                    'numero',
                    'compl',
                    'rn',
                    'senhawebpro',
                    'rg_dtexp',
                    'nis_pis',
                    'nome_social',
                    'tipoident',
                    'identificadorbenef',
                    'templatebiometrico',
                    'siaweb',
                    'profissao',
                    //  'du',
                    //  'usuario',
                    //	'peso',
                    //	'altura',

                    //	'tipodoc',
                    //	'documento',
                    //	'estcivil',
                    //	'nfilhos',
                    //	'controle',
                    //  'obspro'
                    //	'cod'
                    //	'fumante',
                    //	'ddd1',
                    //	'ddd2',
                    //	'gestacao',
                    //	'duracao',
                    //	'parto',
                    //	'apgar_1',
                    //	'apgar_5',
                    //	'apgar_10',
                    //	'peso_nasc',
                    //	'altura_nasc',
                    //	'pc',
                    //	'pt',
                    //	'peso_sair',
                    //	'obs_nasc',
                    //	'diasates',
                    //	'laudoinss',
                    //	'senha',
                    //	'horachegada',
                    //	'horasaida',
                    [
                        Prontuario.sequelize.literal(
                            `(SELECT reltuples::bigint FROM pg_catalog.pg_class WHERE relname = 'prontuario')`
                        ),
                        'total',
                    ],
                ],
                limit,
                offset: (page - 1) * limit,
                include: [
                    { model: Motina, as: 'motina', attributes: ['descricao'] },
                    {
                        model: Convenio,
                        as: 'convenio',
                        attributes: ['fantasia'],
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                        attributes: ['descricao'],
                    },
                    { model: Envio, as: 'envio', attributes: ['descricao'] },
                    { model: Operador, as: 'operador', attributes: ['nome'] },
                    {
                        model: Medico,
                        as: 'medico',
                        attributes: ['nome_med', 'crm'],
                    },
                    { model: Cid, as: 'cid', attributes: ['descricao'] },
                    { model: Plano, as: 'plano', attributes: ['descricao'] },
                    { model: Posto, attributes: ['descricao'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            try {
                const prontuarios_trim = prontuarios.map(prontuario => {
                    prontuario.posto = prontuario.posto
                        ? prontuario.posto.trim()
                        : '';
                    prontuario.prontuario = prontuario.prontuario
                        ? prontuario.prontuario.trim()
                        : '';
                    prontuario.nome = prontuario.nome
                        ? prontuario.nome.trim()
                        : '';
                    prontuario.sexo = prontuario.sexo
                        ? prontuario.sexo.trim()
                        : '';
                    prontuario.obs = prontuario.obs
                        ? prontuario.obs.trim()
                        : '';
                    //   prontuario.data_nasc =prontuario.data_nasc? prontuario.data_nasc.trim():'';
                    prontuario.rg = prontuario.rg ? prontuario.rg.trim() : '';
                    prontuario.endereco = prontuario.endereco
                        ? prontuario.endereco.trim()
                        : '';
                    prontuario.cidade = prontuario.cidade
                        ? prontuario.cidade.trim()
                        : '';
                    prontuario.uf = prontuario.uf ? prontuario.uf.trim() : '';
                    prontuario.cep = prontuario.cep
                        ? prontuario.cep.trim()
                        : '';
                    prontuario.bairro = prontuario.bairro
                        ? prontuario.bairro.trim()
                        : '';
                    prontuario.cor = prontuario.cor
                        ? prontuario.cor.trim()
                        : '';
                    prontuario.gruposang = prontuario.gruposang
                        ? prontuario.gruposang.trim()
                        : '';
                    prontuario.fatorrh = prontuario.fatorrh
                        ? prontuario.fatorrh.trim()
                        : '';
                    prontuario.matric = prontuario.matric
                        ? prontuario.matric.trim()
                        : '';
                    prontuario.ddd1 = prontuario.ddd1
                        ? prontuario.ddd1.trim()
                        : '';
                    prontuario.ddd2 = prontuario.ddd2
                        ? prontuario.ddd2.trim()
                        : '';
                    prontuario.fone1 = prontuario.fone1
                        ? prontuario.fone1.trim()
                        : '';
                    prontuario.fone2 = prontuario.fone2
                        ? prontuario.fone2.trim()
                        : '';
                    prontuario.email = prontuario.email
                        ? prontuario.email.trim()
                        : '';
                    prontuario.qtd = prontuario.qtd ? prontuario.qtd : 0;
                    prontuario.estcivi = prontuario.estcivi
                        ? prontuario.estcivi.trim()
                        : '';
                    prontuario.cpf = prontuario.cpf
                        ? prontuario.cpf.trim()
                        : '';
                    prontuario.estadocivi = prontuario.estadocivi
                        ? prontuario.estadocivi.trim()
                        : '';
                    // prontuario.valplano =prontuario.valplano? prontuario.valplano.trim():'';
                    prontuario.empresa = prontuario.empresa
                        ? prontuario.empresa.trim()
                        : '';
                    prontuario.fotopac_url = prontuario.fotopac_url
                        ? prontuario.fotopac_url.trim()
                        : '';
                    prontuario.fotopac_key = prontuario.fotopac_key
                        ? prontuario.fotopac_key.trim()
                        : '';
                    prontuario.nome_pai = prontuario.nome_pai
                        ? prontuario.nome_pai.trim()
                        : '';
                    prontuario.nome_mae = prontuario.nome_mae
                        ? prontuario.nome_mae.trim()
                        : '';
                    prontuario.bpaibge = prontuario.bpaibge
                        ? prontuario.bpaibge.trim()
                        : '';
                    prontuario.titular = prontuario.titular
                        ? prontuario.titular.trim()
                        : '';
                    prontuario.cns = prontuario.cns
                        ? prontuario.cns.trim()
                        : '';
                    prontuario.compl = prontuario.compl
                        ? prontuario.compl.trim()
                        : '';
                    prontuario.rn = prontuario.rn ? prontuario.rn.trim() : '';
                    prontuario.senhawebpro = prontuario.senhawebpro
                        ? prontuario.senhawebpro.trim()
                        : '';
                    //    prontuario.rg_dtexp =prontuario.rg_dtexp? prontuario.rg_dtexp.trim():'';
                    prontuario.numero = prontuario.numero
                        ? prontuario.numero.trim()
                        : '';
                    prontuario.nis_pis = prontuario.nis_pis
                        ? prontuario.nis_pis.trim()
                        : '';
                    prontuario.nome_social = prontuario.nome_social
                        ? prontuario.nome_social.trim()
                        : '';
                    prontuario.tipoident = prontuario.tipoident
                        ? prontuario.tipoident.trim()
                        : '';
                    prontuario.identificadorbenef = prontuario.identificadorbenef
                        ? prontuario.identificadorbenef.trim()
                        : '';
                    prontuario.templatebiometrico = prontuario.templatebiometrico
                        ? prontuario.templatebiometrico.trim()
                        : '';
                    prontuario.profissao = prontuario.profissao
                        ? prontuario.profissao.trim()
                        : '';

                    if (prontuario.envio_id) {
                        prontuario.envio.descricao = prontuario.envio.descricao
                            ? prontuario.envio.descricao.trim()
                            : '';
                    }
                    if (prontuario.entrega_id) {
                        prontuario.entrega.descricao = prontuario.entrega
                            .descricao
                            ? prontuario.entrega.descricao.trim()
                            : '';
                    }
                    if (prontuario.status >= 0) {
                        prontuario.motina.descricao = prontuario.motina
                            .descricao
                            ? prontuario.motina.descricao.trim()
                            : '';
                    }
                    if (prontuario.convenio_id) {
                        prontuario.convenio.fantasia = prontuario.convenio
                            .fantasia
                            ? prontuario.convenio.fantasia.trim()
                            : '';
                    }
                    if (prontuario.plano_id) {
                        prontuario.plano.descricao = prontuario.plano.descricao
                            ? prontuario.plano.descricao.trim()
                            : '';
                    }
                    if (prontuario.medico_id) {
                        prontuario.medico.nome_med = prontuario.medico.nome_med
                            ? prontuario.medico.nome_med.trim()
                            : '';
                    }
                    if (prontuario.cid_id) {
                        prontuario.cid.descricao = prontuario.cid.descricao
                            ? prontuario.cid.descricao.trim()
                            : '';
                    }
                    if (prontuario.operador_id) {
                        prontuario.operador.nome = prontuario.operador.nome
                            ? prontuario.operador.nome.trim()
                            : '';
                    }
                    // if (prontuario.posto) {
                    //     prontuario.Posto.descricao = prontuario.Posto.descricao
                    //         ? prontuario.Posto.descricao.trim()
                    //         : '';
                    // }
                    if (prontuario.posto) {
                        if (prontuario.Posto) {
                            prontuario.Posto.descricao = prontuario.Posto.descricao.trim();
                        } else {
                            prontuario.Posto = null;
                        }
                    }
                    // prontuario.usuario =prontuario.usuario? prontuario.usuario.trim():'';
                    // prontuario.peso =prontuario.peso? prontuario.peso:0;
                    // prontuario.altura =prontuario.altura? prontuario.altura:0;
                    // prontuario.tipodoc =prontuario.tipodoc? prontuario.tipodoc.trim():'';
                    // prontuario.documento =prontuario.documento? prontuario.documento.trim():'';
                    // prontuario.nfilhos =prontuario.nfilhos? prontuario.nfilhos.trim():'';
                    // prontuario.controle =prontuario.controle? prontuario.controle:0;
                    // prontuario.obspro =prontuario.obspro? prontuario.obspro.trim():'';
                    // prontuario.cod =prontuario.cod? prontuario.cod.trim():'';
                    // prontuario.fumante =prontuario.fumante? prontuario.fumante.trim():'';
                    // prontuario.ddd1 =prontuario.ddd1? prontuario.ddd1.trim():'';
                    //  prontuario.ddd2 =prontuario.ddd2? prontuario.ddd2.trim():'';
                    // prontuario.gestacacao =prontuario.gestacacao? prontuario.gestacacao.trim():'';
                    // prontuario.duracao =prontuario.duracao? prontuario.duracao.trim():'';
                    // prontuario.parto =prontuario.parto? prontuario.parto.trim():'';
                    // prontuario.apgar_1 =prontuario.apgar_1? prontuario.apgar_1.trim():'';
                    // prontuario.apgar_5 =prontuario.apgar_5? prontuario.apgar_5.trim():'';
                    // prontuario.apgar_10 =prontuario.apgar_10? prontuario.apgar_10.trim():'';
                    // prontuario.peso_nasc =prontuario.peso_nasc? prontuario.peso_nasc.trim():'';
                    // prontuario.altura_nasc =prontuario.altura_nasc? prontuario.altura_nasc.trim():'';
                    // prontuario.pc =prontuario.pc? prontuario.pc.trim():'';
                    // prontuario.pt =prontuario.pt? prontuario.pt.trim():'';
                    // prontuario.peso_sair =prontuario.peso_sair? prontuario.peso_sair.trim():'';
                    // prontuario.obs_nasc =prontuario.obs_nasc? prontuario.obs_nasc.trim():'';
                    // prontuario.senha =prontuario.senha? prontuario.senha.trim():'';
                    // prontuario.horachegada =prontuario.horachegada? prontuario.horachegada.trim():'';
                    // prontuario.horasaida =prontuario.horasaida? prontuario.horasaida.trim():'';
                    // prontuario.du =prontuario.du? prontuario.du.trim():'';

                    return prontuario;
                });

                return res.status(200).json(prontuarios_trim);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOne(req, res) {
        try {
            const {
                Prontuario,
                Motina,
                Posto,
                Envio,
                Convenio,
                Plano,
                Cid,
                Operador,
                Medico,
                Entrega,
            } = Database.getModels(req.database);
            if (req.params.id === '0') {
                const { cpf } = req.query;
                const prontu = await Prontuario.findOne({
                    where: Prontuario.sequelize.literal(
                        `translate(cpf, './-', '') = '${cpf ? cpf.trim() : 0}'`
                    ),
                    attributes: ['id', 'prontuario', 'senhawebpro'],
                }).catch(err => {
                    return res.status(400).json({ error: err.message });
                });

                if (!prontu) {
                    // / Criar o prontuario
                    const novadata = req.query.data_nasc.split('/');
                    req.query.data_nasc = `${novadata[2]}-${novadata[1]}-${novadata[0]}`;
                    await Prontuario.create({
                        siaweb: 1,
                        idopera_ultacao: req.userId,
                        cpf: req.query.cpf,
                        data_nasc: req.query.data_nasc,
                        email: req.query.email,
                        nome: req.query.nome.toUpperCase(),
                        sexo: req.query.sexo.substring(0, 1).toUpperCase(),
                        posto: req.query.posto,
                        prontuario: '',
                    })
                        .then(async prontuarionew => {
                            req.params.id = prontuarionew.id;
                            await AuthPermission.update(
                                {
                                    prontuarioid: prontuarionew.id,
                                    prontuario: prontuarionew.prontuario,
                                    senhawebpro: prontuarionew.senhawebpro,
                                },
                                {
                                    where: {
                                        user_id: req.query.user_id,
                                        cliente_id: req.query.labcode,
                                    },
                                }
                            ).catch(err => {
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            });
                        })
                        .catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                } else {
                    req.params.id = prontu.id;
                    await AuthPermission.update(
                        {
                            prontuarioid: prontu.id,
                            prontuario: prontu.prontuario,
                            senhawebpro: prontu.senhawebpro,
                        },
                        {
                            where: {
                                user_id: req.query.user_id,
                                cliente_id: req.query.labcode,
                            },
                        }
                    ).catch(err => {
                        return res.status(400).json({ error: err.message });
                    });
                }
            }

            const prontuarios = await Prontuario.findByPk(req.params.id, {
                attributes: [
                    'id',
                    'envio_id',
                    'entrega_id',
                    'medico_id',
                    'convenio_id',
                    'plano_id',
                    'operador_id',
                    'posto',
                    'prontuario',
                    'nome',
                    'sexo',
                    'obs',
                    'data_nasc',
                    'rg',
                    'endereco',
                    'cidade',
                    'uf',
                    'cep',
                    'bairro',
                    'cor',
                    'gruposang',
                    'fatorrh',
                    'matric',
                    'ddd1',
                    'ddd2',
                    'fone1',
                    'fone2',
                    'email',
                    'qtd',
                    'cpf',
                    'estadocivi',
                    'valplano',
                    'status',
                    'idopera_ultacao',
                    'empresa',
                    'fotopac_url',
                    'fotopac_key',
                    'nome_pai',
                    'nome_mae',
                    'bpaibge',
                    'titular',
                    'cns',
                    'cid_id',
                    'numero',
                    'compl',
                    'rn',
                    'senhawebpro',
                    'rg_dtexp',
                    'nis_pis',
                    'nome_social',
                    'tipoident',
                    'identificadorbenef',
                    'templatebiometrico',
                    'siaweb',
                    'profissao',

                    //  'du',
                    //  'usuario',
                    //	'peso',
                    //	'altura',

                    //	'tipodoc',
                    //	'documento',
                    //	'estcivil',
                    //	'nfilhos',
                    //	'controle',
                    //  'obspro'
                    //	'cod'
                    //	'fumante',
                    //	'ddd1',
                    //	'ddd2',
                    //	'gestacao',
                    //	'duracao',
                    //	'parto',
                    //	'apgar_1',
                    //	'apgar_5',
                    //	'apgar_10',
                    //	'peso_nasc',
                    //	'altura_nasc',
                    //	'pc',
                    //	'pt',
                    //	'peso_sair',
                    //	'obs_nasc',
                    //	'diasates',
                    //	'laudoinss',
                    //	'senha',
                    //	'horachegada',
                    //	'horasaida',
                ],
                include: [
                    {
                        model: Motina,
                        as: 'motina',
                        attributes: ['descricao', 'id'],
                    },
                    {
                        model: Convenio,
                        as: 'convenio',
                        attributes: ['fantasia', 'codigo', 'id'],
                    },
                    {
                        model: Entrega,
                        as: 'entrega',
                        attributes: ['descricao', 'codigo', 'id'],
                    },
                    {
                        model: Envio,
                        as: 'envio',
                        attributes: ['descricao', 'codigo', 'id'],
                    },
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome', 'id'],
                    },
                    {
                        model: Medico,
                        as: 'medico',
                        attributes: ['nome_med', 'crm', 'id'],
                        include: [
                            {
                                model: Motina,
                                as: 'motina',
                                attributes: ['descricao', 'id'],
                            },
                        ],
                    },
                    {
                        model: Cid,
                        as: 'cid',
                        attributes: ['descricao', 'codigo', 'id'],
                    },
                    {
                        model: Plano,
                        as: 'plano',
                        attributes: ['descricao', 'codigo', 'id'],
                    },
                    { model: Posto, attributes: ['descricao', 'codigo', 'id'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!prontuarios) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            try {
                prontuarios.posto = prontuarios.posto
                    ? prontuarios.posto.trim()
                    : '';
                prontuarios.prontuarios = prontuarios.prontuarios
                    ? prontuarios.prontuarios.trim()
                    : '';
                prontuarios.nome = prontuarios.nome
                    ? prontuarios.nome.trim()
                    : '';
                prontuarios.sexo = prontuarios.sexo
                    ? prontuarios.sexo.trim()
                    : '';
                prontuarios.obs = prontuarios.obs ? prontuarios.obs.trim() : '';
                //  prontuarios.data_nasc =prontuarios.data_nasc? prontuarios.data_nasc.trim():'';
                prontuarios.rg = prontuarios.rg ? prontuarios.rg.trim() : '';
                prontuarios.endereco = prontuarios.endereco
                    ? prontuarios.endereco.trim()
                    : '';
                prontuarios.cidade = prontuarios.cidade
                    ? prontuarios.cidade.trim()
                    : '';
                prontuarios.uf = prontuarios.uf ? prontuarios.uf.trim() : '';
                prontuarios.cep = prontuarios.cep ? prontuarios.cep.trim() : '';
                prontuarios.bairro = prontuarios.bairro
                    ? prontuarios.bairro.trim()
                    : '';
                prontuarios.cor = prontuarios.cor ? prontuarios.cor.trim() : '';
                prontuarios.gruposang = prontuarios.gruposang
                    ? prontuarios.gruposang.trim()
                    : '';
                // prontuarios.du =prontuarios.du? prontuarios.du.trim():'';
                prontuarios.fatorrh = prontuarios.fatorrh
                    ? prontuarios.fatorrh.trim()
                    : '';
                prontuarios.matric = prontuarios.matric
                    ? prontuarios.matric.trim()
                    : '';
                prontuarios.ddd1 = prontuarios.ddd1
                    ? prontuarios.ddd1.trim()
                    : '';
                prontuarios.ddd2 = prontuarios.ddd2
                    ? prontuarios.ddd2.trim()
                    : '';
                prontuarios.fone1 = prontuarios.fone1
                    ? prontuarios.fone1.trim()
                    : '';
                prontuarios.fone2 = prontuarios.fone2
                    ? prontuarios.fone2.trim()
                    : '';
                prontuarios.email = prontuarios.email
                    ? prontuarios.email.trim()
                    : '';
                // prontuarios.usuario =prontuarios.usuario? prontuarios.usuario.trim():'';
                prontuarios.qtd = prontuarios.qtd ? prontuarios.qtd : 0;
                // prontuarios.peso =prontuarios.peso? prontuarios.peso:0;
                // prontuarios.altura =prontuarios.altura? prontuarios.altura:0;
                prontuarios.profissao = prontuarios.profissao
                    ? prontuarios.profissao.trim()
                    : '';
                // prontuarios.tipodoc =prontuarios.tipodoc? prontuarios.tipodoc.trim():'';
                // prontuarios.documento =prontuarios.documento? prontuarios.documento.trim():'';
                prontuarios.estcivi = prontuarios.estcivi
                    ? prontuarios.estcivi.trim()
                    : '';
                // prontuarios.nfilhos =prontuarios.nfilhos? prontuarios.nfilhos.trim():'';
                // prontuarios.controle =prontuarios.controle? prontuarios.controle:0;
                prontuarios.cpf = prontuarios.cpf ? prontuarios.cpf.trim() : '';
                prontuarios.estadocivi = prontuarios.estadocivi
                    ? prontuarios.estadocivi.trim()
                    : '';
                // prontuarios.obspro =prontuarios.obspro? prontuarios.obspro.trim():'';
                // prontuarios.valplano =prontuarios.valplano? prontuarios.valplano.trim():'';
                // prontuarios.cod =prontuarios.cod? prontuarios.cod.trim():'';
                // prontuarios.fumante =prontuarios.fumante? prontuarios.fumante.trim():'';

                prontuarios.empresa = prontuarios.empresa
                    ? prontuarios.empresa.trim()
                    : '';
                // prontuarios.ddd1 =prontuarios.ddd1? prontuarios.ddd1.trim():'';
                //  prontuarios.ddd2 =prontuarios.ddd2? prontuarios.ddd2.trim():'';
                prontuarios.fotopac_url = prontuarios.fotopac_url
                    ? prontuarios.fotopac_url.trim()
                    : '';
                prontuarios.fotopac_url = prontuarios.fotopac_url
                    ? prontuarios.fotopac_url.trim()
                    : '';
                prontuarios.nome_pai = prontuarios.nome_pai
                    ? prontuarios.nome_pai.trim()
                    : '';
                prontuarios.nome_mae = prontuarios.nome_mae
                    ? prontuarios.nome_mae.trim()
                    : '';
                // prontuarios.gestacacao =prontuarios.gestacacao? prontuarios.gestacacao.trim():'';
                // prontuarios.duracao =prontuarios.duracao? prontuarios.duracao.trim():'';
                // prontuarios.parto =prontuarios.parto? prontuarios.parto.trim():'';
                // prontuarios.apgar_1 =prontuarios.apgar_1? prontuarios.apgar_1.trim():'';
                // prontuarios.apgar_5 =prontuarios.apgar_5? prontuarios.apgar_5.trim():'';
                // prontuarios.apgar_10 =prontuarios.apgar_10? prontuarios.apgar_10.trim():'';
                // prontuarios.peso_nasc =prontuarios.peso_nasc? prontuarios.peso_nasc.trim():'';
                // prontuarios.altura_nasc =prontuarios.altura_nasc? prontuarios.altura_nasc.trim():'';
                // prontuarios.pc =prontuarios.pc? prontuarios.pc.trim():'';
                // prontuarios.pt =prontuarios.pt? prontuarios.pt.trim():'';
                // prontuarios.peso_sair =prontuarios.peso_sair? prontuarios.peso_sair.trim():'';
                // prontuarios.obs_nasc =prontuarios.obs_nasc? prontuarios.obs_nasc.trim():'';
                prontuarios.bpaibge = prontuarios.bpaibge
                    ? prontuarios.bpaibge.trim()
                    : '';
                prontuarios.titular = prontuarios.titular
                    ? prontuarios.titular.trim()
                    : '';
                prontuarios.cns = prontuarios.cns ? prontuarios.cns.trim() : '';

                prontuarios.compl = prontuarios.compl
                    ? prontuarios.compl.trim()
                    : '';
                prontuarios.rn = prontuarios.rn ? prontuarios.rn.trim() : '';
                prontuarios.senhawebpro = prontuarios.senhawebpro
                    ? prontuarios.senhawebpro.trim()
                    : '';
                // prontuarios.senha =prontuarios.senha? prontuarios.senha.trim():'';
                // prontuarios.horachegada =prontuarios.horachegada? prontuarios.horachegada.trim():'';
                // prontuarios.horasaida =prontuarios.horasaida? prontuarios.horasaida.trim():'';
                //   prontuarios.rg_dtexp =prontuarios.rg_dtexp? prontuarios.rg_dtexp.trim():'';
                prontuarios.numero = prontuarios.numero
                    ? prontuarios.numero.trim()
                    : '';
                prontuarios.nis_pis = prontuarios.nis_pis
                    ? prontuarios.nis_pis.trim()
                    : '';
                prontuarios.nome_social = prontuarios.nome_social
                    ? prontuarios.nome_social.trim()
                    : '';
                prontuarios.tipoident = prontuarios.tipoident
                    ? prontuarios.tipoident.trim()
                    : '';
                prontuarios.identificadorbenef = prontuarios.identificadorbenef
                    ? prontuarios.identificadorbenef.trim()
                    : '';
                prontuarios.templatebiometrico = prontuarios.templatebiometrico
                    ? prontuarios.templatebiometrico.trim()
                    : '';

                if (prontuarios.envio_id) {
                    prontuarios.envio.descricao = prontuarios.envio.descricao
                        ? prontuarios.envio.descricao.trim()
                        : '';
                }
                if (prontuarios.entrega_id) {
                    prontuarios.entrega.descricao = prontuarios.entrega
                        .descricao
                        ? prontuarios.entrega.descricao.trim()
                        : '';
                }
                if (prontuarios.status >= 0) {
                    prontuarios.motina.descricao = prontuarios.motina.descricao
                        ? prontuarios.motina.descricao.trim()
                        : '';
                }
                if (prontuarios.convenio_id) {
                    prontuarios.convenio.fantasia = prontuarios.convenio
                        .fantasia
                        ? prontuarios.convenio.fantasia.trim()
                        : '';
                }
                if (prontuarios.plano_id) {
                    prontuarios.plano.descricao = prontuarios.plano.descricao
                        ? prontuarios.plano.descricao.trim()
                        : '';
                }
                if (prontuarios.medico_id) {
                    prontuarios.medico.nome_med = prontuarios.medico.nome_med
                        ? prontuarios.medico.nome_med.trim()
                        : '';
                }
                if (prontuarios.cid_id) {
                    prontuarios.cid.descricao = prontuarios.cid.descricao
                        ? prontuarios.cid.descricao.trim()
                        : '';
                }
                if (prontuarios.operador_id) {
                    prontuarios.operador.nome = prontuarios.operador.nome
                        ? prontuarios.operador.nome.trim()
                        : '';
                }
                // if (prontuarios.posto) {
                //     prontuarios.Posto.descricao = prontuarios.Posto.descricao
                //         ? prontuarios.Posto.descricao.trim()
                //         : '';
                // }
                if (prontuarios.posto) {
                    if (prontuarios.Posto) {
                        prontuarios.Posto.descricao = prontuarios.Posto.descricao.trim();
                    } else {
                        prontuarios.Posto = null;
                    }
                }
                return res.status(200).json(prontuarios);
            } catch (err) {
                return res.status(400).json({ error: err.message });
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async findProntuarioByNameAndBirthDate(req, res) {
        try {
            const { Prontuario } = Database.getModels(req.database);

            const data = JSON.parse(req.query.valuesToValidate);

            let checkNameAndDate = null;
            if (data.permissions.parametros.avisa_prontu === '1') {
                checkNameAndDate = await Prontuario.findOne({
                    where: {
                        [Op.and]: [
                            { nome: data.nome },
                            { data_nasc: data.data_nasc },
                        ],
                    },
                });
            }

            if (checkNameAndDate) {
                return res.status(200).json(checkNameAndDate.dataValues);
            }

            return res.status(200).json(checkNameAndDate);
        } catch (error) {
            return res.status(400).json({ error: err.message });
        }
    }

    async store(req, res) {
        try {
            const { Prontuario } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                posto: Yup.string().required(),
                convenio_id: Yup.number().required(),
                plano_id: Yup.number().required(),
                entrega_id: Yup.number().required(),
                envio_id: Yup.number().required(),
                sexo: Yup.string().required(),
                data_nasc: Yup.date().required(),
                nome: Yup.string().required(),
                status: Yup.number().required(),
                idopera_ultacao: Yup.number().required(),
                medico_id: Yup.number().nullable(),
                operador_id: Yup.number().nullable(),
                obs: Yup.string(),
                rg: Yup.string(),
                endereco: Yup.string(),
                cidade: Yup.string(),
                uf: Yup.string(),
                cep: Yup.string(),
                bairro: Yup.string(),
                cor: Yup.string(),
                gruposang: Yup.string(),
                fatorrh: Yup.string(),
                matric: Yup.string(),
                ddd1: Yup.string(),
                ddd2: Yup.string(),
                fone1: Yup.string(),
                fone2: Yup.string(),
                email: Yup.string(),
                qtd: Yup.number().nullable(),
                cpf: Yup.string(),
                estadocivi: Yup.string(),
                valplano: Yup.date().nullable(),
                empresa: Yup.string(),
                //  fotopac:Yup.string(),
                bpaibge: Yup.string(),
                titular: Yup.string(),
                cns: Yup.string(),
                cid_id: Yup.string().nullable(),
                numero: Yup.string(),
                compl: Yup.string(),
                rn: Yup.number(),
                senhawebpro: Yup.string(),
                rg_dtexp: Yup.date().nullable(),
                nis_pis: Yup.string(),
                nome_social: Yup.string(),
                tipoident: Yup.string(),
                identificadorbenef: Yup.string(),
                templatebiometrico: Yup.string(),
                siaweb: Yup.number().nullable(),
                profissao: Yup.string(),
                nome_pai: Yup.string(),
                nome_mae: Yup.string(),
                // du:Yup.,
                // usuario:Yup.,
                //	peso:Yup.,
                //	altura:Yup.,

                //	tipodoc:Yup.,
                //	documento:Yup.,
                //	estcivil:Yup.,
                //	nfilhos:Yup.,
                //	controle:Yup.,
                //  obspro
                //	cod
                //	fumante:Yup.,
                //	ddd1:Yup.,
                //	ddd2:Yup.,
                //	gestacao:Yup.,
                //	duracao:Yup.,
                //	parto:Yup.,
                //	apgar_1:Yup.,
                //	apgar_5:Yup.,
                //	apgar_10:Yup.,
                //	peso_nasc:Yup.,
                //	altura_nasc:Yup.,
                //	pc:Yup.,
                //	pt:Yup.,
                //	peso_sair:Yup.,
                //	obs_nasc:Yup.,
                //	diasates:Yup.,
                //	laudoinss:Yup.,
                //	senha:Yup.,
                //	horachegada:Yup.,
                //	horasaida:Yup.,
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            /*    const prontuarioExists = await Prontuario.findOne({
                where: { codigo: req.body.codigo },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (prontuarioExists) {
                return res
                    .status(400)
                    .json({ error: 'Prontuario com codigo ja cadastrado.' });
            } */

            const {
                id,
                posto,
                convenio_id,
                plano_id,
                entrega_id,
                envio_id,
                sexo,
                data_nasc,
                nome,
                status,
                prontuario,
                medico_id,
                operador_id,
                obs,
                rg,
                endereco,
                cidade,
                uf,
                cep,
                bairro,
                cor,
                gruposang,
                fatorrh,
                matric,
                ddd1,
                ddd2,
                fone1,
                fone2,
                email,
                qtd,
                cpf,
                estadocivi,
                valplano,
                idopera_ultacao,
                empresa,
                nome_pai,
                nome_mae,
                profissao,
                bpaibge,
                titular,
                cns,
                cid_id,
                numero,
                compl,
                rn,
                senhawebpro,
                rg_dtexp,
                nis_pis,
                nome_social,
                tipoident,
                identificadorbenef,
                templatebiometrico,
                siaweb,
            } = await Prontuario.create(req.body).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({
                id,
                posto,
                convenio_id,
                plano_id,
                entrega_id,
                envio_id,
                sexo,
                data_nasc,
                nome,
                status,
                profissao,
                prontuario,
                medico_id,
                operador_id,
                obs,
                rg,
                endereco,
                cidade,
                uf,
                cep,
                bairro,
                cor,
                gruposang,
                fatorrh,
                matric,
                ddd1,
                ddd2,
                fone1,
                fone2,
                email,
                qtd,
                cpf,
                estadocivi,
                valplano,
                idopera_ultacao,
                empresa,
                //  fotopac,
                bpaibge,
                nome_pai,
                nome_mae,
                titular,
                cns,
                cid_id,
                numero,
                compl,
                rn,
                senhawebpro,
                rg_dtexp,
                nis_pis,
                nome_social,
                tipoident,
                identificadorbenef,
                templatebiometrico,
                siaweb,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Prontuario } = Database.getModels(req.database);
            const schema = Yup.object().shape({
                id: Yup.number().required(),
                posto: Yup.string().required(),
                convenio_id: Yup.number().required(),
                plano_id: Yup.number().required(),
                entrega_id: Yup.number().required(),
                envio_id: Yup.number().required(),
                sexo: Yup.string().required(),
                data_nasc: Yup.date().required(),
                nome: Yup.string().required(),
                status: Yup.number().required(),
                idopera_ultacao: Yup.number().required(),
                medico_id: Yup.number().nullable(),
                operador_id: Yup.number().nullable(),
                obs: Yup.string(),
                rg: Yup.string(),
                endereco: Yup.string(),
                cidade: Yup.string(),
                uf: Yup.string(),
                cep: Yup.string(),
                bairro: Yup.string(),
                cor: Yup.string(),
                gruposang: Yup.string(),
                fatorrh: Yup.string(),
                matric: Yup.string(),
                ddd1: Yup.string(),
                ddd2: Yup.string(),
                fone1: Yup.string(),
                fone2: Yup.string(),
                email: Yup.string(),
                qtd: Yup.number().nullable(),
                cpf: Yup.string(),
                estadocivi: Yup.string(),
                valplano: Yup.date().nullable(),
                empresa: Yup.string(),
                //   fotopac:Yup.string(),
                bpaibge: Yup.string(),
                nome_pai: Yup.string(),
                nome_mae: Yup.string(),
                titular: Yup.string(),
                cns: Yup.string(),
                cid_id: Yup.string().nullable(),
                numero: Yup.string(),
                compl: Yup.string(),
                rn: Yup.number(),
                senhawebpro: Yup.string(),
                rg_dtexp: Yup.date().nullable(),
                nis_pis: Yup.string(),
                nome_social: Yup.string(),
                tipoident: Yup.string(),
                identificadorbenef: Yup.string(),
                templatebiometrico: Yup.string(),
                siaweb: Yup.number().nullable(),
                profissao: Yup.string(),
                // du:Yup.,
                // usuario:Yup.,
                //	peso:Yup.,
                //	altura:Yup.,
                //	tipodoc:Yup.,
                //	documento:Yup.,
                //	estcivil:Yup.,
                //	nfilhos:Yup.,
                //	controle:Yup.,
                //  obspro
                //	cod
                //	fumante:Yup.,
                //	ddd1:Yup.,
                //	ddd2:Yup.,
                //	gestacao:Yup.,
                //	duracao:Yup.,
                //	parto:Yup.,
                //	apgar_1:Yup.,
                //	apgar_5:Yup.,
                //	apgar_10:Yup.,
                //	peso_nasc:Yup.,
                //	altura_nasc:Yup.,
                //	pc:Yup.,
                //	pt:Yup.,
                //	peso_sair:Yup.,
                //	obs_nasc:Yup.,
                //	diasates:Yup.,
                //	laudoinss:Yup.,
                //	senha:Yup.,
                //	horachegada:Yup.,
                //	horasaida:Yup.,
            });

            if (!(await schema.isValid(req.body))) {
                return res.status(400).json({
                    error: ' Validacao de campos obrigatorios Falhou.',
                });
            }

            const prontuarioExists = await Prontuario.findByPk(
                req.body.id
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!prontuarioExists) {
                return res
                    .status(400)
                    .json({ error: 'Prontuário  nao encontrado' });
            }

            if (
                prontuarioExists &&
                req.body.id !== prontuarioExists.id.toString()
            ) {
                return res
                    .status(400)
                    .json({ error: 'Prontuário ja cadastrado.' });
            }

            await Prontuario.update(req.body, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json({
                        id: data[1].id,
                        posto: data[1].posto,
                        convenio_id: data[1].convenio_id,
                        plano_id: data[1].plano_id,
                        entrega_id: data[1].entrega_id,
                        envio_id: data[1].envio_id,
                        sexo: data[1].sexo,
                        data_nasc: data[1].data_nasc,
                        nome: data[1].nome,
                        status: data[1].status,
                        profissao: data[1].profissao,
                        prontuario: data[1].prontuario,
                        medico_id: data[1].medico_id,
                        operador_id: data[1].operador_id,
                        obs: data[1].obs,
                        rg: data[1].rg,
                        endereco: data[1].endereco,
                        cidade: data[1].cidade,
                        uf: data[1].uf,
                        cep: data[1].cep,
                        bairro: data[1].bairro,
                        cor: data[1].cor,
                        gruposang: data[1].gruposang,
                        fatorrh: data[1].fatorh,
                        matric: data[1].matric,
                        ddd1: data[1].ddd1,
                        ddd2: data[1].ddd2,
                        fone1: data[1].fone1,
                        fone2: data[1].fone2,
                        email: data[1].email,
                        qtd: data[1].qtd,
                        cpf: data[1].cpf,
                        estadocivi: data[1].estadocivil,
                        valplano: data[1].valplano,
                        idopera_ultacao: data[1].idopera_ultacao,
                        empresa: data[1].empresa,
                        //  fotopac:data[1].fotopac,
                        bpaibge: data[1].bpaibge,
                        titular: data[1].titular,
                        cns: data[1].cns,
                        cid_id: data[1].cid_id,
                        numero: data[1].numero,
                        compl: data[1].compl,
                        rn: data[1].rn,
                        senhawebpro: data[1].senhawebpro,
                        rg_dtexp: data[1].rg_dtexp,
                        nis_pis: data[1].nis_pis,
                        nome_social: data[1].nome_social,
                        tipoident: data[1].tipoident,
                        identificadorbenef: data[1].identificadorbenef,
                        templatebiometrico: data[1].templatebiometrico,
                        siaweb: data[1].siaweb,
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
            const { Prontuario } = Database.getModels(req.database);
            await Prontuario.destroy({
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

    async updateFotopac(req, res) {
        try {
            const { Prontuario } = Database.getModels(req.database);
            const { key, Location: url } = req.file;

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            await Prontuario.update(
                { fotopac_key: key || '', fotopac_url: newUrl || '' },
                { where: { id: req.params.id } }
            ).catch(err => {
                res.status(400).json({ error: err.message });
            });

            return res
                .status(200)
                .json({ fotopac_key: key, fotopac_url: newUrl });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async deleteFotopac(req, res) {
        try {
            const { key } = req.params;

            const params = { Bucket: 'sialab', Key: key };
            await s3.deleteObject(params, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    return res.status(200).json('Excluído com sucesso!');
                }
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async calculaIdadePaciente(req, res) {
        const idade = await calculaIdade(req, '2000-05-19', '2021-08-10');
        return res.status(200).json(idade);
    }

    async ultimosAtendimentos(req, res) {
        try {
            const { id } = req.params;
            const { posto, diainipac, diafinpac } = req.body;

            const { Movpac } = Database.getModels(req.database);

            let where = `"Movpac"."prontuario_id" = ${id} `;
            where += ` AND "Movpac"."posto" = '${posto}' `;
            where += ` AND ("Movpac"."dataentra" BETWEEN '${diainipac}' AND '${diafinpac}') `;

            const data = await Movpac.findAll({
                where: Movpac.sequelize.literal(where),
                order: Movpac.sequelize.literal(`DATAENTRA DESC`),
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            // SELECT
            //     POSTO,
            //     AMOSTRA,
            //     DATAENTRA
            // FROM MOVPAC
            // WHERE PRONTUARIO_ID = ?ALLTRIM(STR(NVL(CRMOVPACM.PRONTUARIO_ID,0)))
            //     AND POSTO = ?THISFORM.cmbposto.Value
            //     AND (MOVPAC.DATAENTRA BETWEEN ?M.DIAINIPAC AND ?M.DIAFINPAC)
            // ORDER BY DATAENTRA DESC

            return res.status(200).json(data);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async examesCadastrados(req, res) {
        try {
            const {
                prontuario_id,
                exame_id,
                movexa_id,
                movpac_id,
                convenio_id,
                qtd_dias,
            } = req.query;

            const sequelize = Database.instances[req.database];

            const data_inicial = format(
                sub(await PegaData(req), { days: qtd_dias }),
                'yyyy-MM-dd'
            );
            const data_final = format(await PegaData(req), 'yyyy-MM-dd');

            const data = await sequelize
                .query(
                    `
                    SELECT
                        EXAME.CODIGO,
                        EXAME.DESCRICAO,
                        PRONTUARIO.ID,
                        MOVEXA.DATAENTRA,
                        MOVEXA.DTCOLETA,
                        MOVPAC.HORAENTRA,
                        MOVEXA.MOVPAC_ID,
                        MOVEXA.EXAME_ID,
                        MOVEXA.STATUSEXM,
                        MOVEXA.POSTO,
                        MOVEXA.AMOSTRA,
                        MOVEXA.LAYOUT_ID,
                        MOVEXA.DATA_LANRES,
                        MOVEXA.HORA_LANRES,
                        MOVEXA.POSTO,
                        MOVEXA.AMOSTRA
                        FROM MOVEXA
                        LEFT JOIN MOVPAC     ON MOVPAC.ID = MOVEXA.MOVPAC_ID
                        LEFT JOIN PRONTUARIO ON PRONTUARIO.ID = MOVPAC.PRONTUARIO_ID
                        LEFT JOIN EXAME      ON EXAME.ID = MOVEXA.EXAME_ID
                    WHERE MOVEXA.EXAME_ID = ${exame_id}
                        AND PRONTUARIO.ID = ${prontuario_id}
                        AND MOVEXA.ID <> ${movexa_id}
                        AND MOVPAC.ID <> ${movpac_id}
                        AND MOVEXA.CONVENIO_ID = ${convenio_id}
                        AND (MOVEXA.DATAENTRA BETWEEN '${data_inicial}' AND '${data_final}')
                    ORDER BY MOVEXA.DATAENTRA DESC
                    LIMIT 1
                `,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(data);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async estatistica(req, res) {
        const { Movpac } = Database.getModels(req.database);
        const { postos, dataini, datafim, sexo } = req.body;

        let select = `
            SELECT
                B.ID,
                B.POSTO,
                B.NOME,
                B.EMAIL,
                B.SEXO,
                B.FONE1,
                B.FONE2,
                COUNT(*) AS QTD --,ROW_NUMBER () OVER (ORDER BY B.ID)
            FROM
                MOVPAC A
                LEFT JOIN PRONTUARIO B ON A.PRONTUARIO_ID = B.ID
            WHERE
                B.POSTO in (:postos) AND
                A.DATAENTRA BETWEEN :dataInicial AND :dataFinal
                ${sexo ? 'AND B.SEXO = :sexo' : ''}
            GROUP BY
                B.ID, B.POSTO, B.NOME, B.EMAIL, B.SEXO, B.FONE1, B.FONE2
            HAVING
                COUNT(*) > 0
            ORDER BY
                LTRIM(B.NOME)`;

        try {
            const dataInicialFormatada = format(
                parseISO(dataini),
                'yyyy-MM-dd'
            );
            const dataFinalFormatada = format(parseISO(datafim), 'yyyy-MM-dd');
            const data = await Movpac.sequelize.query(select, {
                replacements: {
                    dataInicial: dataInicialFormatada,
                    dataFinal: dataFinalFormatada,
                    postos,
                    sexo,
                },
                type: QueryTypes.SELECT,
            });

            if (data.length > 100000) {
                throw new Error('Quantidade de registros acima do limite');
            }

            const total = data.reduce((acc, curr) => {
                return acc + parseInt(curr.qtd);
            }, 0);

            const dadosComSoma = {
                data,
                total,
            };

            return res.status(200).json(dadosComSoma);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async gerarRelatorio(req, res) {
        const { dados, dataini, datafim, color, profile, logo } = req.body;

        const { parte, ehAUltimaParte, exames } = dados;
        const { total, totalProntuarios, sexo } = dados.resto;

        const sexoFormatado = sexo
            ? sexo === 'F'
                ? 'Feminino'
                : 'Masculino'
            : 'Ambos';
        try {
            const html = await gerarRelatorioHtml({
                model: `/estatisticas/prontuario/index`,
                data: {
                    registros: exames,
                    ehAUltimaParte,
                    total: {
                        prontuarios: totalProntuarios,
                        atendimentos: total,
                    },
                    sexo: sexoFormatado,
                    parte,
                },
                startDate: dataini,
                endDate: datafim,
                logo,
                profile,
                color: `#${color}`,
            });

            return res.send(html);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static handleFilters(filterName, filterValue) {
        let filter = '';
        switch (filterName) {
            case 'posto':
                filter = ` CAST("Prontuario"."posto" AS TEXT) LIKE '%${filterValue.toUpperCase()}%'`;
                break;
            case 'data_nasc':
                filter = ` "Prontuario"."data_nasc" between '${filterValue}'`;
                break;
            case 'prontuario':
                if (filterValue !== null) {
                    filter += ` CAST("Prontuario"."prontuario" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'nome':
                if (filterValue !== null) {
                    filter += ` CAST("Prontuario"."nome" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'rg':
                if (filterValue !== null) {
                    filter += ` CAST("Prontuario"."rg" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'cpf':
                if (filterValue !== null) {
                    filter += ` CAST("Prontuario"."cpf" AS TEXT) ILIKE '%${filterValue}%'`;
                }
                break;
            case 'cns':
                if (filterValue !== null) {
                    filter += ` CAST("Prontuario"."cns" AS TEXT) ILIKE '%${filterValue}%'`;
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
                    ? (filter += ` (Unaccent(upper(trim(coalesce("Prontuario"."${filterName}",'')))) ILIKE Unaccent('%${filterValue.toUpperCase()}%'))`)
                    : null;
        }

        return filter;
    }
}

export default new ProntuarioController();
