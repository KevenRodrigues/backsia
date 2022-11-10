import User from '../models/sialabpac/User';
import Notification from '../schemas/notification';
import Preagendado from '../models/sialabpac/Preagendado';
import OneSignal from '../Push/OneSignal';

class NotificationController {
    async index(req, res) {
        try {
            const checkIsProvider = await User.findOne({
                where: { id: req.userId, provider: true },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!checkIsProvider) {
                return res.status(400).json({
                    error: 'Somente o provedor pode carregar notifica��es',
                });
            }

            const notifications = await Notification.find({
                user: req.userId,
            })
                .sort({ createdAt: 'desc' })
                .limit(20)
                .catch(err => {
                    return res.status(400).json({ error: err.message });
                });

            return res.status(200).json(notifications);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async update(req, res) {
        try {
            const notification = await Notification.findByIdAndUpdate(
                req.params.id,
                { read: true },
                { new: true }
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(notification);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async createpush(req, res) {
        try {
            const preagendados = await Preagendado.findByPk(
                req.params.preagendado_id,
                {
                    attributes: ['id', 'user_id'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: [
                                'id',
                                'name',
                                'email',
                                'onesignal_app_id',
                                'onesignal_player_id',
                                'celular',
                            ],
                        },
                    ],
                }
            ).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            const onesiignal = OneSignal;
            onesiignal.sendNotification({
                app_id: preagendados.user.onesignal_app_id,
                contents: {
                    en: `Acesse a pre-agenda numero: ${preagendados.id} e veja o preparo do(s) exame(s) e os valores.`,
                },
                include_player_ids: [preagendados.user.onesignal_player_id],
            });

            return res.status(200).json('push enviado');
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new NotificationController();
