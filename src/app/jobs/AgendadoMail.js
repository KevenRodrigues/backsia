import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class AgendadoMail {
    get key() {
        return 'AgendadoMail';
    }

    async handle({ data }) {
        const {
            username,
            email,
            date,
            datacoleta,
            preagendado_id,
            orcamento_id,
        } = data;

        await Mail.sendMail({
            to: `${username} <${email}>`,
            subject: 'Novo Agendamento criado',
            template: 'agendado',
            context: {
                username,
                datacoleta: format(parseISO(datacoleta), "dd 'de' MMMM", {
                    locale: pt,
                }),
                preagendado_id,
                orcamento_id,
                date: format(
                    parseISO(date),
                    "'dia' dd 'de' MMMM' , as' H:mm'h'",
                    { locale: pt }
                ),
            },
        });
    }
}

export default new AgendadoMail();
