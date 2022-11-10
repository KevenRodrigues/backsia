import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Pagar extends Model {
        static init() {
            super.init(
                {
                    datent: Sequelize.DATE,
                    fornec_id: Sequelize.SMALLINT,
                    numerodoc: Sequelize.STRING,
                    valor: Sequelize.NUMBER,
                    previsao: Sequelize.NUMBER,
                    obs: Sequelize.STRING,
                    datpag: Sequelize.DATE,
                    datrecbol: Sequelize.DATE,
                    vencimento: Sequelize.DATE,
                    status: Sequelize.STRING,
                    totdesc: Sequelize.NUMBER,
                    totjuros: Sequelize.NUMBER,
                    totpago: Sequelize.NUMBER,
                    lancacompra_id: Sequelize.SMALLINT,
                    parcela: Sequelize.STRING,
                    empresa_id: Sequelize.SMALLINT,
                    naopaga: Sequelize.NUMBER,
                    cheque: Sequelize.NUMBER,
                    cq: Sequelize.NUMBER,
                    parcelamento_id: Sequelize.SMALLINT,
                    operador_id: Sequelize.SMALLINT,
                    totir: Sequelize.NUMBER,
                    totpis: Sequelize.NUMBER,
                    totcofins: Sequelize.NUMBER,
                    totcssl: Sequelize.NUMBER,
                    totiss: Sequelize.NUMBER,
                    retido: Sequelize.NUMBER,
                    dtemissaonf: Sequelize.DATE,
                    pagar_id_orig: Sequelize.INTEGER,
                    prorrogado: Sequelize.INTEGER,
                    tippag: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                },
                {
                    sequelize,
                    modelName: 'Pagar',
                    tableName: 'pagar',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Fornecedor, {
                foreignKey: 'fornec_id',
                as: 'fornecedor',
            });
            this.belongsTo(models.Empresa, {
                foreignKey: 'empresa_id',
                as: 'empresa',
            });
            this.hasMany(models.Pagar1, {
                foreignKey: 'pagar_id',
                as: 'pagar1',
            });
            this.hasMany(models.Pagar2, {
                foreignKey: 'pagar_id',
                as: 'pagar2',
            });
        }
    };
