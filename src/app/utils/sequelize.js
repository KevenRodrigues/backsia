import Sequelize from 'sequelize';

function novaconexao(string) {
    const newconection = new Sequelize(string, {
        timezone: 'Etc/GMT+3',
    });

    return newconection;
}

export default novaconexao;
