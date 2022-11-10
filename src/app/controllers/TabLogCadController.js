import { QueryTypes } from 'sequelize';
import Database from '../../database';
import { PegaData, PegaHora, convertDate } from './functions/functions';

class TabLogCadController {
    async index(req, res) {
        try {
            const { TabLogCad, Operador } = Database.getModels(req.database);

            const tablogres = await TabLogCad.findAll({
                where: { tabela: req.query.tabela },
                include: [
                    { model: Operador, as: 'operador', attributes: ['nome'] },
                ],
                order: TabLogCad.sequelize.literal('id DESC'),
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!tablogres) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            tablogres.map(ope => {
                ope.acao ? (ope.acao = ope.acao.trim()) : null;
                ope.motivo ? (ope.motivo = ope.motivo.trim()) : null;
                ope.operador
                    ? (ope.operador.nome = ope.operador.nome.trim())
                    : null;
            });
            return res.status(200).json(tablogres);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async create(req, res){
        try {
            const { TabLogCad, Operador } = Database.getModels(req.database);

            const campo = 'dt_banco';
            const getParam = await Operador.sequelize
                .query(`select ${campo} from param, param2`, {
                    type: QueryTypes.SELECT,
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
            const { dt_banco } = getParam[0];

            const { id } = await TabLogCad.create({
                tabela: req.body.tabela,
                idreg: req.body.idreg,
                idopera: req.userId,
                acao: 'Exclusão do Registro: ' + req.body.nomereg,
                motivo: req.body.motivo,
                data: convertDate(await PegaData(req, dt_banco)),
                hora: await PegaHora(req, dt_banco),
                maquina: req.headers.host,
                tabelapai: req.body.tabelapai,
                idregpai: req.body.idregpai,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json({ id });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new TabLogCadController();
