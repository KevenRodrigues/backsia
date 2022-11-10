import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Prontuario extends Model {
        static init() {
            super.init(
                {
                    // os campos comentados aparentemente fazem parte da aplicão easyclinic
                    prontuario: Sequelize.STRING,
                    envio_id: Sequelize.INTEGER,
                    entrega_id: Sequelize.INTEGER,
                    medico_id: Sequelize.INTEGER,
                    convenio_id: Sequelize.INTEGER,
                    plano_id: Sequelize.INTEGER,
                    operador_id: Sequelize.INTEGER,
                    posto: Sequelize.STRING,
                    nome: Sequelize.STRING,
                    sexo: Sequelize.STRING,
                    obs: Sequelize.STRING,
                    data_nasc: Sequelize.DATE,
                    rg: Sequelize.STRING,
                    endereco: Sequelize.STRING,
                    cidade: Sequelize.STRING,
                    uf: Sequelize.STRING,
                    cep: Sequelize.STRING,
                    bairro: Sequelize.STRING,
                    cor: Sequelize.STRING,
                    gruposang: Sequelize.STRING,
                    fatorrh: Sequelize.STRING,
                    matric: Sequelize.STRING,
                    ddd1: Sequelize.STRING,
                    ddd2: Sequelize.STRING,
                    fone1: Sequelize.STRING,
                    fone2: Sequelize.STRING,
                    email: Sequelize.STRING,
                    qtd: Sequelize.NUMBER,
                    cpf: Sequelize.STRING,
                    estadocivi: Sequelize.STRING,
                    valplano: Sequelize.DATE,
                    status: Sequelize.INTEGER,
                    idopera_ultacao: Sequelize.NUMBER,
                    empresa: Sequelize.STRING,
                    fotopac_url: Sequelize.STRING,
                    fotopac_key: Sequelize.STRING,
                    nome_pai: Sequelize.STRING,
                    nome_mae: Sequelize.STRING,
                    bpaibge: Sequelize.STRING,
                    titular: Sequelize.STRING,
                    cns: Sequelize.STRING,
                    cid_id: Sequelize.INTEGER,
                    numero: Sequelize.STRING,
                    compl: Sequelize.STRING,
                    rn: Sequelize.NUMBER,
                    senhawebpro: Sequelize.STRING,
                    rg_dtexp: Sequelize.DATE,
                    nis_pis: Sequelize.STRING,
                    nome_social: Sequelize.STRING,
                    tipoident: Sequelize.STRING,
                    identificadorbenef: Sequelize.STRING,
                    templatebiometrico: Sequelize.STRING,
                    profissao: Sequelize.STRING,
                    siaweb: Sequelize.NUMBER,
                    incluir: Sequelize.VIRTUAL,
                    alterar: Sequelize.VIRTUAL,
                    deletar: Sequelize.VIRTUAL,
                    consultar: Sequelize.VIRTUAL,
                    //  du: Sequelize.STRING,
                    //	usuario: Sequelize.STRING,
                    //	peso: SEquelize.NUMBER,
                    //	altura:Sequelize.NUMBER,

                    //	tipodoc: Sequelize.STRING,
                    //	documento:Sequelize.STRING,
                    //	estcivil: Sequelize.STRING,
                    //	nfilhos: Sequelize.NUMBER,
                    //	controle:Sequelize.STRING,
                    //  obspro: Sequelize.TEXT,
                    //	cod: Sequelize.STIRNG,
                    //	fumante: Sequelize.NUMBER,
                    //	ddd1: Sequelize.STRING,
                    //	ddd2: Sequelize.STRING,
                    //	gestacao: Sequelize.STRING,
                    //	duracao: Sequelize.NUMBER,
                    //	parto: Sequelize.NUMBER,
                    //	apgar_1:Sequelize.NUMBER,
                    //	apgar_5:Sequelize.NUMBER,
                    //	apgar_10:Sequelize.NUMBER,
                    //	peso_nasc: Sequelize.NUMBER,
                    //	altura_nasc: Sequelize.NUMBER,
                    //	pc: Sequelize.NUMBER,
                    //	pt: Sequelize.NUMBER,
                    //	peso_sair:Sequelize.NUMBER,
                    //	obs_nasc: Sequelize.STRING,
                    //	diasates:Sequelize.STRING,
                    //	laudoinss:Sequelize.STRING,
                    //	senha: Sequelize.INTEGER,
                    //	horachegada: Sequelize.STRING,
                    //	horasaida:Sequelize.STRING,
                },
                {
                    sequelize,
                    modelName: 'Prontuario',
                    tableName: 'prontuario',
                    timestamps: false,
                }
            );
            return this;
        }

        static associate(models) {
            this.belongsTo(models.Motina, {
                foreignKey: 'status',
                as: 'motina',
            });
            this.belongsTo(models.Envio, {
                foreignKey: 'envio_id',
                as: 'envio',
            });
            this.belongsTo(models.Entrega, {
                foreignKey: 'entrega_id',
                as: 'entrega',
            });
            this.belongsTo(models.Posto, {
                targetKey: 'codigo',
                foreignKey: 'posto',
            });
            this.belongsTo(models.Convenio, {
                foreignKey: 'convenio_id',
                as: 'convenio',
            });
            this.belongsTo(models.Plano, {
                foreignKey: 'plano_id',
                as: 'plano',
            });
            this.belongsTo(models.Medico, {
                foreignKey: 'medico_id',
                as: 'medico',
            });
            this.belongsTo(models.Operador, {
                foreignKey: 'operador_id',
                as: 'operador',
            });
            this.belongsTo(models.Cid, { foreignKey: 'cid_id', as: 'cid' });
        }
    };
