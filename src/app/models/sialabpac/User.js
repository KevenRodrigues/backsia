import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
    static init(sequelize) {
        super.init(
            {
                name: Sequelize.STRING,
                email: Sequelize.STRING,
                password: Sequelize.VIRTUAL,
                password_match: Sequelize.VIRTUAL,
                password_hash: Sequelize.STRING,
                admin_user: Sequelize.BOOLEAN,
                super_user: Sequelize.BOOLEAN,
                cpf: Sequelize.STRING,
                onesignal_app_id: Sequelize.STRING,
                onesignal_player_id: Sequelize.STRING,
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

    checkPassword(password) {
        return bcrypt.compare(password, this.password_hash);
    }
}

export default User;
