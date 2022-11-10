import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Matmed extends Model {
    static init() {
        super.init(
            {
                descricao: Sequelize.STRING,
                preco: Sequelize.NUMBER,
                medicam: Sequelize.NUMBER,
                contraste: Sequelize.NUMBER,
                codtab: Sequelize.STRING,
                unidade: Sequelize.STRING,
                marca: Sequelize.STRING,
                simpro: Sequelize.STRING,
                brasind: Sequelize.STRING,
                precofra: Sequelize.NUMBER,
                qtdfra: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                tipo: Sequelize.NUMBER,
                tab: Sequelize.STRING,
                agrupamat: Sequelize.NUMBER,
                tab3: Sequelize.STRING,
                idopera_ultacao: Sequelize.INTEGER,
            },
            {
                sequelize,
                tableName: 'matmed',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.hasOne(models.Examematperm, {
            foreignKey: 'material_id',
            as: 'examematperm',
        });
    }
}
