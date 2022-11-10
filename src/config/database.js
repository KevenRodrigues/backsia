require('dotenv/config');

module.exports = {
    dialect: 'postgres',
    host: process.env.DB_SIA_HOST,
    username: process.env.DB_SIA_USER,
    password: process.env.DB_SIA_PASS,
    database: process.env.DB_SIA_NAME,
    port: process.env.DB_SIA_PORT,
    define: {
        timestamps: true,
        underscored: true,
        underscoredAll: true,
    },
};
