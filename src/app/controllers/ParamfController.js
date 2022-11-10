import Database from '../../database';

class ParamfController {
    async index(req, res) {
        const { Paramf, Contas, Banco, Plcontas } = Database.getModels(
            req.database
        );
        try {
            const paramf = await Paramf.findAll({
                include: [
                    {
                        model: Contas,
                        as: 'bancodin',
                        attributes: ['banco_id'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                    {
                        model: Contas,
                        as: 'bancochv',
                        attributes: ['banco_id'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                    {
                        model: Contas,
                        as: 'bancochp',
                        attributes: ['banco_id'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                    {
                        model: Contas,
                        as: 'bancoctd',
                        attributes: ['banco_id'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                    {
                        model: Contas,
                        as: 'bancoctc',
                        attributes: ['banco_id'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                    {
                        model: Contas,
                        as: 'bancoout',
                        attributes: ['banco_id'],
                        include: [
                            {
                                model: Banco,
                                as: 'bancos',
                                attributes: ['descricao'],
                            },
                        ],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontasdin',
                        attributes: ['descricao'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontaschv',
                        attributes: ['descricao'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontaschp',
                        attributes: ['descricao'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontasctd',
                        attributes: ['descricao'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontasctc',
                        attributes: ['descricao'],
                    },
                    {
                        model: Plcontas,
                        as: 'plcontasout',
                        attributes: ['descricao'],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(paramf[0]);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const { Paramf } = Database.getModels(req.database);

            const getParamf = req.body;
            getParamf.idopera_ultacao = req.userId;

            await Paramf.update(getParamf, {
                where: { id: req.body.id },
                returning: true,
                plain: true,
            })
                .then(data => {
                    return res.status(200).json(data);
                })
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
        return null;
    }
}

export default new ParamfController();
