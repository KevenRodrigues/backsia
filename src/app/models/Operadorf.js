import Sequelize, { Model } from 'sequelize';

export default sequelize =>
    class Operadorf extends Model {
        static init() {
            super.init(
                {
                    operador_id: Sequelize.INTEGER,
                    nome: Sequelize.TEXT,
                    nivel: Sequelize.NUMBER,
                    senope: Sequelize.TEXT,
                    nivope: Sequelize.INTEGER,
                    status: Sequelize.INTEGER,
                    cad_ina_ad: Sequelize.NUMBER,
                    cad_ina_md: Sequelize.NUMBER,
                    cad_ina_co: Sequelize.NUMBER,
                    cad_ina_ex: Sequelize.NUMBER,
                    cad_ina_ac: Sequelize.NUMBER,
                    cad_nivel_ad: Sequelize.NUMBER,
                    cad_nivel_ac: Sequelize.NUMBER,
                    cad_nivel_md: Sequelize.NUMBER,
                    cad_nivel_co: Sequelize.NUMBER,
                    cad_nivel_ex: Sequelize.NUMBER,
                    cad_opera_ad: Sequelize.NUMBER,
                    cad_opera_ac: Sequelize.NUMBER,
                    cad_opera_md: Sequelize.NUMBER,
                    cad_opera_co: Sequelize.NUMBER,
                    cad_opera_ex: Sequelize.NUMBER,
                    cad_banco_ad: Sequelize.NUMBER,
                    cad_banco_md: Sequelize.NUMBER,
                    cad_banco_co: Sequelize.NUMBER,
                    cad_banco_ex: Sequelize.NUMBER,
                    cad_banco_ac: Sequelize.NUMBER,
                    cad_contas_ad: Sequelize.NUMBER,
                    cad_contas_md: Sequelize.NUMBER,
                    cad_contas_co: Sequelize.NUMBER,
                    cad_contas_ex: Sequelize.NUMBER,
                    cad_contas_ac: Sequelize.NUMBER,
                    cad_pl_contas_ad: Sequelize.NUMBER,
                    cad_pl_contas_md: Sequelize.NUMBER,
                    cad_pl_contas_co: Sequelize.NUMBER,
                    cad_pl_contas_ex: Sequelize.NUMBER,
                    cad_pl_contas_ac: Sequelize.NUMBER,
                    cad_fornecedor_ac: Sequelize.NUMBER,
                    cad_fornecedor_ad: Sequelize.NUMBER,
                    cad_fornecedor_md: Sequelize.NUMBER,
                    cad_fornecedor_co: Sequelize.NUMBER,
                    cad_fornecedor_ex: Sequelize.NUMBER,
                    cad_sacado_ac: Sequelize.NUMBER,
                    cad_sacado_ad: Sequelize.NUMBER,
                    cad_sacado_md: Sequelize.NUMBER,
                    cad_sacado_co: Sequelize.NUMBER,
                    cad_sacado_ex: Sequelize.NUMBER,
                    cad_ccusto_ad: Sequelize.NUMBER,
                    cad_ccusto_ac: Sequelize.NUMBER,
                    cad_ccusto_md: Sequelize.NUMBER,
                    cad_ccusto_co: Sequelize.NUMBER,
                    cad_ccusto_ex: Sequelize.NUMBER,
                    cad_pagar_ac: Sequelize.NUMBER,
                    cad_pagar_ad: Sequelize.NUMBER,
                    cad_pagar_md: Sequelize.NUMBER,
                    cad_pagar_co: Sequelize.NUMBER,
                    cad_pagar_ex: Sequelize.NUMBER,
                    cad_receber_ac: Sequelize.NUMBER,
                    cad_receber_ad: Sequelize.NUMBER,
                    cad_receber_md: Sequelize.NUMBER,
                    cad_receber_co: Sequelize.NUMBER,
                    cad_receber_ex: Sequelize.NUMBER,
                    libpag_ac: Sequelize.NUMBER,
                    libpag_ad: Sequelize.NUMBER,
                    libpag_md: Sequelize.NUMBER,
                    libpag_co: Sequelize.NUMBER,
                    libpag_ex: Sequelize.NUMBER,
                    transf: Sequelize.NUMBER,
                    fluxo: Sequelize.NUMBER,
                    grafico: Sequelize.NUMBER,
                    listcad: Sequelize.NUMBER,
                    rel: Sequelize.NUMBER,
                    conf: Sequelize.NUMBER,
                    cad_produto_ad: Sequelize.NUMBER,
                    cad_produto_ac: Sequelize.NUMBER,
                    cad_produto_md: Sequelize.NUMBER,
                    cad_produto_co: Sequelize.NUMBER,
                    cad_produto_ex: Sequelize.NUMBER,
                    cad_repre_ad: Sequelize.NUMBER,
                    cad_repre_ac: Sequelize.NUMBER,
                    cad_repre_md: Sequelize.NUMBER,
                    cad_repre_co: Sequelize.NUMBER,
                    cad_repre_ex: Sequelize.NUMBER,
                    cad_grupo_ad: Sequelize.NUMBER,
                    cad_grupo_ac: Sequelize.NUMBER,
                    cad_grupo_md: Sequelize.NUMBER,
                    cad_grupo_co: Sequelize.NUMBER,
                    cad_grupo_ex: Sequelize.NUMBER,
                    cad_transp_ad: Sequelize.NUMBER,
                    cad_transp_ac: Sequelize.NUMBER,
                    cad_transp_md: Sequelize.NUMBER,
                    cad_transp_co: Sequelize.NUMBER,
                    cad_transp_ex: Sequelize.NUMBER,
                    cad_forrec_ad: Sequelize.NUMBER,
                    cad_forrec_ac: Sequelize.NUMBER,
                    cad_forrec_md: Sequelize.NUMBER,
                    cad_forrec_co: Sequelize.NUMBER,
                    cad_forrec_ex: Sequelize.NUMBER,
                    cad_naturezaope_ad: Sequelize.NUMBER,
                    cad_naturezaope_ac: Sequelize.NUMBER,
                    cad_naturezaope_md: Sequelize.NUMBER,
                    cad_naturezaope_co: Sequelize.NUMBER,
                    cad_naturezaope_ex: Sequelize.NUMBER,
                    cad_pagrepre_ad: Sequelize.NUMBER,
                    cad_pagrepre_ac: Sequelize.NUMBER,
                    cad_pagrepre_md: Sequelize.NUMBER,
                    cad_pagrepre_co: Sequelize.NUMBER,
                    cad_pagrepre_ex: Sequelize.NUMBER,
                    cad_mensal_ad: Sequelize.NUMBER,
                    cad_mensal_ac: Sequelize.NUMBER,
                    cad_mensal_md: Sequelize.NUMBER,
                    cad_mensal_co: Sequelize.NUMBER,
                    cad_mensal_ex: Sequelize.NUMBER,
                    cad_trimestre_ad: Sequelize.NUMBER,
                    cad_trimestre_ac: Sequelize.NUMBER,
                    cad_trimestre_md: Sequelize.NUMBER,
                    cad_trimestre_co: Sequelize.NUMBER,
                    cad_trimestre_ex: Sequelize.NUMBER,
                    retorno: Sequelize.NUMBER,
                    remessa: Sequelize.NUMBER,
                    boleto: Sequelize.NUMBER,
                    estoque: Sequelize.NUMBER,
                    apoio_id: Sequelize.INTEGER,
                    extratob: Sequelize.NUMBER,
                    extratocc: Sequelize.NUMBER,
                    saldo: Sequelize.NUMBER,
                    reltransf: Sequelize.NUMBER,
                    relanual: Sequelize.NUMBER,
                    relrec: Sequelize.NUMBER,
                    filtrac: Sequelize.NUMBER,
                    cad_req_ad: Sequelize.NUMBER,
                    cad_req_md: Sequelize.NUMBER,
                    cad_req_co: Sequelize.NUMBER,
                    cad_req_ex: Sequelize.NUMBER,
                    cad_req_ac: Sequelize.NUMBER,
                    alterasaldo: Sequelize.NUMBER,
                    ccusto_id: Sequelize.INTEGER,
                    enc_req: Sequelize.NUMBER,
                    conf_as: Sequelize.NUMBER,
                    pmc: Sequelize.NUMBER,
                    pmcestorna: Sequelize.NUMBER,
                    cad_tipob_ad: Sequelize.NUMBER,
                    cad_tipob_md: Sequelize.NUMBER,
                    cad_tipob_co: Sequelize.NUMBER,
                    cad_tipob_ex: Sequelize.NUMBER,
                    cad_tipob_ac: Sequelize.NUMBER,
                    cad_localb_ad: Sequelize.NUMBER,
                    cad_localb_md: Sequelize.NUMBER,
                    cad_localb_co: Sequelize.NUMBER,
                    cad_localb_ex: Sequelize.NUMBER,
                    cad_localb_ac: Sequelize.NUMBER,
                    cad_servico_ad: Sequelize.NUMBER,
                    cad_servico_md: Sequelize.NUMBER,
                    cad_servico_co: Sequelize.NUMBER,
                    cad_servico_ex: Sequelize.NUMBER,
                    cad_servico_ac: Sequelize.NUMBER,
                    cad_bem_ad: Sequelize.NUMBER,
                    cad_bem_md: Sequelize.NUMBER,
                    cad_bem_co: Sequelize.NUMBER,
                    cad_bem_ex: Sequelize.NUMBER,
                    cad_bem_ac: Sequelize.NUMBER,
                    cad_manut_ad: Sequelize.NUMBER,
                    cad_manut_md: Sequelize.NUMBER,
                    cad_manut_co: Sequelize.NUMBER,
                    cad_manut_ex: Sequelize.NUMBER,
                    cad_manut_ac: Sequelize.NUMBER,
                    depreciacao: Sequelize.NUMBER,
                    relbem: Sequelize.NUMBER,
                    reldepre: Sequelize.NUMBER,
                    cad_func_ad: Sequelize.NUMBER,
                    cad_func_ac: Sequelize.NUMBER,
                    cad_func_co: Sequelize.NUMBER,
                    cad_func_md: Sequelize.NUMBER,
                    cad_func_ex: Sequelize.NUMBER,
                    reciborap: Sequelize.NUMBER,
                    cad_dev_ac: Sequelize.NUMBER,
                    cad_dev_ad: Sequelize.NUMBER,
                    relconset: Sequelize.NUMBER,
                    relconpro: Sequelize.NUMBER,
                    relconuni: Sequelize.NUMBER,
                    relabc: Sequelize.NUMBER,
                    relcomfor: Sequelize.NUMBER,
                    relxyz: Sequelize.NUMBER,
                    relcontestoq: Sequelize.NUMBER,
                    inventario: Sequelize.NUMBER,
                    conciliacao: Sequelize.NUMBER,
                    deposito: Sequelize.NUMBER,
                    retirada: Sequelize.NUMBER,
                    relmovpro: Sequelize.NUMBER,
                    relconcol: Sequelize.NUMBER,
                    cad_cotacao_ac: Sequelize.NUMBER,
                    cad_cotacao_ad: Sequelize.NUMBER,
                    cad_cotacao_md: Sequelize.NUMBER,
                    cad_cotacao_co: Sequelize.NUMBER,
                    cad_cotacao_ex: Sequelize.NUMBER,
                    analisec: Sequelize.NUMBER,
                    cad_compra_ac: Sequelize.NUMBER,
                    cad_compra_ad: Sequelize.NUMBER,
                    cad_compra_md: Sequelize.NUMBER,
                    cad_compra_co: Sequelize.NUMBER,
                    cad_compra_ex: Sequelize.NUMBER,
                    sitcompra: Sequelize.NUMBER,
                    lancacompra_ac: Sequelize.NUMBER,
                    lancacompra_ad: Sequelize.NUMBER,
                    lancacompra_co: Sequelize.NUMBER,
                    lancacompra_ex: Sequelize.NUMBER,
                    cad_pedido_ac: Sequelize.NUMBER,
                    cad_pedido_ad: Sequelize.NUMBER,
                    cad_pedido_md: Sequelize.NUMBER,
                    cad_pedido_co: Sequelize.NUMBER,
                    cad_pedido_ex: Sequelize.NUMBER,
                    libcot_ac: Sequelize.NUMBER,
                    libcot_md: Sequelize.NUMBER,
                    libcot_co: Sequelize.NUMBER,
                    relextritem: Sequelize.NUMBER,
                    relanualitens: Sequelize.NUMBER,
                    idopera_ultacao: Sequelize.INTEGER,
                    libped_ac: Sequelize.NUMBER,
                    libped_md: Sequelize.NUMBER,
                    libped_co: Sequelize.NUMBER,
                },
                {
                    sequelize,
                    tableName: 'operadorf',
                    timestamps: false,
                }
            );

            return this;
        }

        static associate(models) {
            this.belongsTo(models.Operador, {
                foreignKey: 'id',
                as: 'operador',
            });
        }
        // associacao tabela operador
        // static associate(models) {
        //     this.belongsTo(models.Operador, {
        //         foreignKey: 'id',
        //         as: 'operador',
        //     });
        // }
    };
