import Sequelize, { Model } from 'sequelize';

class Saccontra extends Model {
  static init(sequelize) {
    super.init(
      {
        sistema: Sequelize.STRING,
        terminais: Sequelize.NUMBER,
        parcelas: Sequelize.NUMBER,
        total: Sequelize.NUMBER,
        vencimento: Sequelize.DATEONLY,
        emissao: Sequelize.DATEONLY,
        vencmanut: Sequelize.DATEONLY,
        sacado_id: Sequelize.INTEGER,
        obs: Sequelize.STRING,
        totalmanut: Sequelize.NUMBER,
        vlunitta: Sequelize.NUMBER,
        vlacresta: Sequelize.NUMBER,
        vlmanutold: Sequelize.NUMBER,
        ta: Sequelize.NUMBER,
        proposta_id: Sequelize.INTEGER,
        aceitepro: Sequelize.TEXT,
        contrato: Sequelize.TEXT,
        tafec: Sequelize.NUMBER,
        isento: Sequelize.NUMBER,
        idopera_ultacao: Sequelize.INTEGER
      },
      {
        sequelize,
        tableName: 'saccontra',
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

export default Saccontra;
