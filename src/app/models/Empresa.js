import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Empresa extends Model {
    static init() {
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
                ibge: Sequelize.STRING,
                cnes: Sequelize.STRING,
                registro: Sequelize.STRING,
                crm: Sequelize.STRING,
                status: Sequelize.INTEGER,
                logra: Sequelize.STRING,
                issr: Sequelize.NUMBER,
                responsavel: Sequelize.STRING,
                cbos: Sequelize.STRING,
                numero: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Empresa',
                tableName: 'empresa',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Empresaconv, {
            foreignKey: 'empresa_id',
            as: 'empresaconv',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
