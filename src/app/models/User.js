import Sequelize, { Model } from 'sequelize';

import bcrypt from 'bcryptjs';

export default (sequelize) => class User extends Model {
    static init() {
        super.init(
            {
                name: Sequelize.STRING,
                email: Sequelize.STRING,
                password: Sequelize.VIRTUAL,
                password_hash: Sequelize.STRING,
                provider: Sequelize.BOOLEAN,
            },
            {
                sequelize,
            }
        );

        this.addHook('beforeSave', async user => {
            if (user.password) {
                user.password_hash = await bcrypt.hash(user.password, 8);
            }
        });

        return this;
    }

    static associate(models) {
        this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
    }

    checkPassword(password) {
        // /console.log(password);
        // console.log(this.password_hash);
        // console.log(bcrypt.hashSync(this.password_hash, 8));
        return bcrypt.compare(password, this.password_hash);
    }
}