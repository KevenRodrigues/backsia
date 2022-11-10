import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Operador3 extends Model {
        static init() {
            super.init(
                {
                    operador_id: Sequelize.INTEGER,
                    conffat_atend: Sequelize.NUMBER,
                    geren_lotefat: Sequelize.NUMBER,
                    conffat_confere_guia: Sequelize.NUMBER,
                    conffat_desconfere_guia: Sequelize.NUMBER,
                    geren_lotefat_fechalote: Sequelize.NUMBER,
                    geren_lotefat_reabrelote: Sequelize.NUMBER,
                    nao_altera_nome_atend: Sequelize.NUMBER,
                    permite_env_sms: Sequelize.NUMBER,
                    nao_acessa_aba_paciente_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_nascimento_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_consulta_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_graficos_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_receita_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_vacinas_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_pedexa_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_historico_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_agenda_prontu: Sequelize.NUMBER,
                    nao_acessa_aba_atestinss_prontu: Sequelize.NUMBER,
                    nao_altera_consulta_outro_medicorea: Sequelize.NUMBER,
                    geren_lotexml: Sequelize.NUMBER,
                    geren_lotexml_fechalote: Sequelize.NUMBER,
                    geren_lotexml_reabrelote: Sequelize.NUMBER,
                    libmapaconfres: Sequelize.NUMBER,
                    situacao_agenda: Sequelize.NUMBER,
                    operadorf_id: Sequelize.INTEGER,
                    enc_req: Sequelize.NUMBER,
                    ccusto_id: Sequelize.INTEGER,
                    cad_anuencia_ac: Sequelize.NUMBER,
                    cad_anuencia_ad: Sequelize.NUMBER,
                    cad_anuencia_md: Sequelize.NUMBER,
                    cad_anuencia_co: Sequelize.NUMBER,
                    cad_anuencia_ex: Sequelize.NUMBER,
                    usuario_movimento: Sequelize.NUMBER,
                    estatrecip: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    setorimpressao_id: Sequelize.INTEGER,
                    geren_lotefat_excluilote: Sequelize.NUMBER,
                    omitirvalorcaixa: Sequelize.NUMBER,
                    loteguias: Sequelize.NUMBER,
                    abrirlote: Sequelize.NUMBER,
                    enviarlote: Sequelize.NUMBER,
                    fecharlote: Sequelize.NUMBER,
                    reabrirlote: Sequelize.NUMBER,
                    excluirlote: Sequelize.NUMBER,
                    autoriza_desconto: Sequelize.NUMBER,
                    token_user: Sequelize.STRING,
                    logado: Sequelize.BOOLEAN,
                    relconfop: Sequelize.NUMBER,
                    estattriagem: Sequelize.NUMBER,
                    estatsituacao: Sequelize.NUMBER,
                },
                {
                    sequelize,
                    tableName: 'operador3',
                    timestamps: false,
                }
            );

            return this;
        }

        // associacao tabela operador
        static associate(models) {
            this.belongsTo(models.Operador, {
                foreignKey: 'id',
                as: 'operador',
            });
            this.belongsTo(models.SetorImpressao, {
                foreignKey: 'setorimpressao_id',
                as: 'setorimpressao',
            });
        }
    };
