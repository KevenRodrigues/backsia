import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class File extends Model {
    static init() {
        super.init(
            {
                name: Sequelize.STRING,
                path: Sequelize.STRING,
                url: {
                    type: Sequelize.VIRTUAL,
                    get() {
                        return `${process.env.APP_URL}/files/${this.path}`;
                    },
                },
            },
            {
                sequelize,
            }
        );

        return this;
    }
}
