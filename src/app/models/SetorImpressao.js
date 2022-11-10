import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class SetorImpressao extends Model {
        static init() {
            super.init(
                {
                    descricao: Sequelize.STRING,
                    status: Sequelize.INTEGER,
                    maquina: Sequelize.STRING,
                    est: Sequelize.STRING,
                    posto: Sequelize.STRING,
                    lptcomp: Sequelize.STRING,
                    impcomp: Sequelize.NUMBER,
                    impcomprec: Sequelize.NUMBER,
                    viscomp: Sequelize.NUMBER,
                    matcomp: Sequelize.NUMBER,
                    lptloccomp: Sequelize.STRING,
                    lptlau: Sequelize.STRING,
                    implau: Sequelize.NUMBER,
                    vislau: Sequelize.NUMBER,
                    matlau: Sequelize.NUMBER,
                    lptloclau: Sequelize.STRING,
                    lptmap: Sequelize.STRING,
                    impmap: Sequelize.NUMBER,
                    vismap: Sequelize.NUMBER,
                    matmap: Sequelize.NUMBER,
                    lptlocmap: Sequelize.STRING,
                    impmaprec: Sequelize.NUMBER,
                    lptgra: Sequelize.STRING,
                    impgra: Sequelize.NUMBER,
                    visgra: Sequelize.NUMBER,
                    matgra: Sequelize.NUMBER,
                    lptlocgra: Sequelize.STRING,
                    posto_id: Sequelize.INTEGER,
                    conv_id: Sequelize.INTEGER,
                    plano_id: Sequelize.INTEGER,
                    envio_id: Sequelize.INTEGER,
                    entrega_id: Sequelize.INTEGER,
                    lptrecfat: Sequelize.STRING,
                    imprecfat: Sequelize.NUMBER,
                    visrecfat: Sequelize.NUMBER,
                    matrecfat: Sequelize.NUMBER,
                    lptlocrecfat: Sequelize.STRING,
                    lptetqlbx: Sequelize.STRING,
                    lptlocetq: Sequelize.STRING,
                    impetq: Sequelize.NUMBER,
                    visetq: Sequelize.NUMBER,
                    usaetqprg: Sequelize.NUMBER,
                    impetqrec: Sequelize.NUMBER,
                    impetqcol: Sequelize.NUMBER,
                    impetqtri: Sequelize.NUMBER,
                    impetqmat: Sequelize.NUMBER,
                    lptcomp2: Sequelize.STRING,
                    impcomp2: Sequelize.NUMBER,
                    viscomp2: Sequelize.NUMBER,
                    matcomp2: Sequelize.NUMBER,
                    lptloccom2: Sequelize.STRING,
                    rapido: Sequelize.NUMBER,
                    imppdf: Sequelize.NUMBER,
                    dirpdf: Sequelize.STRING,
                    imptiss: Sequelize.NUMBER,
                    vistiss: Sequelize.NUMBER,
                    lpttiss: Sequelize.STRING,
                    mattiss: Sequelize.NUMBER,
                    lptloctiss: Sequelize.STRING,
                    impetqtiss: Sequelize.NUMBER,
                    visetqtiss: Sequelize.NUMBER,
                    lptetqtiss: Sequelize.STRING,
                    matetqtiss: Sequelize.NUMBER,
                    lptlocetqtiss: Sequelize.STRING,
                    lanca_aten: Sequelize.NUMBER,
                    usa_spool: Sequelize.NUMBER,
                    guiche: Sequelize.NUMBER,
                    setorfila: Sequelize.INTEGER,
                    voz: Sequelize.INTEGER,
                    impetqcart: Sequelize.NUMBER,
                    visetqcart: Sequelize.NUMBER,
                    lptetqcart: Sequelize.STRING,
                    matetqcart: Sequelize.NUMBER,
                    lptlocetqcart: Sequelize.STRING,
                    restelalib: Sequelize.NUMBER,
                    imprps: Sequelize.NUMBER,
                    visrps: Sequelize.NUMBER,
                    matrps: Sequelize.NUMBER,
                    lptlocrps: Sequelize.STRING,
                    impcons: Sequelize.NUMBER,
                    viscons: Sequelize.NUMBER,
                    lptcons: Sequelize.STRING,
                    impcons_ap: Sequelize.NUMBER,
                    viscons_ap: Sequelize.NUMBER,
                    lptcons_ap: Sequelize.STRING,
                    impetq_sma: Sequelize.NUMBER,
                    lptetq_sma: Sequelize.STRING,
                    impetq_par: Sequelize.NUMBER,
                    lptetq_par: Sequelize.STRING,
                    impetq_alv: Sequelize.NUMBER,
                    lptetq_alv: Sequelize.STRING,
                    impetq_db: Sequelize.NUMBER,
                    lptetq_db: Sequelize.STRING,
                    impetq_mar: Sequelize.NUMBER,
                    lptetq_mar: Sequelize.STRING,
                    idopera_ultacao: Sequelize.INTEGER,
                    lptlocetqalvaro: Sequelize.STRING,
                    lptetqalvaro: Sequelize.STRING,
                    lptlocetqdb: Sequelize.STRING,
                    lptetqdb: Sequelize.STRING,
                    lptlocetqmaricondi: Sequelize.STRING,
                    lptetqmaricondi: Sequelize.STRING,
                    lptlocetqpardini: Sequelize.STRING,
                    lptetqpardini: Sequelize.STRING,
                    lptloccons: Sequelize.STRING,
                    lptloccons_ap: Sequelize.STRING,
                },
                {
                    sequelize,
                    modelName: 'SetorImpressao',
                    tableName: 'setorimpressao',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.hasMany(models.Operador3, {
                foreignKey: 'setorimpressao_id',
                as: 'operador3',
            });

            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
            this.belongsTo(models.Posto, { foreignKey: 'posto_id' });
            this.belongsTo(models.SetorFila, { foreignKey: 'setorfila' });
        }
    };
