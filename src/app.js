import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import Youch from 'youch';
import * as Sentry from '@sentry/node';
import 'express-async-errors';
import routes from './routes';
import sentryConfig from './config/sentry';

import './database';

class App {
    constructor() {
        this.server = express();

        // cors
        this.server.use(
            cors({
                exposedHeaders: ['Content-Range', 'X-Content-Range'],
            })
        );

        Sentry.init(sentryConfig);

        this.middlewares();
        this.routes();
        this.exceptionHandler();
    }

    middlewares() {
        this.server.use(Sentry.Handlers.requestHandler());
        this.server.use(express.json({ limit: '50mb' }));
        this.server.use(
            '/files',
            express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
        );
    }

    routes() {
        this.server.use(routes);
        this.server.use(Sentry.Handlers.errorHandler());
    }

    exceptionHandler() {
        this.server.use(async (err, req, res, next) => {
            if (process.env.NOME_ENV === 'development') {
                const erros = await new Youch(err, req).toJSON();

                return res.status(500).json(erros);
            }

            return res.status(500).json({ error: 'Internal server error.' });
        });
    }
}

export default new App().server;
