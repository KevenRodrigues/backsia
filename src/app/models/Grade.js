import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Grade extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    setor_id: Sequelize.INTEGER,
                    status: Sequelize.INTEGER,
                    modelo: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                    total: Sequelize.VIRTUAL,
                },
                {
                    sequelize,
                    modelName: 'Grade',
                    tableName: 'grade',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.hasMany(models.Gradeexa, {
                foreignKey: 'grade_id',
                as: 'gradeexa',
            });
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
            this.belongsTo(models.Setor, {
                foreignKey: 'setor_id',
                as: 'setor',
            });
        }
    };
