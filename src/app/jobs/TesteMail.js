import TesteMailClass from '../../lib/TesteMail';

class TesteMail {
    get key() {
        return 'TesteMail';
    }

    async handle({ data }) {
        
        const { fromName, fromEmail, toEmail, assunto, authSMTP } = data;

        const mail = new TesteMailClass({name: fromEmail, ...authSMTP});

        await mail.sendMail({
            from: `${fromName} <${fromEmail}>`,
            to: `<${toEmail}>`,
            subject: assunto,
            template: 'testeEmail'
        });
    }
}

export default new TesteMail();
