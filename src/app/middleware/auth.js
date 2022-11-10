import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import Database from '../../database';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res
            .status(401)
            .json({ error: 'Token nao enviado na chamada API.' });
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = await promisify(jwt.verify)(token, authConfig.secret);

        req.userId = decoded.id;
        req.userName = decoded.nome;
        req.database = decoded.database;

        const { Operador3 } = Database.getModels(req.database);
        const token_user = await Operador3.findOne({
            attributes: ['token_user'],
            where: { token_user: token, logado: true },
        });

        if (!token_user)
            return res
                .status(401)
                .json({ error: 'Houve um login em outro dispositivo' });

        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalido ou expirado.' });
    }
};
