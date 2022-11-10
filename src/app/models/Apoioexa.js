import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Apoioexa extends Model {
    static init() {
        super.init(
            {
                apoio_id: Sequelize.INTEGER,
                exame_id: Sequelize.INTEGER,
                valor: Sequelize.NUMBER,
                codlab: Sequelize.STRING,
                dias: Sequelize.NUMBER,
                conservante: Sequelize.STRING,
                obrigavol: Sequelize.NUMBER,
                obrigatemp: Sequelize.NUMBER,
                tuboesteri: Sequelize.NUMBER,
                materiala: Sequelize.STRING,
                materialdi: Sequelize.STRING,
                layout_id: Sequelize.INTEGER,
                descamo: Sequelize.STRING,
                obrigapeso: Sequelize.NUMBER,
                obrigaalt: Sequelize.NUMBER,
                obrigaleuco: Sequelize.NUMBER,
                obrigalinfo: Sequelize.NUMBER,
                tempodiurese: Sequelize.NUMBER,
                horadecoleta: Sequelize.NUMBER,
                usa_layout_alterna: Sequelize.NUMBER,
                importa_infadicional: Sequelize.NUMBER,
                importa_formatohp_diferente: Sequelize.NUMBER,
                importa_infadicional_resul: Sequelize.NUMBER,
                status: Sequelize.INTEGER,
                obrigaidade: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
                tira_unidade_resultados_somente_texto: Sequelize.NUMBER,
                alinha_resultado_texto_direita: Sequelize.NUMBER,
                teste_covid: Sequelize.NUMBER,
            },
            {
                sequelize,
                modelName: 'Apoioexa',
                tableName: 'apoioexm',
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

        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });

        this.belongsTo(models.Apoio, {
            foreignKey: 'id',
            as: 'apoio',
        });
    }
}
