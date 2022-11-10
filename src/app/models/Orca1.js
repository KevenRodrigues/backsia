import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Orca1 extends Model {
    static init() {
        super.init(
            {
                orca_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                valpac: Sequelize.NUMBER,
                valconv: Sequelize.NUMBER,
                material_id: Sequelize.INTEGER,
                convenio_id: Sequelize.INTEGER,
                plano_id: Sequelize.INTEGER,
                medico_id: Sequelize.INTEGER,
                matric: Sequelize.STRING,
                totdescpac: Sequelize.NUMBER,
                qtdexame: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.NUMBER,
            },
            {
                sequelize,
                modelName: 'Orca1',
                tableName: 'orca1',
                timestamps: false,
            }
        );
        return this;
    }

    // associacao tabela exame
    static associate(models) {
        this.belongsTo(models.Exame, {
            foreignKey: 'exame_id',
            as: 'exame',
        });

        this.belongsTo(models.Material, {
            foreignKey: 'material_id',
            as: 'material',
        });

        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });

        this.belongsTo(models.Plano, {
            foreignKey: 'plano_id',
            as: 'plano',
        });

        this.belongsTo(models.Medico, {
            foreignKey: 'medico_id',
            as: 'medico',
        });

        this.belongsTo(models.Orca, {
            foreignKey: 'id',
            as: 'orca',
        });
    }
}
