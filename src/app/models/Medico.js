import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Medico extends Model {
    static init() {
        super.init(
            {
                crm:Sequelize.STRING,
                nome_med:Sequelize.STRING,
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
                senha:Sequelize.STRING,
                uncp:Sequelize.STRING,
                cpf:Sequelize.STRING,
                bpacns:Sequelize.STRING,
                bpacbo:Sequelize.STRING,
                login:Sequelize.STRING,
                obs_med:Sequelize.STRING,
                chavesline:Sequelize.STRING,
                unimed:Sequelize.STRING,
                interno:Sequelize.NUMBER,
                enviawww:Sequelize.NUMBER,
                padrao:Sequelize.NUMBER,
                uncp_bak:Sequelize.NUMBER,
                status:Sequelize.INTEGER,
                espmed_id:Sequelize.INTEGER,
                datanasc:Sequelize.DATE,
                idopera_ultacao:Sequelize.INTEGER,
            },
            {
                sequelize,
                modelName: 'Medico',
                tableName: 'medico',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.hasMany(models.MedicoCod, {
            foreignKey: 'medico_id',
            as: 'medicocod',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.belongsTo(models.Espmed, { foreignKey: 'espmed_id', as: 'espmed' });
    }
}
