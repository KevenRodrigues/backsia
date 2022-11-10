import Agendadoexm from '../../models/sialabpac/Agendadoexm';
import Agendado from '../../models/sialabpac/Agendado';
import User from '../../models/sialabpac/User';
import Unidade from '../../models/sialabpac/Unidade';
import Laboratorio from '../../models/sialabpac/Laboratorio';

class AgendadoexmController {
    async index(req, res) {
        try {
            const agendados = await Agendado.findByPk(req.params.id, {
                order: [['created_at', 'DESC']],
                attributes: [
                    'id',
                    'user_id',
                    'orcamento_id',
                    'datacoleta',
                    [Agendado.sequelize.literal('count(*) OVER ()'), 'total'],
                ],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: [
                            'name',
                            'email',
                            'cpf',
                            'data_nasc',
                            'sexo',
                            'celular',
                            'fixo',
                            'cep',
                            'logradouro',
                            'numero',
                            'complemento',
                            'bairro',
                            'cidade',
                        ],
                    },
                    {
                        model: Laboratorio,
                        as: 'laboratorio',
                        attributes: ['codigo', 'name'],
                    },
                    {
                        model: Unidade,
                        as: 'unidade',
                        attributes: [
                            'posto',
                            'name',
                            'endereco',
                            'numero',
                            'complemento',
                            'bairro',
                            'cidade',
                            'uf',
                        ],
                    },
                ],
            });
            return res.status(200).json(agendados);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexExames(req, res) {
        try {
            const exames = await Agendadoexm.findAll({
                where: { agendado_id: req.params.id },
                as: 'agendadoexm',
                attributes: ['nomeexm', 'preparoexm'],
            });
            return res.json(exames);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new AgendadoexmController();
