// import Sequelize from 'sequelize';
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import Laboratorio from '../models/sialabpac/Laboratorio';
import Database from '../../database';

class DominioController {
    async indexOne(req, res) {
        try {
            const { login, senha } = req.body;
            const database = req.body.dominio.toUpperCase();

            const dominioRes = await Laboratorio.findOne({
                where: Laboratorio.sequelize.where(
                    Laboratorio.sequelize.fn(
                        'upper',
                        Laboratorio.sequelize.col('dominio')
                    ),
                    Laboratorio.sequelize.fn('upper', database)
                ),
                attributes: [
                    'id',
                    'dominio',
                    'stringcon',
                    'codigo',
                    'color1',
                    'color2',
                    'color3',
                    'logo_url',
                    'logo_base64',
                    'foxincloud',
                ],
            });

            if (!dominioRes) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum Dominio encontrado' });
            }

            const Models = Database.getModels(database);

            const { Operador, Operador3, SetorImpressao } = Models;

            const operadorRes = await Operador.findOne({
                where: Operador.sequelize.where(
                    Operador.sequelize.fn(
                        'upper',
                        Operador.sequelize.col('nome')
                    ),
                    Operador.sequelize.fn('upper', login)
                ),
                attributes: ['id', 'nome', 'senope', 'status'],
                include: [
                    {
                        model: Operador3,
                        as: 'operador3',
                        attributes: [
                            'setorimpressao_id',
                            'token_user',
                            'logado',
                        ],
                        include: [
                            {
                                model: SetorImpressao,
                                as: 'setorimpressao',
                                attributes: ['descricao', 'maquina'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!operadorRes) {
                return res.status(400).json({
                    error:
                        'Nenhum usuario encontrado, verifique o nome do usuario.',
                });
            }

            operadorRes.nome = operadorRes.nome.trim();
            operadorRes.senope = operadorRes.senope.trim();
            const { id, nome, senope, status } = operadorRes;

            if (status !== 0) {
                return res.status(400).json({
                    error:
                        'Usuario com status diferente de ativo, entre em contato com o administrador do sistema.',
                });
            }

            if (senope !== senha) {
                return res.status(400).json({
                    error:
                        'Senha digitada esta incorreta, verifique a senha digitada',
                });
            }
            operadorRes.senope = global.Buffer.from(
                operadorRes.senope
            ).toString('base64');

            const sen_ope = operadorRes.senope;

            const token_user = jwt.sign(
                { id, nome, sen_ope, database },
                authConfig.secret,
                {
                    expiresIn: authConfig.expiresIn,
                }
            );
            const operador3 = await Operador3.findOne({
                atribbutes: ['id', 'token_user', 'logado'],
                where: { operador_id: operadorRes.id },
            });
            operador3.token_user = token_user;
            operador3.logado = true;
            await operador3.save();

            return res.status(200).json({
                foxincloud: dominioRes ? dominioRes.foxincloud : null,
                color1: dominioRes ? dominioRes.color1 : null,
                color2: dominioRes ? dominioRes.color2 : null,
                color3: dominioRes ? dominioRes.color3 : null,
                lablogo: dominioRes ? dominioRes.logo_url : null,
                lablogobase64: dominioRes ? dominioRes.logo_base64 : null,
                operadorRes,
                laboratorio_sia_id: dominioRes ? dominioRes.codigo : null,
                token: token_user,
            });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new DominioController();
