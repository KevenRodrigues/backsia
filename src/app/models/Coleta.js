import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Coleta extends Model {
        static init() {
            super.init(
                {
                    // id: Sequelize.INTEGER,
                    data: Sequelize.DATE,
                    hora: Sequelize.STRING,
                    operador_id: Sequelize.INTEGER,
                    qtdtubos: Sequelize.INTEGER,
                    status: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Coleta',
                    tableName: 'coleta',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        // static associate(models) {
        //     this.belongsTo(models.Posto, {
        //         foreignKey: 'posto_id',
        //         as: 'Posto',
        //     });

        //     this.belongsTo(models.Apoio, {
        //         foreignKey: 'id',
        //         as: 'apoio',
        //     });
        // }
    };
