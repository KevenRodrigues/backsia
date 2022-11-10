import nodemailer from 'nodemailer';
import { resolve } from 'path';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';

class TesteMail {
    constructor(auth) {
        this.transporter = nodemailer.createTransport({
            name: auth.name,
            host: auth.host,
            port: parseInt(auth.port),
            secure: true, // upgrade later with STARTTLS
            auth: {
              user: auth.user,
              pass: auth.password
            }
        });

        this.configureTemplates();
    }

    configureTemplates() {
        const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails');

        this.transporter.use(
            'compile',
            nodemailerhbs({
                viewEngine: exphbs.create({
                    layoutsDir: resolve(viewPath, 'layouts'),
                    partialsDir: resolve(viewPath, 'partials'),
                    defaultLayout: 'default',
                    extname: '.hbs',
                }),
                viewPath,
                extName: '.hbs',
            })
        );
    }

    sendMail(data) {
        return this.transporter.sendMail(data);
    }
}

export default TesteMail;
