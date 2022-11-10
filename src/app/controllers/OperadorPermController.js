import aws from 'aws-sdk';
import { QueryTypes } from 'sequelize';
// import Operador from '../models/Operador';
// import Operador2 from '../models/Operador2';
import Database from '../../database';

const s3 = new aws.S3();
class OperadorPermController {
    async index(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Operador } = Models;

            const { userId, tabela } = req.query;
            let newtabela = '';
            let leftjoinf = '';

            switch (tabela) {
                case 'motina':
                    newtabela = 'ina';
                    leftjoinf = ''
                    break;
                case 'opera':
                    newtabela = 'opera';
                    leftjoinf = ''
                    break;
                case 'nivel':
                    newtabela = 'nivel';
                    leftjoinf = ''
                    break;
                case 'banco':
                    newtabela = 'banco';
                    leftjoinf = ''
                    break;
                case 'prontuario':
                    newtabela = 'prontu';
                    leftjoinf = `left join operadorf on operadorf.operador_id = operador.id`
                    break;
                default:
                    newtabela = tabela;
                    leftjoinf = `left join operadorf on operadorf.operador_id = operador.id`
            }

            const permissoes = await Operador.sequelize
                .query(
                    `select cad_${newtabela}_ac, cad_${newtabela}_ad, cad_${newtabela}_md, cad_${newtabela}_ex, cad_${newtabela}_co, trim(coalesce(postoperm,'')) as postoperm, trim(coalesce(convperm,'')) as convperm from operador left join operador2 on operador2.operador_id = operador.id ` + leftjoinf + ` where operador.id = :id`,
                    {
                        replacements: {
                            id: userId,
                        },
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(permissoes);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexPermPostoConv(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Operador } = Models;

            const { userId } = req.query;

            const permissoes = await Operador.sequelize
                .query(
                    `select trim(coalesce(postoperm,'')) as postoperm, trim(coalesce(convperm,'')) as convperm from operador left join operador2 on operador2.operador_id = operador.id where operador.id = :id`,
                    {
                        replacements: {
                            id: userId,
                        },
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(permissoes);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexParametro(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Operador } = Models;

            const { campo } = req.query;

            const parametros = await Operador.sequelize
                .query(`select ${campo} from param, param2, paramf`, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(parametros);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOperador(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Operador } = Models;

            const { campo } = req.query;

            const parametros = await Operador.sequelize
                .query(
                    `select ${campo} from operador, operador2, operador3 where operador.id = ${req.userId} AND operador2.operador_id = ${req.userId} AND operador3.operador_id = ${req.userId}`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(parametros);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOperadorMulti(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Operador } = Models;

            let permissoes = '';
            const { campos } = req.query;
            const lenperm = campos.split(',');
            for (let i = 0; i < lenperm.length; i++) {
                const element = lenperm[i].trim();
                if (i === lenperm.length - 1) {
                    permissoes += `${element}`;
                } else {
                    permissoes += `${element},`;
                }
            }

            const parametros = await Operador.sequelize
                .query(
                    `select ${permissoes} from operador left join operador2 on operador2.operador_id = operador.id left join operador3 on operador3.operador_id = operador.id where operador.id = ${req.userId}`,
                    {
                        type: QueryTypes.SELECT,
                    }
                )
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(parametros[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexMenu(req, res) {
        try {
            const Models = Database.getModels(req.database);
            const { Operador, Operador2, Operador3, Operadorf } = Models;

            const { userId } = req.query;

            const permissoesMenu = await Operador.findOne({
                where: { id: userId },
                attributes: [
                    `cad_cid_ac`,
                    `cad_espmed_ac`,
                    `cad_medico_ac`,
                    `cad_envio_ac`,
                    `cad_grade_ac`,
                    `cad_prontu_ac`,
                    `orcamento`,
                    `cad_entrega_ac`,
                    `cad_setor_ac`,
                    `cad_ina_ac`,
                    `cad_material_ac`,
                    `cad_atend_ac`,
                    `cad_filtro_ac`,
                    `cad_situacao_ac`,
                    `cad_exame_ac`,
                    `cad_frase_ac`,
                    `cad_apoio_ac`,
                    `cad_caixa_ac`,
                    `cad_recmat_ac`,
                    `cad_sit_ac`,
                    `cad_impres_ac`,
                    `apoio`,
                    `cad_posto_ac`,
                    'cad_matmed_ac',
                    'cad_interfere_ac',
                    'cad_metodo_ac',
                    'cad_fungos_ac',
                    'cad_parasitas_ac',
                    'cad_feriado_ac',
                    'cad_recip_ac',
                    'cad_rotina_ac',
                    'cad_esptab_ac',
                    'cad_banco_ac',
                    'cad_cartao_ac',
                    'cad_porte_ac',
                    'cad_espmed_ac',
                    'cad_forpag_ac',
                    'cad_motivo_ac',
                    'cad_layout_ac',
                    'cad_drive_ac',
                    'cad_matriz_ac',
                    'cad_tabela_ac',
                    'cad_convenio_ac',
                    'cad_movdia_ac',
                    'novacoleta',
                    'cad_opera_ac',
                    'cad_nivel_ac',
                    'protocolo',
                    'reldev',
                    'param_ac',
                    'cad_impmapa_ac',
                    'lanmapa',
                    'est',
                    'cad_lanca_ac',
                ],
                include: [
                    {
                        model: Operador2,
                        as: 'operador2',
                        attributes: [
                            'cad_motivonc_ac',
                            'cad_questao_ac',
                            'cad_eqp_ac',
                            'cad_linha_ac',
                            'cad_empresa_ac',
                            'estposcol',
                            'estgrafico',
                            'estconv',
                            'estentrega',
                            'estenvio',
                            'estmedicos',
                            'estposexa',
                            'estsetor',
                            'estopera',
                            'estposprontu',
                            'acessa_painel_cli',
                            'repete_exa',
                            'naolancares',
                            'nao_libera_exa',
                            'coleta_material',
                            'env_malote_material',
                            'estlibexa',
                        ],
                    },
                    {
                        model: Operador3,
                        as: 'operador3',
                        attributes: [
                            'relconfop',
                            'estattriagem',
                            'estatrecip',
                            'estatsituacao'
                        ],
                    },
                    {
                        model: Operadorf,
                        as: 'operadorf',
                        attributes: [
                            'extratob',
                            'cad_pagar_ac',
                            'cad_receber_ac',
                            'cad_pl_contas_ac',
                            'cad_contas_ac',
                            'cad_ccusto_ac',
                            'cad_sacado_ac',
                            'fluxo',
                            'cad_fornecedor_ac',
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });
            const permissaomenu = [];
            // Cadastros
            if (permissoesMenu) {
                if (permissoesMenu.dataValues.cad_exame_ac === '1') {
                    // Criação de sub-menu de exames
                    const menus = [
                        {
                            label: 'Exames',
                            url: '/lab/exames', // coloca apenas para testes - alterar
                        },
                    ];
                    if (permissoesMenu.dataValues.cad_layout_ac === '1') {
                        menus.push({
                            label: 'Layouts',
                            url: '/lab/layout',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_matriz_ac === '1') {
                        menus.push({
                            label: 'Matrizes (Laudos)',
                            url: '/lab/matriz',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_frase_ac === '1') {
                        menus.push({
                            label: 'Frases para Laudos',
                            url: '/lab/frases',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_motivo_ac === '1') {
                        menus.push({
                            label: 'Motivos de Nova Coleta',
                            url: '/lab/motivos',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_matmed_ac === '1') {
                        menus.push({
                            label: 'Materiais e Medicamentos',
                            url: '/lab/matmed',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_interfere_ac === '1') {
                        menus.push({
                            label: 'Medicamentos Interferentes',
                            url: '/lab/interfere',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_recip_ac === '1') {
                        menus.push({
                            label: 'Recipientes de Amostras',
                            url: '/lab/recips',
                        });
                    }
                    if (
                        permissoesMenu.operador2.dataValues.cad_linha_ac === '1'
                    ) {
                        menus.push({
                            label: 'Linhas',
                            url: '/lab/linhas',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_metodo_ac === '1') {
                        menus.push({
                            label: 'Métodos',
                            url: '/lab/metodo',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_fungos_ac === '1') {
                        menus.push({
                            label: 'Fungos, Bactérias e Vírus',
                            url: '/lab/fungos',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_parasitas_ac === '1') {
                        menus.push({
                            label: 'Parasitas',
                            url: '/lab/parasitas',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_feriado_ac === '1') {
                        menus.push({
                            label: 'Feriados',
                            url: '/lab/feriado',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_rotina_ac === '1') {
                        menus.push({
                            label: 'Rotinas',
                            url: '/lab/rotina',
                        });
                    }
                    // Criação de menu de Exames
                    permissaomenu.push({
                        label: 'Exames',
                        submenu: '1',
                        tipo: 'cad',
                        menus,
                    });
                }

                if (permissoesMenu.dataValues.cad_exame_ac === '1') {
                    // Criacao de sub-menu de financeiro / faturamento
                    const menus = [];
                    if (permissoesMenu.dataValues.cad_esptab_ac === '1') {
                        menus.push({
                            label: 'Especialidades Tabela AMB',
                            url: '/lab/esptabs',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_cartao_ac === '1') {
                        menus.push({
                            label: 'Cartões',
                            url: '/lab/cartoes',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_banco_ac === '1') {
                        menus.push({
                            label: 'Bancos',
                            url: '/lab/bancos',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_porte_ac === '1') {
                        menus.push({
                            label: 'Portes',
                            url: '/lab/portes',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_forpag_ac === '1') {
                        menus.push({
                            label: 'Formas de Recebimento',
                            url: '/lab/forrecs',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_tabela_ac === '1') {
                        menus.push({
                            label: 'Tabela de Preços',
                            url: '/lab/tabela',
                        });
                    }
                    if (permissoesMenu.dataValues.cad_espmed_ac === '1') {
                        menus.push({
                            label: 'Especialidades Médicas',
                            url: '/lab/espmeds',
                        });
                    }
                    if (
                        permissoesMenu.operador2.dataValues.cad_empresa_ac ===
                        '1'
                    ) {
                        menus.push({
                            label: 'Empresa',
                            url: '/lab/empresas',
                        });
                    }

                    // Criacao de menu de Financeiro / Faturamento
                    permissaomenu.push({
                        label: 'Financ./ Faturam.',
                        submenu: '2',
                        tipo: 'cad',
                        menus,
                    });
                }

                if (permissoesMenu.dataValues.cad_apoio_ac === '1') {
                    permissaomenu.push({
                        label: 'Apoio',
                        url: '/lab/apoios',
                        tipo: 'cad',
                    });
                }

                if (permissoesMenu.dataValues.cad_convenio_ac === '1') {
                    permissaomenu.push({
                        label: 'Convenio',
                        url: '/lab/convenios',
                        tipo: 'cad',
                    });
                }

                if (permissoesMenu.dataValues.cad_medico_ac === '1') {
                    permissaomenu.push(
                        {
                            label: 'Medicos Solicitantes',
                            url: '/lab/medicos',
                            tipo: 'cad',
                        },
                        {
                            label: 'Medicos Realizantes',
                            url: '/lab/medicosrea',
                            tipo: 'cad',
                        }
                    );
                }

                if (permissoesMenu.dataValues.cad_situacao_ac === '1') {
                    permissaomenu.push({
                        label: 'Situacao',
                        url: '/lab/situacaos',
                        tipo: 'cad',
                    });
                    permissaomenu.push({
                        label: 'Situacao - Filtro',
                        url: '/lab/filtrosituacaos',
                        tipo: 'cad',
                    });
                }
                if (
                    permissoesMenu.operador2.dataValues.cad_questao_ac === '1'
                ) {
                    permissaomenu.push({
                        label: 'Questionario de Exames',
                        url: '/lab/questoes',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.operador2.dataValues.cad_eqp_ac === '1') {
                    permissaomenu.push({
                        label: 'Equipamentos de Interface',
                        url: '/lab/eqps',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_filtro_ac === '1') {
                    permissaomenu.push({
                        label: 'Filtro',
                        url: '/lab/filtros',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_posto_ac === '1') {
                    permissaomenu.push({
                        label: 'Posto de Coleta',
                        url: '/lab/postos',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_setor_ac === '1') {
                    permissaomenu.push({
                        label: 'Setor',
                        url: '/lab/setores',
                        tipo: 'cad',
                    });
                    permissaomenu.push({
                        label: 'Setor (Fila de Atendimento)',
                        url: '/lab/setoresfila',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_cid_ac === '1') {
                    permissaomenu.push({
                        label: 'Cids',
                        url: '/lab/cids',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_entrega_ac === '1') {
                    permissaomenu.push({
                        label: 'Entregas',
                        url: '/lab/entregas',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_envio_ac === '1') {
                    permissaomenu.push({
                        label: 'Envios',
                        url: '/lab/envios',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_grade_ac === '1') {
                    permissaomenu.push({
                        label: 'Grades',
                        url: '/lab/grades',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_material_ac === '1') {
                    permissaomenu.push({
                        label: 'Materiais',
                        url: '/lab/materiais',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_ina_ac === '1') {
                    permissaomenu.push({
                        label: 'Motivos de inatividade',
                        url: '/lab/motinas',
                        tipo: 'cad',
                    });
                }
                if (
                    permissoesMenu.operador2.dataValues.cad_motivonc_ac === '1'
                ) {
                    permissaomenu.push({
                        label: 'Motivos de Não Conformidades',
                        url: '/lab/motivonc',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_prontu_ac === '1') {
                    permissaomenu.push({
                        label: 'Prontuarios',
                        url: '/lab/prontuarios',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_opera_ac === '1') {
                    permissaomenu.push({
                        label: 'Operadores',
                        url: '/lab/operador',
                        tipo: 'cad',
                    });
                }
                if (permissoesMenu.dataValues.cad_nivel_ac === '1') {
                    permissaomenu.push({
                        label: 'Níveis Operador',
                        url: '/lab/nivel',
                        tipo: 'cad',
                    });
                }

                // Gerencial
                // if (permissoesMenu.dataValues.cad_atend_ac === '1') {
                //     permissaomenu.push({
                //         label: 'Atendimento',
                //         url: '/lab/atendimento',
                //         tipo: 'opera',
                //     });
                // }
                if (permissoesMenu.dataValues.cad_atend_ac === '1') {
                    permissaomenu.push({
                        label: 'Atendimento',
                        url: '/lab/atendimento',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.cad_atend_ac === '1') {
                    permissaomenu.push({
                        label: 'Atendimento (React)',
                        url: '/lab/atendimento2',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.cad_atend_ac === '1') {
                    permissaomenu.push({
                        label: 'Setor de Impressao',
                        url: '/lab/setorimpressao',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.cad_atend_ac === '1') {
                    permissaomenu.push({
                        label: 'Setor de Impressao (React)',
                        url: '/lab/setorimpressao2',
                        tipo: 'opera',
                    });
                }

                // if (permissoesMenu.dataValues.cad_caixa_ac === '1') {
                //     permissaomenu.push({
                //         label: 'Caixas (Abertura e Fechamento)',
                //         url: '/lab/caixas',
                //         tipo: 'opera',
                //     });
                // }

                if (permissoesMenu.dataValues.cad_caixa_ac === '1') {
                    permissaomenu.push({
                        label: 'Caixas (Abertura e Fechamento)',
                        url: '/lab/caixas',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.reldev === '1') {
                    permissaomenu.push({
                        label: 'Relatorio de Pacientes Devedores',
                        url: '/lab/relatorio/paciente/devedor',
                        tipo: 'opera',
                    });
                }
                // CHAMADA DE TELA DO FOXINCLOUD
                // if (permissoesMenu.dataValues.cad_sit_ac === '1') {
                //     permissaomenu.push({
                //         label: 'Situacao dos Exames',
                //         url: '/lab/situacao',
                //         tipo: 'opera',
                //     });
                // }

                if (permissoesMenu.dataValues.cad_impres_ac === '1') {
                    permissaomenu.push({
                        label: 'Impressão de Resultados',
                        submenu: '2',
                        tipo: 'opera',
                        menus: [
                            {
                                label: 'Impressão por Posto',
                                url: '/lab/imppos',
                            },
                            {
                                label: 'Impressão por Seleção de Pacientes',
                                url: '/lab/imppac',
                            },
                        ],
                    });
                }

                if (permissoesMenu.dataValues.cad_sit_ac === '1') {
                    permissaomenu.push({
                        label: 'Situacao dos Exames',
                        url: '/lab/situacao2',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.apoio === '1') {
                    permissaomenu.push({
                        label: 'Envio de Exames para Apoio',
                        url: '/lab/apoioenv',
                        tipo: 'opera',
                    });
                }
                // CHAMADA DE TELA DO FOXINCLOUD
                // if (permissoesMenu.dataValues.cad_recmat_ac === '1') {
                //     permissaomenu.push({
                //         label: 'Recebimento e Falta Material',
                //         url: '/lab/recmat',
                //         tipo: 'opera',
                //     });
                // }

                if (permissoesMenu.dataValues.cad_recmat_ac === '1') {
                    permissaomenu.push({
                        label: 'Recebimento e Falta Material',
                        url: '/lab/recmat2',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.cad_lanca_ac === '1') {
                    permissaomenu.push({
                        label: 'Lançamento de Resultados',
                        url: '/lab/lancaresullist',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.orcamento === '1') {
                    permissaomenu.push({
                        label: 'Orcamentos',
                        url: '/lab/orcamentos',
                        tipo: 'opera',
                    });
                }
                if (permissoesMenu.dataValues.cad_movdia_ac === '1') {
                    permissaomenu.push({
                        label: 'Movimento Diario',
                        url: '/lab/movimentodiario/posto',
                        tipo: 'opera',
                    });
                }
                if (permissoesMenu.dataValues.cad_layout_ac === '1') {
                    permissaomenu.push({
                        label: 'Tags',
                        url: '/lab/tags',
                        tipo: 'config',
                    });
                }
                if (permissoesMenu.dataValues.param_ac === '1') {
                    permissaomenu.push({
                        label: 'Parâmetros do Sistema',
                        url: '/lab/parametros',
                        tipo: 'config',
                    });
                }
                if (permissoesMenu.dataValues.param_ac === '1') {
                    permissaomenu.push({
                        label: 'Parâmetros Financeiro',
                        url: '/lab/parametrosfinanceiro',
                        tipo: 'config',
                    });
                }
                if (permissoesMenu.dataValues.cad_drive_ac === '1') {
                    permissaomenu.push({
                        label: 'Driver de Impressão',
                        url: '/lab/drive',
                        tipo: 'config',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estopera === '1') {
                    permissaomenu.push({
                        label: 'Operadores',
                        submenu: '1',
                        tipo: 'estatistica',
                        menus: [
                            {
                                label: 'Coleta de Materiais',
                                url: '/lab/estatcolemat',
                            },
                            {
                                label: 'Tempo de Atendimento',
                                url: '/lab/estatistica-operadores-atendimento',
                            },
                            {
                                label: 'Convênio - Tempo de Atendimento',
                                url: '/lab/estatistica-operadores-convenio-atendimento',
                            },
                            {
                                label: 'Convênio',
                                url: '/lab/estatistica-operadores-convenio',
                            },
                            {
                                label: 'Produtividade',
                                url: '/lab/estatistica-operadores-produtividade',
                            },
                        ],
                    });
                }

                if (permissoesMenu.operador2.dataValues.estsetor === '1') {
                    // Criacao de sub-menu de estatistica / setor
                    permissaomenu.push({
                        label: 'Setor',
                        submenu: '1',
                        tipo: 'estatistica',
                        menus: [
                            {
                                label: 'Geral',
                                url: '/lab/estatistica/setor/geral',
                            },
                            {
                                label: 'Por Posto',
                                url: '/lab/estatistica/setor/posto',
                            },
                            {
                                label: 'Nova Coleta',
                                url: '/lab/estatistica/setor/novacoleta',
                            }
                        ],
                    });
                }


                if (permissoesMenu.operador3.dataValues.estatsituacao === '1') {
                    permissaomenu.push({
                        label: 'Avançada',
                        url: '/lab/estatsituacao',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador3.dataValues.relconfop === '1') {
                    permissaomenu.push({
                        label: 'Conferência por Operador',
                        url: '/lab/relconfop',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estconv === '1') {
                    permissaomenu.push({
                        label: 'Convênios',
                        url: '/lab/estatistica/convenios',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estentrega === '1') {
                    permissaomenu.push({
                        label: 'Entrega',
                        url: '/lab/estentrega',
                        tipo: 'estatistica',
                    });
                }


                if (permissoesMenu.operador2.dataValues.estenvio === '1') {
                    permissaomenu.push({
                        label: 'Envio',
                        url: '/lab/estenvio',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.est === '1') {
                    permissaomenu.push({
                        label: 'Exames',
                        url: '/lab/estatistica/exames',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estlibexa === '1') {
                    permissaomenu.push({
                        label: 'Liberação de Exames',
                        url: '/lab/estlibexa',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estposcol === '1') {
                    permissaomenu.push({
                        label: 'Médicos',
                        url: '/lab/estatistica/medicos',
                        tipo: 'estatistica',
                    });
                }


                if (permissoesMenu.operador2.dataValues.estposcol === '1') {
                    permissaomenu.push({
                        label: 'Posto de Coleta',
                        url: '/lab/estatpos',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estposexa === '1') {
                    permissaomenu.push({
                        label: 'Posto / Exame',
                        url: '/lab/estatistica/postoexame',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador2.dataValues.estposprontu === '1') {
                    permissaomenu.push({
                        label: 'Prontuário',
                        url: '/lab/estatistica/prontuario',
                        tipo: 'estatistica'
                    });
                }

                if (permissoesMenu.operador3.dataValues.estatrecip === '1') {
                    permissaomenu.push({
                        label: 'Recipientes',
                        url: '/lab/estatistica/recipientes',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.operador3.dataValues.estattriagem === '1') {
                    permissaomenu.push({
                        label: 'Triagem',
                        url: '/lab/estattriagem',
                        tipo: 'estatistica',
                    });
                }

                if (permissoesMenu.dataValues.novacoleta === '1') {
                    permissaomenu.push({
                        label: 'Nova Coleta',
                        url: '/lab/novacoleta',
                        tipo: 'opera',
                    });
                }
                if (permissoesMenu.dataValues.novacoleta === '1') {
                    permissaomenu.push({
                        label: 'Andamento (Nova Coleta)',
                        url: '/lab/andamentonovacol',
                        tipo: 'opera',
                    });
                }
                if (permissoesMenu.operador2.dataValues.repete_exa === '1') {
                    permissaomenu.push({
                        label: 'Repeticao de exames',
                        url: '/lab/repeteexa',
                        tipo: 'opera',
                    });
                }
                if (permissoesMenu.dataValues.cad_entrega_ac === '1') {
                    permissaomenu.push({
                        label: 'Entregas (Laudo) Recepcao',
                        url: '/lab/entregapac',
                        tipo: 'opera',
                    });
                }
                if (permissoesMenu.dataValues.protocolo === '1') {
                    permissaomenu.push({
                        label: 'Protocolo de Exames',
                        url: '/lab/protocolo',
                        tipo: 'opera',
                    });
                }
                if (
                    permissoesMenu.operador2.dataValues.nao_libera_exa ===
                        '0' ||
                    permissoesMenu.operador2.dataValues.nao_libera_exa === null
                ) {
                    permissaomenu.push({
                        label: 'Assinar Resultados',
                        url: '/lab/libera',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.cad_impmapa_ac === '1') {
                    permissaomenu.push({
                        label: 'Impressão Mapa Tipo Grade',
                        url: '/lab/impressaomapagrade',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.lanmapa === '1') {
                    permissaomenu.push({
                        label: 'Lançamento Por Mapa Trabalho',
                        url: '/lab/lancamentomapa',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.operador2.coleta_material === '1') {
                    permissaomenu.push({
                        label: 'Coleta Material',
                        url: '/lab/coletamaterial',
                        tipo: 'opera',
                    });
                }

                if (permissoesMenu.dataValues.operador2.env_malote_material === '1') {
                    permissaomenu.push({
                        label: 'Envio de Malote de Material',
                        url: '/lab/enviomalote',
                        tipo: 'opera',
                    });
                }

                // Criação de menu cadastro do menu financeiro
                const menus = [];
                if (
                    permissoesMenu.operador2.dataValues.acessa_painel_cli ===
                    '1'
                ) {
                    permissaomenu.push({
                        label: 'Painel do Cliente',
                        url: '/lab/painelcliente',
                        tipo: 'financ',
                    });
                }
                if (permissoesMenu.operadorf.dataValues.extratob === '1') {
                    permissaomenu.push({
                        label: 'Extrato Bancário',
                        url: '/lab/extratobancario',
                        tipo: 'financ',
                    });
                }
                if (permissoesMenu.operadorf.dataValues.cad_pagar_ac === '1') {
                    permissaomenu.push({
                        label: 'Contas a Pagar',
                        url: '/lab/pagar',
                        tipo: 'financ',
                    });
                }
                if (
                    permissoesMenu.operadorf.dataValues.cad_receber_ac === '1'
                ) {
                    permissaomenu.push({
                        label: 'Contas a Receber',
                        url: '/lab/receber',
                        tipo: 'financ',
                    });
                }
                if (
                    permissoesMenu.operador2.dataValues.acessa_painel_cli ===
                    '1'
                ) {
                    permissaomenu.push({
                        label: 'Pagamentos - Pagarme',
                        url: '/lab/pagamentos',
                        tipo: 'financ',
                    });
                }

                if (
                    permissoesMenu.operadorf.dataValues.cad_pl_contas_ac === '1'
                ) {
                    menus.push({
                        label: 'Plano de Contas',
                        url: '/lab/plano-contas',
                    });
                }

                if (permissoesMenu.operadorf.dataValues.cad_contas_ac === '1') {
                    menus.push({
                        label: 'Contas Bancarias',
                        url: '/lab/contas-bancarias',
                    });
                }

                if (permissoesMenu.operadorf.dataValues.cad_ccusto_ac === '1') {
                    menus.push({
                        label: 'Centro de Custo',
                        url: '/lab/centro-custo',
                    });
                }

                if (permissoesMenu.operadorf.dataValues.cad_sacado_ac === '1') {
                    menus.push({
                        label: 'Sacado',
                        url: '/lab/sacado',
                    });
                }

                if (
                    permissoesMenu.operador2.dataValues.acessa_painel_cli ===
                    '1'
                ) {
                    permissaomenu.push({
                        label: 'BI - Business Intelligence',
                        url: '/lab/bi',
                        tipo: 'financ',
                    });
                }

                if (permissoesMenu.operadorf.dataValues.fluxo === '1') {
                    // TODO: Incluir validação para relatório Fluxo de Caixa
                    permissaomenu.push({
                        label: 'Fluxo de Caixa',
                        url: '/lab/fluxocaixa',
                        tipo: 'financ',
                    });
                }
                if (
                    permissoesMenu.operadorf.dataValues.cad_fornecedor_ac ===
                    '1'
                ) {
                    // TODO: Incluir validação para relatório Fluxo de Caixa
                    menus.push({
                        label: 'Fornecedores',
                        url: '/lab/fornecedor',
                    });
                }
                // Criação de menu de Cadastros do financeiro
                permissaomenu.push({
                    label: 'Financeiro Cadastros',
                    submenu: '1',
                    tipo: 'financ',
                    menus,
                });

                // INCLUSÃO DO MENU FATURAMENTO
                if (permissoesMenu.dataValues.cad_apoio_ac === '1') {
                    permissaomenu.push({
                        label: 'Faturamento de Convênio',
                        url: '/lab/faturamentoconvenio',
                        tipo: 'fatura',
                    });
                }

                if (permissoesMenu.dataValues.cad_apoio_ac === '1') {
                    permissaomenu.push({
                        label: 'Lotes para Faturamento',
                        url: '/lab/lotes-faturamento',
                        tipo: 'fatura',
                    });
                }

                if (permissoesMenu.dataValues.cad_apoio_ac === '1') {
                    permissaomenu.push({
                        label: 'Geração arquivo para TISS',
                        url: '/lab/geracao-arquivo-tiss',
                        tipo: 'fatura',
                    });
                }
            }

            return res.status(200).json(permissaomenu);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async updateAvatar(req, res) {
        try {
            const { originalname: name, key, location: url } = req.file;

            const newUrl =
                url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

            return res
                .status(200)
                .json({ avatar_key: key, avatar_url: newUrl });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async deleteAvatar(req, res) {
        try {
            const { key } = req.params;
            const params = { Bucket: 'sialab', Key: key };

            s3.deleteObject(params, function(err, data) {
                console.log(data);
                if (err) console.log(err, err.stack);
            });

            return res.status(200).json('Excluído com sucesso!');
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new OperadorPermController();
