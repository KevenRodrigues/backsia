import Sequelize, { Model } from 'sequelize';

class Laboratorio extends Model {
    static init(sequelize) {
        super.init(
            {
                codigo: Sequelize.INTEGER,
                name: Sequelize.STRING,
                cnpj: Sequelize.STRING,
                color1: Sequelize.STRING,
                color2: Sequelize.STRING,
                color3: Sequelize.STRING,
                logo_url: Sequelize.STRING,
                logo_base64: Sequelize.TEXT,
                ativo: Sequelize.BOOLEAN,
                dominio: Sequelize.STRING,
                stringcon: Sequelize.STRING,
                email: Sequelize.STRING,
                powerbi: Sequelize.STRING,
                foxincloud: Sequelize.STRING,
                pagamento_key: Sequelize.STRING,
                pagamento_parcela_max: Sequelize.NUMBER,
                pagamento_parcela_sjuros: Sequelize.NUMBER,
                pagamento_juros: Sequelize.NUMBER,
            },
            {
                sequelize,
                modelName: 'Laboratorio',
                tableName: 'laboratorios',
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.Unidade, {
            foreignKey: 'laboratorio_id',
        });
    }
}

export default Laboratorio;
