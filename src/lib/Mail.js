import nodemailer from 'nodemailer';
import { resolve } from 'path';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
import AWS from 'aws-sdk';
import mailConfig from '../config/mail';

class Mail {
    constructor() {
        const { host, port, secure, auth } = mailConfig;
        AWS.config.update({
            accessKeyId: auth.user,
            secretAccessKey: auth.pass,
            region: 'sa-east-1',
        });
        this.transporter = nodemailer.createTransport({
            SES: new AWS.SES({
                apiVersion: '2010-12-01',
            }),
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

    sendMail(message) {
        return this.transporter.sendMail({
            ...mailConfig.default,
            ...message,
        });
    }
}

export default new Mail();
