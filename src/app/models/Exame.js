import Sequelize, { Model } from 'sequelize';

export default (sequelize) => class Exame extends Model {
    static init() {
        super.init(
            {
                setor_id: Sequelize.INTEGER,
                layout_id: Sequelize.INTEGER,
                recipcol_id: Sequelize.INTEGER,
                reciptri_id: Sequelize.INTEGER,
                rotnor_id: Sequelize.INTEGER,
                roturg_id: Sequelize.INTEGER,
                esptab_id: Sequelize.INTEGER,
                apoio_id: Sequelize.INTEGER,
                porte_id: Sequelize.INTEGER,
                codigo: Sequelize.STRING,
                depara: Sequelize.STRING,
                descricao: Sequelize.STRING,
                fantasia: Sequelize.STRING,
                status: Sequelize.INTEGER,
                folha: Sequelize.STRING,
                ordem: Sequelize.STRING,
                imagem: Sequelize.NUMBER,
                mascara: Sequelize.STRING,
                formula: Sequelize.STRING,
                sofatura: Sequelize.NUMBER,
                naoimpmap: Sequelize.NUMBER,
                laymap: Sequelize.STRING,
                naodesc: Sequelize.NUMBER,
                prazo: Sequelize.NUMBER,
                filtro: Sequelize.STRING,
                volume_ml: Sequelize.NUMBER,
                grupo: Sequelize.STRING,
                jejum: Sequelize.NUMBER,
                amb: Sequelize.STRING,
                obs: Sequelize.STRING,
                custo: Sequelize.NUMBER,
                rotina: Sequelize.STRING,
                conserva: Sequelize.STRING,
                preparo: Sequelize.STRING,
                interfere: Sequelize.STRING,
                referencia: Sequelize.STRING,
                interpreta: Sequelize.STRING,
                relaciona: Sequelize.STRING,
                recipiente: Sequelize.STRING,
                triagem: Sequelize.STRING,
                bloq: Sequelize.NUMBER,
                motivo: Sequelize.STRING,
                urgencia: Sequelize.STRING,
                interface: Sequelize.NUMBER,
                padrao: Sequelize.STRING,
                temmedico: Sequelize.NUMBER,
                cuidados: Sequelize.STRING,
                agenda: Sequelize.NUMBER,
                txtrefere: Sequelize.STRING,
                labapoio: Sequelize.NUMBER,
                revisao: Sequelize.NUMBER,
                usamat: Sequelize.NUMBER,
                exmtria: Sequelize.NUMBER,
                especiali: Sequelize.STRING,
                partecorpo: Sequelize.STRING,
                medicor: Sequelize.NUMBER,
                naogab: Sequelize.NUMBER,
                mes: Sequelize.STRING,
                material: Sequelize.STRING,
                usaword: Sequelize.NUMBER,
                intervalo: Sequelize.STRING,
                matmed: Sequelize.NUMBER,
                enviawww: Sequelize.NUMBER,
                exmtaxa: Sequelize.NUMBER,
                naomarca: Sequelize.NUMBER,
                naomostra: Sequelize.NUMBER,
                colunar: Sequelize.NUMBER,
                apavaz: Sequelize.NUMBER,
                naoaparece: Sequelize.NUMBER,
                agrupado: Sequelize.NUMBER,
                metodo_id: Sequelize.INTEGER,
                material_id: Sequelize.INTEGER,
                bloqsexo: Sequelize.NUMBER,
                naocad: Sequelize.NUMBER,
                bloqexa: Sequelize.NUMBER,
                resupos: Sequelize.NUMBER,
                valor: Sequelize.STRING,
                valor1: Sequelize.STRING,
                triagemele: Sequelize.NUMBER,
                codinter: Sequelize.STRING,
                consulta: Sequelize.NUMBER,
                bpacbo: Sequelize.STRING,
                naofatura: Sequelize.NUMBER,
                linha_id: Sequelize.INTEGER,
                profexecesp: Sequelize.NUMBER,
                envb2b: Sequelize.NUMBER,
                seqguia: Sequelize.NUMBER,
                nao_inter_pos: Sequelize.STRING,
                ori_apoiado: Sequelize.TEXT,
                cri_rejeicao: Sequelize.TEXT,
                rtf: Sequelize.NUMBER,
                lembrete: Sequelize.TEXT,
                perm_coletar: Sequelize.NUMBER,
                perm_receber: Sequelize.NUMBER,
                ori_coleta: Sequelize.TEXT,
                matriz_id: Sequelize.INTEGER,
                travaexa: Sequelize.NUMBER,
                amb_antigo: Sequelize.STRING,
                exige_material: Sequelize.NUMBER,
                convperm_lembrete: Sequelize.STRING,
                exige_peso_atend: Sequelize.NUMBER,
                exige_altura_atend: Sequelize.NUMBER,
                urg_prio_permite: Sequelize.NUMBER,
                sofatura_triagem: Sequelize.NUMBER,
                salva_automatico_lp: Sequelize.NUMBER,
                ant_layout_id_diferente: Sequelize.NUMBER,
                envio_rnds: Sequelize.NUMBER,
                exm_covid19: Sequelize.NUMBER,
                idopera_ultacao: Sequelize.INTEGER,
                inc_tabela1: Sequelize.NUMBER,
                rotprior_id: Sequelize.INTEGER
            },
            {
                sequelize,
                modelName: 'Exame',
                tableName: 'exame',
                timestamps: false,
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.Motina, { foreignKey: 'status', as: 'motina' });
        this.belongsTo(models.Setor, {
            foreignKey: 'setor_id',
            as: 'setor',
        });
        this.belongsTo(models.Esptab, {
            foreignKey: 'esptab_id',
            as: 'esptab',
        });
        this.belongsTo(models.Apoio, {
            foreignKey: 'apoio_id',
            as: 'apoio',
        });
        this.belongsTo(models.Layout, {
            foreignKey: 'layout_id',
            as: 'layout',
        });
        this.belongsTo(models.Rotina, {
            foreignKey: 'rotnor_id',
            as: 'rotnor',
        });
        this.belongsTo(models.Rotina, {
            foreignKey: 'roturg_id',
            as: 'roturg',
        });
        this.belongsTo(models.Rotina, {
            foreignKey: 'rotprior_id',
            as: 'rotprior',
        });
        this.belongsTo(models.Recip, {
            foreignKey: 'recipcol_id',
            as: 'recipcol',
        });
        this.belongsTo(models.Recip, {
            foreignKey: 'reciptri_id',
            as: 'reciptri',
        });
        this.belongsTo(models.Material, {
            foreignKey: 'material_id',
            as: 'materials',
        });
        this.belongsTo(models.Linha, {
            foreignKey: 'linha_id',
            as: 'linha',
        });
        this.belongsTo(models.Matriz, {
            foreignKey: 'matriz_id',
            as: 'matriz',
        });
        this.belongsTo(models.Metodo, {
            foreignKey: 'metodo_id',
            as: 'metodo',
        });
        this.hasMany(models.Examatmed, {
            foreignKey: 'exame_id',
            as: 'examatmed',
        });
        this.hasMany(models.Examealt, {
            foreignKey: 'exame_id',
            as: 'examealt',
        });
        this.hasMany(models.Examematperm, {
            foreignKey: 'exame_id',
            as: 'examematperm',
        });
        this.hasMany(models.Exameinc, {
            foreignKey: 'exame_id',
            as: 'exameinc',
        });
        this.hasMany(models.Examecusto, {
            foreignKey: 'exame_id',
            as: 'examecusto',
        });
        // this.hasMany(models.Produto, {
        //     foreignKey: 'produto_id',
        //     as: 'produto',
        // });
        this.hasMany(models.Gradeexa, {
            foreignKey: 'id',
            as: 'gradeexa',
        });
    }
}
