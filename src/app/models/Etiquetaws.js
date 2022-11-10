import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Etiquetaws extends Model {
        static init() {
            super.init(
                {
                    apoio_id: Sequelize.INTEGER,
                    loteapoio: Sequelize.STRING,
                    codapoio: Sequelize.STRING,
                    codbarras: Sequelize.STRING,
                    etiqueta: Sequelize.TEXT,
                    idopera_ultacao: Sequelize.INTEGER,
                    codbarras2: Sequelize.STRING,
                    etiqueta2: Sequelize.TEXT,
                    codbarras3: Sequelize.STRING,
                    etiqueta3: Sequelize.TEXT,
                    codbarras4: Sequelize.STRING,
                    etiqueta4: Sequelize.TEXT,
                    codbarras5: Sequelize.STRING,
                    etiqueta5: Sequelize.TEXT,
                    codbarras6: Sequelize.STRING,
                    etiqueta6: Sequelize.TEXT,
                },
                {
                    sequelize,
                    modelName: 'Etiquetaws',
                    tableName: 'etiquetaws',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Apoio, {
                foreignKey: 'apoio_id',
                as: 'apoio',
            });
        }
    };
