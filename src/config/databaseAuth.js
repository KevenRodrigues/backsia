require('dotenv/config');

module.exports = {
    dialect: 'postgres',
    host: process.env.DB_DOMINIO_HOST,
    username: process.env.DB_DOMINIO_USER,
    password: process.env.DB_DOMINIO_PASS,
    database: process.env.DB_DOMINIO_NAME,
    port: process.env.DB_DOMINIO_PORT,
    define: {
        timestamps: true,
        underscored: true,
        underscoredAll: true,
    },
};
