import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Orca extends Model {
        static init() {
            super.init(
                {
                    nome: Sequelize.STRING,
                    idade: Sequelize.STRING,
                    fone: Sequelize.STRING,
                    sexo: Sequelize.STRING,
                    desconto: Sequelize.NUMBER,
                    acrescimo: Sequelize.NUMBER,
                    totpac: Sequelize.NUMBER,
                    totconv: Sequelize.NUMBER,
                    status: Sequelize.INTEGER,
                    obs: Sequelize.STRING,
                    descperc: Sequelize.NUMBER,
                    prontuario_id: Sequelize.INTEGER,
                    statusorc: Sequelize.STRING,
                    dataorc: Sequelize.DATE,
                    posto_movpac: Sequelize.STRING,
                    amostra_movpac: Sequelize.STRING,
                    hora_age: Sequelize.STRING,
                    data_age: Sequelize.DATE,
                    perimetro: Sequelize.TEXT,
                    agenda_col_dom: Sequelize.NUMBER,
                    net: Sequelize.STRING,
                    agenda: Sequelize.NUMBER,
                    operador_id: Sequelize.INTEGER,
                    obs_age: Sequelize.TEXT,
                    idopera_ultacao: Sequelize.NUMBER,
                    preagendado_id: Sequelize.INTEGER,
                    total: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    modelName: 'Orca',
                    tableName: 'orca',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.hasMany(models.Orca1, {
                foreignKey: 'orca_id',
                as: 'orca1',
            });
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
            this.belongsTo(models.Prontuario, {
                foreignKey: 'prontuario_id',
                as: 'prontuario',
            });
        }
    };
