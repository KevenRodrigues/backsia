import { QueryTypes, Op } from 'sequelize';
import Database from '../../database';

const impEtq = async (
    req,
    res,
    _movpac_id,
    _reimprime,
    _recebemat,
    _id,
    _impgeral,
    _impcol,
    _imptri,
    _datini,
    _datfin,
    _reciptri_id = false,
    _recipcol_id = false
) => {
    const oldselect = '';
    const recipcol_id = 0;
    const reciptri_id = 0;
    const id = 0;
    const exame_id = 0;

    let where = ` WHERE MOVEXA.MOVPAC_ID = '${_movpac_id}' `;

    const { Operador, Movexa, Posto } = Database.getModels(req.database);

    if (_recebemat) {
        // M.INSTRUCAOSQL = M.INSTRUCAOSQL + " AND ("
        // SELECT CRMOVEXA
        // SCAN
        //     IF CRMOVEXA.MARCA = 1
        //         M.INSTRUCAOSQL = M.INSTRUCAOSQL + " MOVEXA.ID = '" + ALLTRIM(STR(NVL(CRMOVEXA.ID,0))) + "' OR "+CHR(13)+CHR(10)
        //     ENDIF
        // ENDSCAN
        // M.INSTRUCAOSQL = SUBSTR(M.INSTRUCAOSQL,1,LEN(M.INSTRUCAOSQL)-6)
        // M.INSTRUCAOSQL = M.INSTRUCAOSQL + ")"
    } else {
        where += ' AND ';

        const campos = 'usaleitubo, etqsf, etq_fu';
        const getParam = await Operador.sequelize
            .query(`select ${campos} from param, param2`, {
                type: QueryTypes.SELECT,
            })
            .catch(err => {
                return res.status(400).json({ error: err.message });
            });

        const getPosto = await Posto.findOne({
            where: { codigo: req.query.posto },
            attributes: ['controla_coleta_entrega'],
        }).catch(err => {
            return res.status(400).json({ error: err.message });
        });

        const { usaleitubo, etqsf, etq_fu } = getParam[0];
        const { controla_coleta_entrega } = getPosto;

        if (usaleitubo == 0 || usaleitubo === null) {
            if (etqsf == 1) {
                where +=
                    " (MOVEXA.STATUSEXM = 'TR' OR MOVEXA.STATUSEXM = 'SF') ";
            } else {
                where += " MOVEXA.STATUSEXM = 'TR' ";
            }
        } else if (etqsf == 1) {
            where +=
                " (MOVEXA.STATUSEXM = 'TR' OR MOVEXA.STATUSEXM = 'SF' OR MOVEXA.STATUSEXM = 'FM' ";

            if (etq_fu == 1) {
                if (controla_coleta_entrega === '1') {
                    where += " OR MOVEXA.STATUSEXM = 'FU' )";
                } else {
                    where += ' ) ';
                }
            } else {
                where += ' ) ';
            }
        } else {
            where += " (MOVEXA.STATUSEXM = 'TR' OR MOVEXA.STATUSEXM = 'FM' ";
            if (etq_fu == 1) {
                if (controla_coleta_entrega === '1') {
                    where += " OR MOVEXA.STATUSEXM = 'FU' )";
                } else {
                    where += ' ) ';
                }
            } else {
                where += ' ) ';
            }
        }

        if (etq_fu == 1 && controla_coleta_entrega === '1') {
            where +=
                ' AND ((COALESCE(MOVEXA.COLETAR,0) + COALESCE(MOVEXA.ENTREGUE,0)) > 0) ';
        }
    }

    if (_datini && _datfin) {
        where += ` AND (MOVEXA.DTCOLETA BETWEEN ?CTOD('${DTOC(
            _datini
        )}') AND ?CTOD('${DTOC(_datfin)}') ) `;
    }

    if (_reciptri_id) {
        where += ` AND (EXAME.RECIPTRI_ID = '${_reciptri_id}') `;
    }

    if (_recipcol_id) {
        where += ` AND (EXAME.RECIPTRI_ID = '${_recipcol_id}') `;
    }

    where += ' AND COALESCE(MOVEXA.ETIQUETAWS_ID,0) = 0 ';

    const etiquetas = await Movexa.sequelize
        .query(
            `
                SELECT movexa.movpac_id,
                    movexa.posto,
                    movexa.amostra,
                    exame.codigo,
                    movexa.statusexm,
                    exame.recipcol_id,
                    a.descricao AS desccol,
                    exame.reciptri_id,
                    b.descricao AS desctri,
                    a.naoimpetq,
                    a.isolado,
                    material.descricao AS matedsc,
                    movexa.impetq,
                    movexa.impetqtri,
                    movexa.id,
                    movpac.idade,
                    movpac.mes,
                    movpac.dia,
                    movpac.criou,
                    prontuario.nome,
                    movexa.exame_id,
                    movpac.prontuario_id,
                    convenio.fantasia,
                    medico.crm,
                    medico.nome_med
                FROM movexa
                LEFT JOIN exame ON exame.id = movexa.exame_id
                LEFT JOIN recip a ON a.id = exame.recipcol_id
                LEFT JOIN recip b ON b.id = exame.reciptri_id
                LEFT JOIN material ON material.id = movexa.material_id
                LEFT JOIN movpac ON movpac.id = movexa.movpac_id
                LEFT JOIN prontuario ON prontuario.id = movpac.prontuario_id
                LEFT JOIN convenio ON convenio.id = movexa.convenio_id
                LEFT JOIN medico ON medico.id = movexa.medico_id
                ${where}
            `,
            {
                type: QueryTypes.SELECT,
            }
        )
        .catch(err => {
            return res.status(400).json({ error: err.message });
        });

    const etiquetasAgrupadas = [];
    if (_imptri == 1) {
        etiquetas.map(etiqueta => {
            const obj = {
                exames: [],
            };
            if (etiqueta.reciptri_id != 0 && etiqueta.reciptri_id !== null) {
                obj.materiale = etiqueta.matedsc;
                obj.recipiente = etiqueta.desctri.trim();
                obj.tubo =
                    reciptri_id == null
                        ? '000'
                        : reciptri_id.toString().padStart(3, '0');
                obj.tipotriage = true;
                obj.recipcol_id = etiqueta.recipcol_id;
                obj.reciptri_id = etiqueta.reciptri_id;
                obj.id = etiqueta.id;
                obj.exame_id = etiqueta.exame_id;
                obj.criou = etiqueta.criou.trim();
                obj.posto = etiqueta.posto;
                obj.amostra = etiqueta.amostra;
                obj.convenio_nome = etiqueta.fantasia.trim();
                obj.medico_nome = etiqueta.nome_med.trim();

                if (etiqueta.isolado == 1 || etiqueta.naoimpetq == 1) {
                    if (etiqueta.isolado == 1) {
                        if (_impgeral) {
                            if (_reimprime) {
                                obj.exames = [
                                    { codigo: etiqueta.codigo.trim() },
                                ];
                            } else if (
                                etiqueta.impetqtri == 0 ||
                                etiqueta.impetqtri === null
                            ) {
                                obj.exames = [
                                    { codigo: etiqueta.codigo.trim() },
                                ];
                            }
                        } else {
                            obj.exames = [{ codigo: etiqueta.codigo.trim() }];
                        }
                        if (etiqueta.exame !== '' || etiqueta.exame !== null) {
                            etiquetasAgrupadas.push(obj);
                        }
                    }
                } else {
                    let indexEtiquetaAgrupada = false;
                    for (let i = 0; i < etiquetasAgrupadas.length; i++) {
                        const element = etiquetasAgrupadas[i];
                        if (element.reciptri_id == etiqueta.reciptri_id) {
                            indexEtiquetaAgrupada = i;
                        }
                    }

                    if (_impgeral) {
                        if (_reimprime) {
                            obj.exames = [{ codigo: etiqueta.codigo.trim() }];
                        } else if (
                            etiqueta.impetqtri == 0 ||
                            etiqueta.impetqtri === null
                        ) {
                            obj.exames = [{ codigo: etiqueta.codigo.trim() }];
                        }
                    } else {
                        obj.exames = [{ codigo: etiqueta.codigo.trim() }];
                    }

                    if (indexEtiquetaAgrupada !== false) {
                        etiquetasAgrupadas[indexEtiquetaAgrupada].exames.push({
                            codigo: obj.exames[0].codigo,
                        });
                    } else {
                        etiquetasAgrupadas.push(obj);
                    }
                }
            }
        });
    }

    return etiquetasAgrupadas;
};
class TabLogRegController {
    async indexOne(req, res) {
        try {
            const { TabLogReg, Operador } = Database.getModels(req.database);
            const tablogres = await TabLogReg.findAll({
                where: { tabela: req.query.tabela, idreg: req.query.idreg },
                order: [['id', 'DESC']],
                include: [
                    { model: Operador, as: 'operador', attributes: ['nome'] },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!tablogres) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            tablogres.map(ope => {
                ope.operador
                    ? (ope.operador.nome = ope.operador.nome.trim())
                    : null;
            });
            return res.status(200).json(tablogres);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexRastrea(req, res) {
        try {
            const { Rastrea, Operador, Movexa, Exame } = Database.getModels(
                req.database
            );
            const rastrea = await Rastrea.findAll({
                where: { movexa_id: req.query.movexa_id },
                order: [
                    ['data', 'DESC'],
                    ['id', 'DESC'],
                ],
                include: [
                    { model: Operador, as: 'operador', attributes: ['nome'] },
                    {
                        model: Movexa,
                        as: 'movexa',
                        attributes: ['posto', 'amostra', 'exame_id'],
                        include: [
                            {
                                model: Exame,
                                as: 'exame',
                                attributes: ['codigo', 'descricao'],
                            },
                        ],
                    },
                ],
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!rastrea) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            rastrea.map(item => {
                if (item.operador) {
                    item.operador.nome = item.operador.nome.trim();
                }
                if (item.movexa) {
                    if (item.movexa.exame) {
                        item.movexa.exame.codigo = item.movexa.exame.codigo.trim();
                        item.movexa.exame.descricao = item.movexa.exame.descricao.trim();
                    }
                }
            });
            return res.status(200).json(rastrea);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexEtiquetas(req, res) {
        try {
            const etiquetas = await impEtq(
                req,
                res,
                req.query.movpac_id,
                true,
                false,
                0,
                false,
                0,
                1
            );
            return res.status(200).json(etiquetas);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    async indexOneOpera(req, res) {
        try {
            const { TabLogReg, Operador } = Database.getModels(req.database);
            const tablogres = await TabLogReg.findAll({
                where: {
                    [Op.or]: [
                        {
                            tabela: 'operador',
                        },
                        {
                            tabela: 'operador2',
                        },
                        {
                            tabela: 'operador3',
                        },
                        {
                            tabela: 'operadorf',
                        },
                    ],
                    field: {
                        [Op.ne]: 'TOKEN_USER',
                    },
                    idopera: req.query.idopera,
                },
                order: [['id', 'DESC']],
                include:
                    {
                        model: Operador,
                        as: 'operador',
                        attributes: ['nome'],
                    },
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            if (!tablogres) {
                return res
                    .status(400)
                    .json({ error: 'Nenhum registro encontrado' });
            }
            tablogres.map(ope => {
                ope.operador
                    ? (ope.operador.nome = ope.operador.nome.trim())
                    : null;
            });
            return res.status(200).json(tablogres);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new TabLogRegController();
