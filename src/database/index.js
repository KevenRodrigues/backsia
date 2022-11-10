import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

import Laboratorio from '../app/models/sialabpac/Laboratorio';
import Unidade from '../app/models/sialabpac/Unidade';
import User from '../app/models/sialabpac/User';
import PedidosMedico from '../app/models/sialabpac/PedidosMedico';
import Agendado from '../app/models/sialabpac/Agendado';
import Agendadoexm from '../app/models/sialabpac/Agendadoexm';
import Preagendado from '../app/models/sialabpac/Preagendado';
import AuthPermission from '../app/models/sialabpac/Authpermission';
import Notificacaos from '../app/models/sialabpac/Notificacaos';
import Pagarme from '../app/models/sialabpac/Pagarme';
import Dominio from '../app/models/Dominio';

import AuthConfig from '../config/databaseAuth';
import UserConfig from '../config/databaseUser';
import financialConfig from '../config/financial';
import Sacado from '../app/models/financial/Sacado';
import Saccontra from '../app/models/financial/Saccontra';
import Receber from '../app/models/financial/Receber';
import Paramf from '../app/models/financial/Paramf';

const basename = path.basename(module.filename);

const modelsUser = [
    Laboratorio,
    Unidade,
    User,
    PedidosMedico,
    Agendado,
    Agendadoexm,
    Preagendado,
    Notificacaos,
    Pagarme,
    AuthPermission,
];
const modelsAuth = [Dominio];
// Teste vers�o
const modelsfinancial = [Sacado, Saccontra, Receber, Paramf];

class Database {
    constructor() {
        this.init();
        // this.mongo();
    }

    async init() {
        this.conectionUser = new Sequelize(UserConfig);

        modelsUser
            .map(model => {
                return model.init(this.conectionUser);
            })
            .map(
                model =>
                    model.associate &&
                    model.associate(this.conectionUser.models)
            );

        this.financialconnection = new Sequelize(financialConfig);

        modelsfinancial
            .map(model => {
                return model.init(this.financialconnection);
            })
            .map(
                model =>
                    model.associate &&
                    model.associate(this.financialconnection.models)
            );

        this.conectionAuth = new Sequelize(AuthConfig);

        modelsAuth
            .map(model => {
                return model(this.conectionAuth).init();
            })
            .map(
                model =>
                    model.associate &&
                    model.associate(this.conectionAuth.models)
            );

        const dominiosRes = await Laboratorio.findAll({
            attributes: [
                'id',
                'dominio',
                'stringcon',
                'codigo',
                'color1',
                'color2',
                'color3',
                'logo_url',
                'logo_base64',
                'foxincloud',
            ],
        });

        const db = {};
        dominiosRes.map(dominio => {
            const databaseName = dominio.dominio.toUpperCase();
            db[databaseName] = new Sequelize(dominio.stringcon);
        });

        const modelsDirectory = `${path.dirname(__dirname)}/app/models/`;
        const databases = Object.keys(db);
        let count = 1;
        databases.map(database => {
            const models = Object.assign(
                {},
                ...fs
                    .readdirSync(modelsDirectory)
                    .filter(
                        file =>
                            file.indexOf('.') !== 0 &&
                            file !== basename &&
                            file.slice(-3) === '.js'
                    )
                    .map(function(file) {
                        const modelname = file.replace('.js', '');
                        const model = require(path.join(modelsDirectory + file))
                            .default;
                        return {
                            [modelname]: model(db[database], count).init(),
                        };
                    })
            );

            for (const model of Object.keys(models)) {
                typeof models[model].associate === 'function' &&
                    models[model].associate(models);
            }

            models.sequelize = db[database];
            count++;
        });

        this.instances = db;
    }

    getModels(dominio) {
        return this.instances[dominio].models;
    }

    mongo() {
        this.mongo.conection = mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useFindAndModify: true,
            useUnifiedTopology: true,
        });
    }
}

export default new Database();
