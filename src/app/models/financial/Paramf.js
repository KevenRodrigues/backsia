import Sequelize, { Model } from 'sequelize';

class Paramf extends Model {
  static init(sequelize) {
    super.init(
      {
        descirpag: Sequelize.NUMBER,
        descpispag: Sequelize.NUMBER,
        desccofinspag: Sequelize.NUMBER,
        desccsslpag: Sequelize.NUMBER,
        descisspag: Sequelize.NUMBER,
        descir: Sequelize.NUMBER,
        descpis: Sequelize.NUMBER,
        desccofins: Sequelize.NUMBER,
        desccssl: Sequelize.NUMBER,
        desciss: Sequelize.NUMBER,
        descemp: Sequelize.NUMBER,
        descinss: Sequelize.NUMBER,
        percir: Sequelize.NUMBER,
        percpis: Sequelize.NUMBER,
        perccofins: Sequelize.NUMBER,
        perccssl: Sequelize.NUMBER,
        perciss: Sequelize.NUMBER,
        percinss: Sequelize.NUMBER,
        percdarfs: Sequelize.NUMBER,
        focoaf: Sequelize.NUMBER,
        trazab: Sequelize.NUMBER,
        subimprec: Sequelize.NUMBER,
        datarecebe: Sequelize.NUMBER,
        verifdow: Sequelize.NUMBER,
        acumulorecimp: Sequelize.NUMBER,
        minimo: Sequelize.NUMBER,
        minimo1: Sequelize.NUMBER,
        sacado_id: Sequelize.INTEGER,
        fornec_id: Sequelize.INTEGER,
        cnpj: Sequelize.STRING,
        nexxera_key: Sequelize.INTEGER,
        nexxera_hash: Sequelize.STRING,
        url_teste_nexxera: Sequelize.TEXT,
        url_homologacao_nexxera: Sequelize.TEXT,
        url_producao_nexxera: Sequelize.TEXT,
        razao: Sequelize.STRING,
        ambiente: Sequelize.STRING,
        enotas_apikey: Sequelize.STRING,
        enotas_idempresa: Sequelize.STRING,
        endereco: Sequelize.STRING,
        bairro: Sequelize.STRING,
        uf: Sequelize.STRING,
        cidade: Sequelize.STRING,
        cep: Sequelize.STRING,
        tel: Sequelize.STRING,
        im: Sequelize.STRING,
        codserv: Sequelize.STRING,
        enotas_descricao_servico: Sequelize.TEXT,
        enotas_cnae: Sequelize.STRING,
        enotas_ambiente: Sequelize.STRING,
        responsavel: Sequelize.STRING,
        email: Sequelize.STRING,
        pasta_rps: Sequelize.STRING,
        libpag: Sequelize.NUMBER,
        atupg: Sequelize.NUMBER,
        focoemissao: Sequelize.NUMBER,
        trazrec: Sequelize.NUMBER,
        trazrecdt: Sequelize.NUMBER,
        trazrecdte: Sequelize.NUMBER,
        trazrem: Sequelize.NUMBER,
        gerap: Sequelize.NUMBER,
        exibenf: Sequelize.NUMBER,
        retdatocorre: Sequelize.NUMBER,
        filrec: Sequelize.NUMBER,
        impetqbol: Sequelize.NUMBER,
        emailbol: Sequelize.NUMBER,
        usaemp: Sequelize.NUMBER,
        focoemp: Sequelize.NUMBER,
        usaissemp: Sequelize.NUMBER,
        must: Sequelize.NUMBER,
        obsnf: Sequelize.NUMBER,
        cadsb: Sequelize.NUMBER,
        nfmanual: Sequelize.NUMBER,
        imphistbol: Sequelize.NUMBER,
        menulateral: Sequelize.NUMBER,
        somavalor: Sequelize.NUMBER,
        naousapainel: Sequelize.NUMBER,
        usadescdarf: Sequelize.NUMBER,
        ccustonf_id: Sequelize.NUMBER,
        ccustolc_id: Sequelize.NUMBER,
        plcontaslc_id: Sequelize.NUMBER,
        plcontasnf_id: Sequelize.NUMBER,
        percret: Sequelize.STRING,
        idopera_ultacao: Sequelize.INTEGER
      },
      {
        sequelize,
        modelName: 'Paramf',
        tableName: 'paramf',
        timestamps: false
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Sacado, {
      foreignKey: 'sacado_id',
      as: 'sacado'
    });
  }
}
export default Paramf;
