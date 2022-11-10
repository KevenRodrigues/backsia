import Sequelize, { Model } from 'sequelize';

class Sacado extends Model {
    static init(sequelize) {
        super.init(
            {
                razao: Sequelize.STRING,
                fantasia: Sequelize.STRING,
                endereco: Sequelize.STRING,
                bairro: Sequelize.STRING,
                cep: Sequelize.STRING,
                uf: Sequelize.STRING,
                cidade: Sequelize.STRING,
                fone: Sequelize.STRING,
                fax: Sequelize.STRING,
                email: Sequelize.STRING,
                contato: Sequelize.STRING,
                cgc_cpf: Sequelize.STRING,
                ie: Sequelize.STRING,
                obs: Sequelize.STRING,
                status: Sequelize.INTEGER,
                dias: Sequelize.VIRTUAL,
            },
            {
                modelName: 'Sacado',
                tableName: 'sacado',
                sequelize,
                timestamps: false,
            }
        );
        return this;
    }
}

export default Sacado;
