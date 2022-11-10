import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class MedicoRea_Repasse extends Model {
        static init() {
            super.init(
                {
                    medicorea_id: Sequelize.INTEGER,
                    setor_id: Sequelize.INTEGER,
                    percpac_repas: Sequelize.NUMBER,
                    percconv_repas: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    exame_id: Sequelize.INTEGER,
                    valpac_repas: Sequelize.NUMBER,
                    convenio_id: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'MedicoRea_Repasse',
                    tableName: 'medicorea_repasse',
                    timestamps: false,
                }
            );
            return this;
        }

        // associacao tabela exame
        static associate(models) {
            this.belongsTo(models.Setor, {
                foreignKey: 'setor_id',
                as: 'setor',
            });
            this.belongsTo(models.Convenio, {
                foreignKey: 'convenio_id',
                as: 'convenio',
            });
            this.belongsTo(models.Exame, {
                foreignKey: 'exame_id',
                as: 'exame',
            });
            this.belongsTo(models.MedicoRea, {
                foreignKey: 'id',
                as: 'medicorea',
            });
        }
    };
