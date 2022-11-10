import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class EnvioDocumento {
    get key() {
        return 'EnvioDocumento'
    }

    async handle({ data }) {
        const {
            email,
            nome,
            razao,
            postoAmostra,
            pdf,
            nomeDocumento,
            emailCliente,
            tipoDocumento
        } = data;

        await Mail.sendMail({
            to: email,
            cc: emailCliente, // 'administrativo@softeasy.com.br',
            subject: `${razao} | ${nomeDocumento}`, // `Softeasy Tecnologia | Proposta`,
            template: 'envioDocumento',
            context: {
              email,
              nome,
              razao,
              postoAmostra,
            },
            attachments: [
              {
                filename: `${tipoDocumento}_${format(new Date(), 'dd-MM-yyyy', { locale: pt })}_${nome}.pdf`,
                content: `${pdf}`,
                encoding: 'base64'
              }
            ]
          });
    }
}

export default new EnvioDocumento();
