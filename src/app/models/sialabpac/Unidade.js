import Sequelize, { Model } from 'sequelize';

class Unidade extends Model {
    static init(sequelize) {
        super.init(
            {
                laboratorio_id: Sequelize.INTEGER,
                matriz: Sequelize.BOOLEAN,
                posto: Sequelize.STRING,
                name: Sequelize.STRING,
                cep: Sequelize.STRING,
                endereco: Sequelize.STRING,
                numero: Sequelize.STRING,
                complemento: Sequelize.STRING,
                bairro: Sequelize.STRING,
                cidade: Sequelize.STRING,
                uf: Sequelize.STRING,
                telefone: Sequelize.STRING,
                horario: Sequelize.STRING,
                estacionamento: Sequelize.STRING,
            },
            {
                sequelize,
                modelName: 'Unidade',
                tableName: 'unidades',
            }
        );
        return this;
    }
}

export default Unidade;
