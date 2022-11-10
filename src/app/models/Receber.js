import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Receber extends Model {
        static init() {
            super.init(
                {
                    datent: Sequelize.DATE,
                    sacado_id: Sequelize.INTEGER,
                    numerodoc: Sequelize.STRING,
                    valor: Sequelize.NUMBER,
                    previsao: Sequelize.NUMBER,
                    obs: Sequelize.STRING,
                    tippag: Sequelize.NUMBER,
                    datpag: Sequelize.DATE,
                    datrecbol: Sequelize.DATE,
                    vencimento: Sequelize.DATE,
                    status: Sequelize.STRING,
                    totdesc: Sequelize.NUMBER,
                    totjuros: Sequelize.NUMBER,
                    totpago: Sequelize.NUMBER,
                    nf_id: Sequelize.INTEGER,
                    totir: Sequelize.NUMBER,
                    totpis: Sequelize.NUMBER,
                    totcofins: Sequelize.NUMBER,
                    totcssl: Sequelize.NUMBER,
                    totpagoimp: Sequelize.NUMBER,
                    parcela: Sequelize.STRING,
                    nf: Sequelize.NUMBER,
                    nfgera: Sequelize.NUMBER,
                    boleto: Sequelize.NUMBER,
                    remessa: Sequelize.NUMBER,
                    retido: Sequelize.NUMBER,
                    empresa_id: Sequelize.INTEGER,
                    obsserv: Sequelize.STRING,
                    obsservprest: Sequelize.STRING,
                    endcob: Sequelize.STRING,
                    ac: Sequelize.STRING,
                    pracap: Sequelize.STRING,
                    despt: Sequelize.NUMBER,
                    iss: Sequelize.NUMBER,
                    inss: Sequelize.NUMBER,
                    aliqt: Sequelize.NUMBER,
                    totpagodespt: Sequelize.NUMBER,
                    totiss: Sequelize.NUMBER,
                    parcelamento_id: Sequelize.INTEGER,
                    comissao: Sequelize.NUMBER,
                    dtemissaonf: Sequelize.DATE,
                    operador_id: Sequelize.INTEGER,
                    convenio: Sequelize.NUMBER,
                    caixa_id: Sequelize.INTEGER,
                    lote: Sequelize.INTEGER,
                    datocorre: Sequelize.DATE,
                    datcredito: Sequelize.DATE,
                    receber_id_orig: Sequelize.INTEGER,
                    prorrogado: Sequelize.INTEGER,
                    valglosa: Sequelize.NUMBER,
                    valoriginal: Sequelize.NUMBER,
                    valrecebido: Sequelize.NUMBER,
                    docoriginal: Sequelize.INTEGER,
                    docvinculo: Sequelize.INTEGER,
                    perc_cartao_db: Sequelize.NUMBER,
                    valor_cartao_db: Sequelize.NUMBER,
                    perc_cartao_cr: Sequelize.NUMBER,
                    valor_cartao_cr: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    gera_bi: Sequelize.NUMBER,
                },
                {
                    sequelize,
                    modelName: 'Receber',
                    tableName: 'receber',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Convenio, {
                foreignKey: 'sacado_id',
                as: 'sacado',
            });
            this.belongsTo(models.Empresa, {
                foreignKey: 'empresa_id',
                as: 'empresa',
            });
            this.hasMany(models.Receber1, {
                foreignKey: 'receber_id',
                as: 'receber1',
            });
            this.hasMany(models.Receber2, {
                foreignKey: 'receber_id',
                as: 'receber2',
            });
        }
    };
