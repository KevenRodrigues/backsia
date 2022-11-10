import { Op } from 'sequelize';
import Database from '../../database';

class MapaGradeController {
    async index(req, res) {
        const { MapaGrade, Exame } = Database.getModels(req.database);
        const { txtmapa_id, txtpaginicial, txtpagfinal } = req.query;

        const curmapa = await MapaGrade.findAll({
            where: {
                mapa_id: parseFloat(txtmapa_id),
                pag: {
                    [Op.between]: [
                        parseFloat(txtpaginicial),
                        parseFloat(txtpagfinal),
                    ],
                },
            },
            order: [['id', 'ASC']],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        const curexa = [];

        for (const item of curmapa) {
            // eslint-disable-next-line no-plusplus
            for (let i = 1; i < 41; i++) {
                const exa = `exa${i.toString().padStart(2, '0')}`;
                const codatu = item[exa];
                if (codatu && codatu.trim() !== '') {
                    const findExa = curexa.find(x => x.codigo === codatu);
                    if (!findExa) {
                        const curexame = await Exame.findOne({
                            where: { codigo: codatu.trim() },
                        }).catch(err => {
                            return res.status(400).json({ error: err.message });
                        });
                        curexa.push({
                            codigo: codatu,
                            descricao: curexame.descricao.trim(),
                            marca: true,
                        });
                    }
                } else {
                    break;
                }
            }
        }

        return res.status(200).json({ curexa, curmapa });
    }
}

export default new MapaGradeController();
