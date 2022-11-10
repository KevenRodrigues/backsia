import Mail from '../../lib/Mail';

class PreparoExameMail {
    get key() {
        return 'PreparoExameMail';
    }

    async handle({ data }) {
        const {
            username,
            email,
            preagendado_id,
            orcamento_id,
            examesValues,
            layoutValues,
            paramsLab,
        } = data;

        await Mail.sendMail({
            to: `${username} <${email}>`,
            subject: `Preparo dos Exames do Agendamento ${preagendado_id}`,
            template: 'preparoExame',
            context: {
                username,
                logo: layoutValues.logo_url,
                preagendado_id,
                orcamento_id,
                exames: examesValues,
                primary: layoutValues.color1,
                secondary: layoutValues.color2,
                tertiary: layoutValues.color3,
                urlLab: paramsLab.site_laboratorio,
                infoLab: paramsLab.informacoes_extras,
            },
        });
    }
}

export default new PreparoExameMail();
