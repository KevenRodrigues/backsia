import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Plano extends Model {
    static init() {
        super.init(
            {
                convenio_id: Sequelize.INTEGER,
                tabela_id: Sequelize.INTEGER,
                descricao: Sequelize.STRING,
                codigo: Sequelize.STRING,
                padrao: Sequelize.NUMBER,
                percpac: Sequelize.NUMBER,
                percconv: Sequelize.NUMBER,
                valch: Sequelize.NUMBER,
                obs: Sequelize.TEXT,
                status: Sequelize.INTEGER,
                usuario: Sequelize.STRING,
                valfilme: Sequelize.NUMBER,
                codfilme: Sequelize.NUMBER,
                motivo: Sequelize.TEXT,
                limite: Sequelize.NUMBER,
                mpercconv: Sequelize.NUMBER,
                mpercpac: Sequelize.NUMBER,
                fpercpac: Sequelize.NUMBER,
                fpercconv: Sequelize.NUMBER,
                autoriza: Sequelize.NUMBER,
                deparapla: Sequelize.STRING,
                valorauto: Sequelize.NUMBER,
                autori: Sequelize.NUMBER,
                ambobriga: Sequelize.NUMBER,
                descmat: Sequelize.NUMBER,
                codigofilm: Sequelize.STRING,
                tipotab: Sequelize.NUMBER,
                umexapormes: Sequelize.NUMBER,
                umexapormat: Sequelize.NUMBER,
                exibmattiss: Sequelize.NUMBER,
                valcopart: Sequelize.NUMBER,
                dtultger: Sequelize.DATE,
                operador_id_ultger: Sequelize.INTEGER,
                marca: Sequelize.NUMBER,
                dtultgerini: Sequelize.DATE,
                dtultgerfin: Sequelize.DATE,
                umexaporperiodo: Sequelize.NUMBER,
                diasexaage: Sequelize.NUMBER,
                banda_porte: Sequelize.NUMBER,
                banda_uco: Sequelize.NUMBER,
                valor_pacote: Sequelize.NUMBER,
                total_exames_realizados: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.NUMBER,
            },
            {
                sequelize,
                modelName: 'Plano',
                tableName: 'plano',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Convenio, {
            foreignKey: 'convenio_id',
            as: 'convenio',
        });
        this.belongsTo(models.Tabela, {
            foreignKey: 'tabela_id',
            as: 'tabela',
        });
        this.hasMany(models.Descoberto, {
            foreignKey: 'plano_id',
            as: 'descoberto',
        });
        this.hasMany(models.Valespec, {
            foreignKey: 'plano_id',
            as: 'valespec',
        });
        this.hasMany(models.Naofatura, {
            foreignKey: 'plano_id',
            as: 'naofatura',
        });
        this.hasMany(models.Limite, {
            foreignKey: 'plano_id',
        });
        this.hasMany(models.Planodes, {
            foreignKey: 'plano_id',
            as: 'planodes',
        });
        this.hasMany(models.Convenio_espec, {
            foreignKey: 'plano_id',
            as: 'convenio_espec',
        });
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
    }
}
