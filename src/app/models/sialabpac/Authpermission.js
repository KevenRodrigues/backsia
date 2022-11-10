import Sequelize, { Model } from 'sequelize';

class Authpermission extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: Sequelize.INTEGER,
                cliente_id: Sequelize.INTEGER,
                prontuario: Sequelize.STRING,
                senhawebpro: Sequelize.STRING,
                prontuarioid: Sequelize.INTEGER,
            },
            {
                sequelize,
                freezeTableName: true,
                modelName: 'permissions',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'user_id',
        });
    }
}

export default Authpermission;
