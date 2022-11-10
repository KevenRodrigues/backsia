import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class MedicoRea extends Model {
    static init() {
        super.init(
            {
                crm:Sequelize.STRING,
                nome_medrea:Sequelize.STRING,
                status:Sequelize.INTEGER,
                fone1:Sequelize.STRING,
                fone2:Sequelize.STRING,
                fone3:Sequelize.STRING,
                celular:Sequelize.STRING,
                email:Sequelize.STRING,
                abrev:Sequelize.STRING,
                ufcrm:Sequelize.STRING,
                endereco:Sequelize.STRING,
                bairro:Sequelize.STRING,
                cep:Sequelize.STRING,
                cidade:Sequelize.STRING,
                uf:Sequelize.STRING,
                interno:Sequelize.NUMBER,
                senha:Sequelize.STRING,
                enviawww:Sequelize.NUMBER,
                padrao:Sequelize.NUMBER,
                chavesline:Sequelize.STRING,
                uncp_bak:Sequelize.STRING,
                cpf:Sequelize.STRING,
                espmed_id:Sequelize.INTEGER,
                datanasc:Sequelize.DATE,
                idopera_ultacao:Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'MedicoRea',
                tableName: 'medicorea',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.MedicoRea_Repasse, {
            foreignKey: 'medicorea_id',
            as: 'medicorea_repasse',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.belongsTo(models.Espmed, { foreignKey: 'espmed_id', as: 'espmed' });
    }
}
