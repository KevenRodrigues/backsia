import { Router, Request } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import NotificationController from './app/controllers/NotificationController';

import ApoioController from './app/controllers/ApoioController';
import ApoioExaController from './app/controllers/ApoioExaController';
import ApoioPosController from './app/controllers/ApoioPosController';
import ApoioEnvController from './app/controllers/ApoioEnvController';
import AtendimentoController from './app/controllers/AtendimentoController';
import CidController from './app/controllers/CidController';
import FraseController from './app/controllers/FraseController';
import SituacaoFiltroController from './app/controllers/SituacaoFiltroController';
import SituacaoController from './app/controllers/SituacaoController';
import SetorFilaController from './app/controllers/SetorFilaController';
import FiltroController from './app/controllers/FiltroController';
import EnvioController from './app/controllers/EnvioController';
import InterfereController from './app/controllers/InterfereController';
import RecipController from './app/controllers/RecipController';
import LinhaController from './app/controllers/LinhaController';
import FungosController from './app/controllers/FungosController';
import ParasitasController from './app/controllers/ParasitasController';
import FeriadoController from './app/controllers/FeriadoController';
import MetodoController from './app/controllers/MetodoController';
import MotinaController from './app/controllers/MotinaController';
import EntregaController from './app/controllers/EntregaController';
import GradeController from './app/controllers/GradeController';
import MapaGradeController from './app/controllers/MapaGradeController';
import QuestaoController from './app/controllers/QuestaoController';
import EqpController from './app/controllers/EqpController';
import ExameController from './app/controllers/ExameController';
import EstatisticaAvancadaController from './app/controllers/EstatisticaAvancadaController';
import LayoutController from './app/controllers/LayoutController';
import SetorController from './app/controllers/SetorController';
import ConvenioController from './app/controllers/ConvenioController';
import PlanoController from './app/controllers/PlanoController';
import MaterialController from './app/controllers/MaterialController';
import MedicoController from './app/controllers/MedicoController';
import TriagemController from './app/controllers/TriagemController';
import PostoController from './app/controllers/PostoController';
import ProntuarioController from './app/controllers/ProntuarioController';
import LiberaController from './app/controllers/LiberaController';
import MotivoncController from './app/controllers/MotivoncController';
import MatmedController from './app/controllers/MatmedController';
import RotinaController from './app/controllers/RotinaController';
import EsptabController from './app/controllers/EsptabController';
import EmpresaController from './app/controllers/EmpresaController';
import BancoController from './app/controllers/BancoController';
import CartaoController from './app/controllers/CartaoController';
import ForrecController from './app/controllers/ForrecController';
import PorteController from './app/controllers/PorteController';
import EspmedController from './app/controllers/EspmedController';
import MotivoController from './app/controllers/MotivoController';
import TagsController from './app/controllers/TagsController';
import ContatoController from './app/controllers/ContatoController';
import DriveController from './app/controllers/DriveController';
import ParamController from './app/controllers/ParamController';
import Param2Controller from './app/controllers/Param2Controller';
import MatrizController from './app/controllers/MatrizController';
import TabelaController from './app/controllers/TabelaController';
import Tabela1Controller from './app/controllers/Tabela1Controller';
import ProdutoController from './app/controllers/ProdutoController';
import ConvenioTissController from './app/controllers/ConvenioTissController';
import NovaColetaController from './app/controllers/NovaColetaController';
import RepeteExaController from './app/controllers/RepeteExaController';
import EntregaPacController from './app/controllers/EntregaPacController';
import ReceberFinancialController from './app/controllers/financial/ReceberController';
import ExtratoBancarioController from './app/controllers/ExtratoBancarioController';
import FaturamentoConvenioController from './app/controllers/FaturamentoConvenioController';
import LotesFaturamentoController from './app/controllers/LotesFaturamentoController';
import PagarController from './app/controllers/PagarController';
import Pagar1Controller from './app/controllers/Pagar1Controller';
import Pagar2Controller from './app/controllers/Pagar2Controller';
import FornecedorController from './app/controllers/FornecedorController';
import ContasController from './app/controllers/ContasController';
import CcustoController from './app/controllers/CcustoController';
import PlcontasController from './app/controllers/PlcontasController';
import ParamfController from './app/controllers/ParamfController';
import ReceberController from './app/controllers/ReceberController';
import Receber1Controller from './app/controllers/Receber1Controller';
import Receber2Controller from './app/controllers/Receber2Controller';
import RelatorioPacController from './app/controllers/RelatorioPacDevedor';
import ColetaMaterialController from './app/controllers/ColetaMaterialController';
import EnvioMaloteController from './app/controllers/EnvioMaloteController';

import OperadorController from './app/controllers/OperadorController';
import NivelController from './app/controllers/NivelController';
import ProtocoloController from './app/controllers/ProtocoloController';

import DominioController from './app/controllers/DominioController';
import TabLogRegController from './app/controllers/TabLogRegController';
import TabLogCadController from './app/controllers/TabLogCadController';
import OrcaController from './app/controllers/OrcaController';
import CaixaController from './app/controllers/CaixaController';
import RecmatController from './app/controllers/RecmatController';
import LancamentoResultadoController from './app/controllers/LancamentoResultadoController';
import SacadoController from './app/controllers/SacadoController';
import RepresentanteController from './app/controllers/RepresentanteController';
import authMiddleware from './app/middleware/auth';

// SIALAB PACIENTE
import LaboratoriosController from './app/controllers/sialabpac/LaboratoriosController';
import UnidadesController from './app/controllers/sialabpac/UnidadesController';
import UserController from './app/controllers/sialabpac/UserController';
import AgendadoController from './app/controllers/sialabpac/AgendadoController';
import AgendadoexmController from './app/controllers/sialabpac/AgendadoexmController';
import PreagendadoController from './app/controllers/sialabpac/PreagendadoController';
import PagamentoController from './app/controllers/sialabpac/PagamentoController';
import PedidosmedicoController from './app/controllers/sialabpac/PedidosMedicoController';
import OperadorPermController from './app/controllers/OperadorPermController';
import NotificacaoController from './app/controllers/sialabpac/NotificacaoController';
import AuthPermissonController from './app/controllers/sialabpac/AuthPermissionController';
import MedicoReaController from './app/controllers/MedicoReaController';
import SetorImpressaoController from './app/controllers/SetorImpressaoController';
import UtilController from './app/controllers/UtilController';
import GeraTissController from './app/controllers/GeraTissController';
import ImpressaoResulController from './app/controllers/ImpressaoResulController';
import GeraEtiquetaController from './app/controllers/GeraEtiquetaController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);
routes.post('/dominio', DominioController.indexOne);

routes.use(authMiddleware);

// PAGAMENTO
routes.post('/pagarme/saldo', PagamentoController.pagarmeSaldo);
routes.get('/pagarme/transacoes', PagamentoController.pagarmeTransacoes);
routes.get('/pagarme/transacoes/:id', PagamentoController.pagarmeTransacoesOne);
routes.post(
    '/pagarme/transferencia/:id',
    PagamentoController.pagarmeTransferencia
);
routes.get('/pagarme/error/:id', PagamentoController.pagarmeErrors);

routes.put('/users', UserController.update);
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);
routes.post('/files', upload.single('file'), FileController.store);

routes.get('/cids', CidController.index);
routes.get('/cids/:id', CidController.indexOne);
routes.post('/cids', CidController.store);
routes.put('/cids', CidController.update);
routes.delete('/cids/:id', CidController.delete);

routes.post('/estatistica/triagem', TriagemController.estatistica);
routes.post('/estatistica/triagem/relatorio', TriagemController.gerarRelatorio);
routes.get('/movimentodiarioposto', PostoController.movimentodiario);
routes.post('/estatistica/posto', PostoController.estatistica);
routes.post('/estatistica/postoexame', PostoController.estatisticaPostoExame);
routes.post('/estatistica/exames', ExameController.estatistica);
routes.post('/estatistica/convenios', ConvenioController.estatistica);
routes.post('/estatistica/medicos', MedicoController.estatistica);
routes.post('/estatistica/avancada', EstatisticaAvancadaController.avancada);
routes.post('/estatistica/envio', EnvioController.estatistica);
routes.post('/estatistica/entrega', EntregaController.estatistica);
routes.post('/estatistica/setor/geral', SetorController.estatisticaGeral);
routes.post('/estatistica/setor/posto', SetorController.estatisticaPosto);
routes.post('/estatistica/coleta', ColetaMaterialController.estatistica);
routes.post('/estatistica-operadores-produtividade', OperadorController.estatisticaProdutividade);
routes.post('/estatistica-operadores-convenio', OperadorController.estatisticaOperadorConvenio);
routes.post('/estatistica-operadores-convenio-atendimento', OperadorController.estatisticaConvenioAtendimento);
routes.post('/estatistica-operadores-atendimento', OperadorController.estatisticaTempoAtendimento);
routes.post('/estatistica/setor/novacoleta', SetorController.estatisticaNovaColeta);
routes.post('/estatistica/prontuario', ProntuarioController.estatistica);
routes.post('/estatistica/recipientes', RecipController.estatistica);
routes.post('/estatistica/conferencia', OperadorController.estatisticaPorConferencia);
routes.post('/estatistica/liberacaoexames', ExameController.estatisticaLiberacao);
routes.post(
    '/estatistica/avancada/relatorio',
    EstatisticaAvancadaController.gerarRelatorioEstatisticaAvancada
);
routes.post(
    '/estatistica/posto/relatorio',
    PostoController.gerarRelatorio
);
routes.post(
    '/estatistica/medicos/relatorio',
    MedicoController.gerarRelatorio
);
routes.post(
    '/estatistica/postoexame/relatorio',
    PostoController.gerarRelatorioPostoExame
);
routes.post(
    '/estatistica/envio/relatorio',
    EnvioController.gerarRelatorio
);
routes.post(
    '/estatistica/entrega/relatorio',
    EntregaController.gerarRelatorio
);
routes.post(
    '/estatistica/convenios/relatorio',
    ConvenioController.gerarRelatorio
);
routes.post(
    '/estatistica/exames/relatorio',
    ExameController.gerarRelatorio
);
routes.post(
    '/estatistica/coleta/relatorio',
    ColetaMaterialController.gerarRelatorio
);
routes.post(
    '/relatorio-operadores-produtividade',
    OperadorController.gerarRelatorioProdutividade
);
routes.post(
    '/relatorio-operadores-convenio-atendimento',
    OperadorController.gerarRelatorioConvenioAtendimento
);
routes.post(
    '/relatorio-operador-tempo-atendimento',
    OperadorController.gerarRelatorioTempoAtendimento
);
routes.post(
    '/relatorio-operadores-convenio',
    OperadorController.gerarRelatorioOperadorConvenio
);
routes.post(
    '/estatistica/setor/novacoleta/relatorio',
    SetorController.gerarRelatorioNovaColeta
);
routes.post(
    '/estatistica/setor/geral/relatorio',
    SetorController.gerarRelatorioGeral
);
routes.post(
    '/estatistica/setor/posto/relatorio',
    SetorController.gerarRelatorioPosto
);
routes.post(
    '/estatistica/prontuario/relatorio',
    ProntuarioController.gerarRelatorio
);
routes.post(
    '/estatistica/recipientes/relatorio',
    RecipController.gerarRelatorio
);
routes.post(
    '/estatistica/conferencia/relatorio',
    OperadorController.gerarRelatorioConferencia
);
routes.post(
    '/estatistica/liberacaoexames/relatorio',
    ExameController.gerarRelatorioDeLiberacao
);
routes.get('/estatisticaDash', PostoController.estatisticaDash);
routes.get('/postos', PostoController.index);
routes.get('/postos/:id', PostoController.indexOne);
routes.post('/postos', PostoController.store);
routes.put('/postos', PostoController.update);
routes.delete('/postos/:id', PostoController.delete);
routes.put('/postos/bmp/:id', async (req, res) => {
    const bmp = upload.single('file');
    await bmp(req, res, err => {
        if (err instanceof multer.MulterError)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Tamanho da imagem excede o limite de 10mb',
                });
            } else {
                return res.status(400).json({ error: err.message });
            }
        const dados = PostoController.updateBmp(req, res);
        return dados;
    });
});
routes.put('/postos/bmp/delete/:key', PostoController.deleteBmp);
routes.put('/postos/bmp/exclude/:id/:key', PostoController.excludeBmp);

routes.get('/envios', EnvioController.index);
routes.get('/envios/:id', EnvioController.indexOne);
routes.post('/envios', EnvioController.store);
routes.put('/envios', EnvioController.update);
routes.delete('/envios/:id', EnvioController.delete);

routes.get('/esptabs', EsptabController.index);
routes.get('/esptabs/:id', EsptabController.indexOne);
routes.post('/esptabs', EsptabController.store);
routes.put('/esptabs', EsptabController.update);
routes.delete('/esptabs/:id', EsptabController.delete);

routes.get('/bancos', BancoController.index);
routes.get('/bancos/:id', BancoController.indexOne);
routes.post('/bancos', BancoController.store);
routes.put('/bancos', BancoController.update);
routes.delete('/bancos/:id', BancoController.delete);

routes.get('/cartoes', CartaoController.index);
routes.get('/cartoes/:id', CartaoController.indexOne);
routes.post('/cartoes', CartaoController.store);
routes.put('/cartoes', CartaoController.update);
routes.delete('/cartoes/:id', CartaoController.delete);

routes.get('/forrecs', ForrecController.index);
routes.get('/forrecs/:id', ForrecController.indexOne);
routes.post('/forrecs', ForrecController.store);
routes.put('/forrecs', ForrecController.update);
routes.delete('/forrecs/:id', ForrecController.delete);

routes.get('/portes', PorteController.index);
routes.get('/portes/:id', PorteController.indexOne);
routes.post('/portes', PorteController.store);
routes.put('/portes', PorteController.update);
routes.delete('/portes/:id', PorteController.delete);

routes.get('/espmeds', EspmedController.index);
routes.get('/espmeds/:id', EspmedController.indexOne);
routes.post('/espmeds', EspmedController.store);
routes.put('/espmeds', EspmedController.update);
routes.delete('/espmeds/:id', EspmedController.delete);

routes.get('/motivos', MotivoController.index);
routes.get('/motivos/:id', MotivoController.indexOne);
routes.post('/motivos', MotivoController.store);
routes.put('/motivos', MotivoController.update);
routes.delete('/motivos/:id', MotivoController.delete);

routes.get('/tags', TagsController.index);
routes.get('/tags/:id', TagsController.indexOne);
routes.post('/tags', TagsController.store);
routes.put('/tags', TagsController.update);
routes.delete('/tags/:id', TagsController.delete);

routes.get('/contatos', ContatoController.index);
routes.get('/contatos/:id', ContatoController.indexOne);
routes.get('/contatosconv/:convenio_id', ContatoController.indexConv);
routes.post('/contatos', ContatoController.store);
routes.put('/contatos', ContatoController.update);
routes.delete('/contatos/:id', ContatoController.delete);

routes.get('/drive', DriveController.index);
routes.get('/drive/:id', DriveController.indexOne);
routes.post('/drive', DriveController.store);
routes.put('/drive', DriveController.update);
routes.delete('/drive/:id', DriveController.delete);

// PARAMS
routes.get('/params', ParamController.index);
routes.put('/params', ParamController.update);
routes.post('/params/statusexame', ParamController.indexStatusExame);

// PARAMS2
routes.get('/params2', Param2Controller.index);
routes.put('/params2', Param2Controller.update);

routes.get('/matriz', MatrizController.index);
routes.get('/matriz/:id', MatrizController.indexOne);
routes.post('/matriz', MatrizController.store);
routes.put('/matriz', MatrizController.update);
routes.delete('/matriz/:id', MatrizController.delete);

routes.get('/tabela', TabelaController.index);
routes.get('/tabela/:id', TabelaController.indexOne);
routes.get('/tabela/list/:tabela_id', TabelaController.indexTable);
routes.get('/tabela/report/:tabela_id', TabelaController.indexTableReport);
routes.post('/tabela', TabelaController.store);
routes.put('/tabela', TabelaController.update);
routes.delete('/tabela/:id', TabelaController.delete);
routes.put('/tabela1', Tabela1Controller.update);
routes.get('/tabelaexameid/list/:exameid', TabelaController.indexTableExameId);

routes.get('/interfere', InterfereController.index);
routes.get('/interfere/:id', InterfereController.indexOne);
routes.post('/interfere', InterfereController.store);
routes.put('/interfere', InterfereController.update);
routes.delete('/interfere/:id', InterfereController.delete);

routes.get('/recips', RecipController.index);
routes.get('/recips/:id', RecipController.indexOne);
routes.post('/recips', RecipController.store);
routes.put('/recips', RecipController.update);
routes.delete('/recips/:id', RecipController.delete);
routes.put('/recips/image/:id', async (req, res) => {
    const image = upload.single('file');
    await image(req, res, err => {
        if (err instanceof multer.MulterError)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Tamanho da imagem excede o limite de 10mb',
                });
            } else {
                return res.status(400).json({ error: err.message });
            }
        const dados = RecipController.updateImage(req, res);
        return dados;
    });
});
routes.put('/recips/image/delete/:key', RecipController.deleteImage);
routes.put('/recips/image/delete/:id/:key', RecipController.deleteUpdateImage);

routes.get('/linhas', LinhaController.index);
routes.get('/linhas/:id', LinhaController.indexOne);
routes.put('/linhas', LinhaController.createUpdate);
routes.post('/linhas', LinhaController.createUpdate);
routes.delete('/linhas/:id', LinhaController.delete);

routes.get('/empresas', EmpresaController.index);
routes.get('/empresas/:id', EmpresaController.indexOne);
routes.put('/empresas', EmpresaController.createUpdate);
routes.post('/empresas', EmpresaController.createUpdate);
routes.delete('/empresas/:id', EmpresaController.delete);

routes.get('/fungos', FungosController.index);
routes.get('/fungos/:id', FungosController.indexOne);
routes.post('/fungos', FungosController.store);
routes.put('/fungos', FungosController.update);
routes.delete('/fungos/:id', FungosController.delete);

routes.get('/parasitas', ParasitasController.index);
routes.get('/parasitas/:id', ParasitasController.indexOne);
routes.post('/parasitas', ParasitasController.store);
routes.put('/parasitas', ParasitasController.update);
routes.delete('/parasitas/:id', ParasitasController.delete);

routes.get('/feriado', FeriadoController.index);
routes.get('/feriado/:id', FeriadoController.indexOne);
routes.post('/feriado', FeriadoController.store);
routes.put('/feriado', FeriadoController.update);
routes.delete('/feriado/:id', FeriadoController.delete);

routes.get('/metodo', MetodoController.index);
routes.get('/metodo/:id', MetodoController.indexOne);
routes.post('/metodo', MetodoController.store);
routes.put('/metodo', MetodoController.update);
routes.delete('/metodo/:id', MetodoController.delete);

routes.get('/materiais', MaterialController.index);
routes.get('/materiais/:id', MaterialController.indexOne);
routes.post('/materiais', MaterialController.store);
routes.put('/materiais', MaterialController.update);
routes.delete('/materiais/:id', MaterialController.delete);
routes.post(
    '/material/:id/valida-permissao',
    MaterialController.validaMaterial
);

routes.get('/filtros', FiltroController.index);
routes.get('/filtros/:id', FiltroController.indexOne);
routes.post('/filtros', FiltroController.store);
routes.put('/filtros', FiltroController.update);
routes.delete('/filtros/:id', FiltroController.delete);

routes.get('/matmed', MatmedController.index);
routes.get('/matmed/:id', MatmedController.indexOne);
routes.get('/matmed/:id/:exame_id', MatmedController.indexOne);
routes.post('/matmed', MatmedController.store);
routes.put('/matmed', MatmedController.update);
routes.delete('/matmed/:id', MatmedController.delete);

routes.get('/motivonc', MotivoncController.index);
routes.get('/motivonc/:id', MotivoncController.indexOne);
routes.post('/motivonc', MotivoncController.store);
routes.put('/motivonc', MotivoncController.update);
routes.delete('/motivonc/:id', MotivoncController.delete);

routes.get('/rotina', RotinaController.index);
routes.get('/rotina/:id', RotinaController.indexOne);
routes.post('/rotina', RotinaController.store);
routes.put('/rotina', RotinaController.update);
routes.delete('/rotina/:id', RotinaController.delete);

routes.get('/situacaos', SituacaoController.index);
routes.get('/situacaos/:id', SituacaoController.indexOne);
routes.post('/situacaos', SituacaoController.store);
routes.put('/situacaos', SituacaoController.update);
routes.delete('/situacaos/:id', SituacaoController.delete);

routes.get('/situacaoexames', SituacaoFiltroController.indexExames);

routes.get('/filtrosituacaos', SituacaoFiltroController.index);
routes.get('/filtrosituacaos/:id', SituacaoFiltroController.indexOne);
routes.post('/filtrosituacaos', SituacaoFiltroController.store);
routes.put('/filtrosituacaos', SituacaoFiltroController.update);
routes.delete('/filtrosituacaos/:id', SituacaoFiltroController.delete);

routes.get('/setoresfila', SetorFilaController.index);
routes.get('/setoresfila/:id', SetorFilaController.indexOne);
routes.post('/setoresfila', SetorFilaController.store);
routes.put('/setoresfila', SetorFilaController.update);
routes.delete('/setoresfila/:id', SetorFilaController.delete);

routes.get('/motinas', MotinaController.index);
routes.get('/motinas/:id', MotinaController.indexOne);
routes.post('/motinas', MotinaController.store);
routes.put('/motinas', MotinaController.update);
routes.delete('/motinas/:id', MotinaController.delete);

routes.get('/entregas', EntregaController.index);
routes.get('/entregas/:id', EntregaController.indexOne);
routes.post('/entregas', EntregaController.store);
routes.put('/entregas', EntregaController.update);
routes.delete('/entregas/:id', EntregaController.delete);

routes.get('/grades', GradeController.index);
routes.get('/grades/:id', GradeController.indexOne);
routes.post('/grades', GradeController.createUpdate);
routes.put('/grades', GradeController.createUpdate);
routes.delete('/grades/:id', GradeController.delete);
routes.get('/gradesetor/', GradeController.gradeSetor);
routes.get('/geramapas/', GradeController.geraMapas);
routes.post('/visualizarmapa', GradeController.visualizarMapa);

routes.get('/questoes', QuestaoController.index);
routes.get('/questoes/:id', QuestaoController.indexOne);
routes.post('/questoes', QuestaoController.createUpdate);
routes.put('/questoes', QuestaoController.createUpdate);
routes.delete('/questoes/:id', QuestaoController.delete);

routes.get('/mapagrade/', MapaGradeController.index);

routes.get('/eqps', EqpController.index);
routes.get('/eqps/:id', EqpController.indexOne);
routes.post('/eqps', EqpController.createUpdate);
routes.put('/eqps', EqpController.createUpdate);
routes.delete('/eqps/:id', EqpController.delete);

routes.get('/frases', FraseController.index);
routes.get('/frases/:id', FraseController.indexOne);
routes.post('/frases', FraseController.createUpdate);
routes.put('/frases', FraseController.createUpdate);
routes.delete('/frases/:id', FraseController.delete);

// APOIO CONTROLLER
routes.get('/apoios', ApoioController.index);
routes.get('/apoios/webservice/:id', ApoioController.webservice);
routes.get('/apoios/:id', ApoioController.indexOne);
routes.post('/apoios', ApoioController.createUpdate);
routes.put('/apoios', ApoioController.createUpdate);
routes.delete('/apoios/:id', ApoioController.delete);

// APOIOEXA CONTROLLER
routes.get('/apoio/:id/exames', ApoioExaController.index);
routes.get('/apoio/exames/:id', ApoioExaController.indexOne);
routes.post('/apoio/:id/exame', ApoioExaController.create);
routes.put('/apoio/exame/:id', ApoioExaController.update);
routes.delete('/apoio/exame/:id', ApoioExaController.delete);
routes.put('/apoio/exame/:id/status', ApoioExaController.updateStatus);

// APOIOPOS CONTROLLER
routes.post('/apoio/:id/posto', ApoioPosController.create);
routes.delete('/apoio/posto/:id', ApoioPosController.delete);

routes.get('/apoiosenv', ApoioEnvController.filtrar);
routes.get('/apoiosenv/ws', ApoioEnvController.filtrarWs);
routes.put('/apoiosenv', ApoioEnvController.enviar);
routes.post('/apoiosenvatend', ApoioEnvController.enviarAtendimento);

routes.get('/orcas', OrcaController.index);
routes.get('/orcas/:id', OrcaController.indexOne);
routes.get('/orcas/exames/:id', OrcaController.indexOne2);
routes.post('/orcas', OrcaController.createUpdate);
routes.put('/orcas', OrcaController.createUpdate);
routes.delete('/orcas/:id', OrcaController.delete);

// Atendimento
routes.get('/atendimentos', AtendimentoController.index);
routes.post('/atendimento', AtendimentoController.createUpdate);
routes.post(
    '/atendimento/autoriza-desconto',
    AtendimentoController.autorizaDesconto
);
routes.post(
    '/atendimento/autoriza-desconto/justificativa',
    AtendimentoController.justificativaDesconto
);
routes.get(
    '/atendimento/:posto/gerar-amostra',
    AtendimentoController.geraAmostra
);
routes.get(
    '/atendimento/exames-cadastrados-mes',
    AtendimentoController.getExamesCadastradosMes
);
routes.get(
    '/atendimento/aprovacao-pacote',
    AtendimentoController.getAprovacaoPacote
);
routes.get(
    '/atendimento/peso-altura-exames',
    AtendimentoController.getPesoAlturaExames
);
routes.get(
    '/atendimento/peso-altura-exames',
    AtendimentoController.getPesoAlturaExames
);
routes.get(
    '/atendimento/:id/exames',
    AtendimentoController.indexExamesByAtendimento
);
routes.get(
    '/atendimento/:id/pagamentos',
    AtendimentoController.indexPagamentosByAtendimento
);
routes.get(
    '/atendimento/:id/valida-exclusao',
    AtendimentoController.validaExclusao
);
routes.get(
    '/atendimento/posto/:posto/amostra/:amostra/:tabela/:movpac',
    AtendimentoController.verificaAmostra
);
routes.get('/calcular-idade', ProntuarioController.calculaIdadePaciente);
routes.get(
    '/prontuario/exames-cadastrados',
    ProntuarioController.examesCadastrados
);
routes.get('/atendimento/caixa-logado', CaixaController.getCaixaLogado);
routes.post(
    '/prontuario/:id/atendimentos',
    ProntuarioController.ultimosAtendimentos
);
routes.get('/atendimento-comprovante-coleta/:id', AtendimentoController.getComprovanteColetaValues);
routes.get('/atendimento-envio-email', AtendimentoController.getEmailEnviado);
routes.post('/atendimento-envio-email', AtendimentoController.enviarDocumentoEmail);
routes.get('/atendimento-recibo-faturamento/:id', AtendimentoController.getReciboFaturamentoValues);
routes.get('/atendimento-mapa-trabalho/:id', AtendimentoController.getMapaTrabalhoValues);
routes.get('/atendimento-guia-tiss/:id', AtendimentoController.getGuiaTissValues);
routes.get('/atendimento-tabela', AtendimentoController.getTabelaValues);
routes.get('/atendimento-etiquetas-exames/:id', AtendimentoController.getEtiquetasExamesValues);
routes.get('/atendimento-gera-etiqueta', AtendimentoController.geraEtiquetasValues);
routes.get('/atendimento/:id', AtendimentoController.indexOne);
routes.delete('/atendimento/:id', AtendimentoController.delete);
routes.get('/busca-codigo/:posto/:amostra', AtendimentoController.indexOneByCodigo)
routes.get('/busca-codigo-raw/:posto/:amostra', AtendimentoController.indexOneByCodigoRaw)
routes.get('/intervalo-amostra/:inicio/:fim', AtendimentoController.indexByIntervaloAmostra)
routes.get('/intervalo-amostra-raw/:inicio/:fim', AtendimentoController.indexByIntervaloAmostraRaw)
routes.get('/atendimentos/resultados', ImpressaoResulController.getResultados)
routes.get('/atendimentos/parciais', ImpressaoResulController.getResultadosParciais)

routes.get('/gera-etiquetas', GeraEtiquetaController.geraEtiquetasValues);

routes.get('/exame/codigo/:codigo', ExameController.indexExamesByCodigo);
routes.get('/exame/:id/data-entrega', ExameController.getDataEntregaExame);
routes.get('/exame/:id/valor-exame', ExameController.getValorExa);
routes.get('/exame/:id/exames-inclusos', ExameController.getExamesInclusos);
routes.get('/exame/:codigo/rotinas', ExameController.getRotinasExame);
routes.get(
    '/exame/:exame_id/plano/:plano_id/valida-descoberto',
    ExameController.validaDescoberto
);
routes.get(
    '/exame/:exame_id/plano/:plano_id/valida-naofatura',
    ExameController.validaNaoFatura
);
routes.get(
    '/exame/:exame_id/plano/:plano_id/limite-exames',
    ExameController.limiteExames
);
routes.get('/exames/guias_exames', ExameController.getGuiasExames);
routes.get('/exames/questionarios', ExameController.getQuestionariosExames);
routes.get('/exames-layouts', ExameController.getExamesLayout);


routes.get('/plano/:plano_id/desconto', PlanoController.getDescontoPlano);
routes.get('/planos/tabela/depara', PlanoController.getDeparaPlano);
// routes.post('/atendimento', AtendimentoController.createUpdate);
// routes.put('/atendimento', AtendimentoController.createUpdate);
// routes.delete('/atendimento/:id', AtendimentoController.delete);

// Setor Impressão
routes.get('/setoresimpressao', SetorImpressaoController.index);
routes.get('/setorimpressao/:id', SetorImpressaoController.indexOne);
routes.post('/setorimpressao', SetorImpressaoController.createUpdate);
routes.put('/setorimpressao/:id', SetorImpressaoController.createUpdate);
routes.delete('/setorimpressao/:id', SetorImpressaoController.delete);
routes.post(
    '/setorimpressao/:id/operador',
    SetorImpressaoController.updateSetorImpressaoOperador
);

//COLETA MATERIAL
routes.get('/coletamaterial', ColetaMaterialController.listarExamesColeta);
routes.post('/coletamaterial', ColetaMaterialController.coletarMaterial);
routes.get('/coletamaterial/procuratubo', ColetaMaterialController.findTube);
routes.post(
    '/coletamaterial/geraretiquetas',
    ColetaMaterialController.gerarEtiquetas
);
routes.post(
    '/coletamaterial/validarlogin',
    ColetaMaterialController.validarLogin
);
routes.post(
    '/coletamaterial/validarloginetiqueta',
    ColetaMaterialController.validarLoginEtiqueta
);

//ENVIO MALOTE
routes.get('/enviomalote/listarmalotes', EnvioMaloteController.listarMalotes);
routes.get(
    '/enviomalote/listarmalotecoleta/:id',
    EnvioMaloteController.listarMaloteColeta
);
routes.put('/enviomalote/imprimirmalote', EnvioMaloteController.imprimirMalote);
routes.get('/enviomalote/listarcoletas', EnvioMaloteController.listarColetas);
routes.post('/enviomalote/gerarmalote', EnvioMaloteController.gerarMalote);
routes.put('/enviomalote/descoletar', EnvioMaloteController.descoletar);

// CAIXA
routes.get('/caixas', CaixaController.index);
routes.get('/caixas/edit/:id', CaixaController.indexOne);
routes.get('/caixas/aberturacaixa', CaixaController.aberturaCaixa);
routes.post('/caixas/ocorrencias', CaixaController.reportOcorrencias);
routes.post('/caixas/fechamento', CaixaController.reportFechamento);
routes.post('/caixas/fechamentocaixa', CaixaController.reportCaixa);
routes.get(
    '/caixas/fechamento/analitico',
    CaixaController.reportFechamentoPosto
);
routes.post('/caixas', CaixaController.createUpdate);
routes.put('/caixas', CaixaController.createUpdate);
routes.put('/caixas/fecharcaixa', CaixaController.fecharCaixa);
routes.put('/caixas/reabrircaixa', CaixaController.reabrirCaixa);

// RECMAT
routes.get('/recmat', RecmatController.index);
routes.get('/recmat/:id', RecmatController.indexOne);
routes.get('/descstatus', RecmatController.descStatus);
routes.put(
    '/recmat/:id/acertacoletarreceber',
    RecmatController.acertaColetarReceber
);
routes.get('/recmat/:id/ccolentrega/', RecmatController.controleColetaEntrega);
routes.put('/recmat/:id/trtofm', RecmatController.trtofm);
routes.put('/recmat/:id/fmtofu', RecmatController.fmtofu);
routes.put('/recmat/:id/recebefmnc', RecmatController.recebefmnc);
routes.put('/recmat/:id/recebefu', RecmatController.recebefu);

routes.get('/libera', LiberaController.index);
routes.get('/libera/:id', LiberaController.indexOne);
routes.get('/liberalaudo/:id', LiberaController.indexOneLaudo);
routes.put('/liberalaudo', LiberaController.update);
routes.post('/liberaanterior', LiberaController.indexAnterior);
routes.get('/graficorastrea/:labcode', LiberaController.indexgraficorastrea);

routes.get('/exames', ExameController.index);
routes.get('/exames/:id', ExameController.indexOne);
routes.put('/exames/', ExameController.createUpdate);
routes.post('/exames/', ExameController.createUpdate);
routes.delete('/exames/:id', ExameController.delete);

routes.get('/layouts', LayoutController.index);
routes.get('/layouts/:id', LayoutController.indexOne);
routes.put('/layouts/', LayoutController.createUpdate);
routes.post('/layouts/', LayoutController.createUpdate);
routes.delete('/layouts/:id', LayoutController.delete);

// Lancamento Resultados
routes.get('/layoutsexm/:id', LayoutController.indexLayoutsByExame);
routes.get(
    '/layoutsexmalt/:id',
    LayoutController.indexLayoutsAlternativosByExame
);
routes.get('/frasesexm/:id', FraseController.indexFrasesByExame);
routes.get('/resulant', ExameController.indexResultadosAnteriores);
routes.get(
    '/lancaresul/autocompletar',
    LancamentoResultadoController.autoCompletar
);
routes.post('/lancaresul', LancamentoResultadoController.updateResultado);
routes.get('/lancaresul/pacientes', LancamentoResultadoController.index);
routes.get('/lancaresul/exames/:id', LancamentoResultadoController.indexOne);
routes.get('/lancaresul/movexa/:id', LancamentoResultadoController.indexOne2);
routes.post('/assinaexames', LancamentoResultadoController.assinaExames);
routes.post(
    '/imprimirresultado',
    LancamentoResultadoController.imprimirResultado
);
routes.get(
    '/fundolaudo',
    LancamentoResultadoController.escolherFundoImpressao
);
//

routes.get('/tablogreg', TabLogRegController.indexOne);
routes.get('/rastrea', TabLogRegController.indexRastrea);
routes.get('/etiquetas', TabLogRegController.indexEtiquetas);
routes.get('/tablogreg-opera', TabLogRegController.indexOneOpera);

routes.get('/tablogcad', TabLogCadController.index);
routes.post('/tablogcad', TabLogCadController.create);

routes.get('/setores', SetorController.index);
routes.get('/setores/:id', SetorController.indexOne);
routes.post('/setores', SetorController.store);
routes.put('/setores', SetorController.update);
routes.delete('/setores/:id', SetorController.delete);

routes.post('/novacoleta', NovaColetaController.store);
routes.get('/andamentonovacol', NovaColetaController.index);
routes.get('/andamentonovacol/:id', NovaColetaController.indexOne);
routes.post('/andamentonovacol', NovaColetaController.update);

routes.post('/repeteexa', RepeteExaController.store);
routes.post('/entregapac', EntregaPacController.store);

routes.get('/convenios', ConvenioController.index);
routes.get('/convenios/:id', ConvenioController.indexOne);
routes.put('/convenios', ConvenioController.createUpdate);
routes.post('/convenios', ConvenioController.createUpdate);
routes.delete('/convenios/:id', ConvenioController.delete);
routes.post(
    '/convenio/:id/valida-vencimento',
    ConvenioController.validaVencimento
);
routes.get('/convenio/:id/valida', ConvenioController.validaConvenio);

routes.get(
    '/convenio_tiss/list/:convenio_id',
    ConvenioTissController.indexConv
);

routes.put('/guia-tiss-logo/:id', (req, res) => {
    const file = upload.single('file');
    file(req, res, async err => {
      if (err instanceof multer.MulterError)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'Tamanho da imagem excede o limite de 10mb'
          });
        } else {
          return res.status(400).json({ error: err.message });
        }
      const dados = await ConvenioController.saveFile(req, res);
      return dados;
    });
});

routes.get('/guia-tiss-image-convertion', AtendimentoController.getImageBase64Value);

routes.delete('/guia-tiss-logo/:id/:key', ConvenioController.deleteFile);

routes.get('/planos', PlanoController.index);
routes.get('/planos/calculo-exam', PlanoController.indexCalculoExame);
routes.get('/planos/:id', PlanoController.indexOne);
routes.get('/planosconv/:convenio_id', PlanoController.indexConv);
routes.get('/planosvalorexa', PlanoController.indexValorexa);
routes.put('/planos', PlanoController.createUpdate);
routes.post('/planos', PlanoController.createUpdate);
routes.delete('/planos/:id', PlanoController.delete);

routes.get('/medicos', MedicoController.index);
routes.get('/medicos/:id', MedicoController.indexOne);
routes.post('/medicos', MedicoController.createUpdate);
routes.put('/medicos', MedicoController.createUpdate);
routes.delete('/medicos/:id', MedicoController.delete);

routes.get('/medicosrea', MedicoReaController.index);
routes.get('/medicosrea/:id', MedicoReaController.indexOne);
routes.post('/medicosrea', MedicoReaController.createUpdate);
routes.put('/medicosrea', MedicoReaController.createUpdate);
routes.delete('/medicosrea/:id', MedicoReaController.delete);

routes.put('/movpac/medicorea', MedicoReaController.updateMedicoreaMovpac);

routes.get('/espmeds', EspmedController.index);
routes.get('/espmeds/:id', EspmedController.indexOne);
routes.post('/espmeds', EspmedController.store);
routes.put('/espmeds', EspmedController.update);
routes.delete('/espmeds/:id', EspmedController.delete);

routes.get('/produtos', ProdutoController.index);

routes.get('/prontuarios', ProntuarioController.index);
routes.get('/prontuarios/:id', ProntuarioController.indexOne);
routes.get('/prontuarios-find', ProntuarioController.findProntuarioByNameAndBirthDate);
routes.post('/prontuarios', ProntuarioController.store);
routes.put('/prontuarios', ProntuarioController.update);
routes.delete('/prontuarios/:id', ProntuarioController.delete);

routes.put('/prontuarios/fotopac/:id', async (req, res) => {
    const fotopac = upload.single('file');
    await fotopac(req, res, err => {
        if (err instanceof multer.MulterError)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Tamanho da imagem excede o limite de 10mb',
                });
            } else {
                return res.status(400).json({ error: err.message });
            }
        const dados = ProntuarioController.updateFotopac(req, res);
        return dados;
    });
});
routes.put(
    '/prontuarios/fotopac/delete/:key',
    ProntuarioController.deleteFotopac
);

routes.get('/laboratorios', LaboratoriosController.index);
routes.get('/laboratorios/:id', LaboratoriosController.index1);
routes.get('/laboratoriospowerbi/:codigo', LaboratoriosController.indexPowerBi);
routes.post('/laboratorios', LaboratoriosController.store);
routes.put('/laboratorios', LaboratoriosController.update);
routes.delete('/laboratorios/:id', LaboratoriosController.delete);

routes.get('/unidades', UnidadesController.index);
routes.post('/unidades', UnidadesController.store);
routes.put('/unidades', UnidadesController.update);
routes.delete('/unidades/:id', UnidadesController.delete);

// Relatorios
routes.get('/relatoriopacdevedor', RelatorioPacController.index);

// AGENDADOS
routes.post('/agendados/envio-email', AgendadoController.sendEmail);

routes.get('/agendados', AgendadoController.index);
routes.get('/agendados/:id', AgendadoexmController.index);
routes.get('/agendadosDashLab/:labid', AgendadoController.indexDashLab);
routes.get('/agendadosexames/:id', AgendadoexmController.indexExames);
routes.post('/agendados', AgendadoController.createUpdate);
routes.delete('/agendados/:id', AgendadoController.delete);

// PREAGENDADOS
routes.get('/preagendados', PreagendadoController.index);
routes.get('/preagendados/:id', PreagendadoController.indexOne);
routes.get('/preagendadosDashLab/:labid', PreagendadoController.indexDashLab);
routes.get('/preagendadospedidomedico/:id', PreagendadoController.indexPedido);
routes.post('/preagendados', PreagendadoController.store);
routes.put('/preagendados', PreagendadoController.update);
routes.delete('/preagendados/:id', PreagendadoController.delete);

// Financial Receber
routes.get('/financial/receber', ReceberFinancialController.index);
routes.get('/financial/receber/:id', ReceberFinancialController.indexOne);
routes.get('/financial/saccontra/:id', ReceberFinancialController.index3);
routes.get('/recebernfseconsultar', ReceberFinancialController.nfse_consultar);
routes.get('/receberboletoconsultar', ReceberFinancialController.boleto_consultar);

// Extrato Bancário
routes.post('/extratobancario', ExtratoBancarioController.index);

// Pagar
routes.get('/pagar', PagarController.index);
routes.get('/pagar/:id', PagarController.indexOne);
routes.get('/pagar1/:id', Pagar1Controller.index);
routes.get('/pagar2/:id', Pagar2Controller.index);
routes.post('/pagar', PagarController.createUpdate);
routes.put('/pagar', PagarController.createUpdate);
routes.put('/pagar/:id/cancelar', PagarController.cancelar);
routes.put('/pagar/:id/estornar', PagarController.estorno);
routes.put('/pagar/:id/pagamento', PagarController.pagamento);

// Fornecedor
routes.get('/fornecedor', FornecedorController.index);
routes.get('/fornecedor/:id', FornecedorController.indexOne);
routes.post('/fornecedor', FornecedorController.store);
routes.put('/fornecedor', FornecedorController.update);
routes.delete('/fornecedor/:id', FornecedorController.delete);

// FATURAMENTO
routes.get('/faturamentoconvenio', FaturamentoConvenioController.index);
routes.put('/faturamentoconvenio', FaturamentoConvenioController.update);
//

// FATURAMENTO
routes.get('/lotes-faturamento/convenio/:convenio_id', LotesFaturamentoController.getLotes);
routes.get('/lotes-faturamento/:lote_id/pacientes', LotesFaturamentoController.getPacientesByLote);
routes.put('/lotes-faturamento/:lote_id/fechar', LotesFaturamentoController.fecharLote);
routes.put('/lotes-faturamento/:lote_id/reabrir', LotesFaturamentoController.reabrirLote);
routes.post('/lotes-faturamento/:lote_id/excluir', LotesFaturamentoController.excluirLote);

routes.post('/atendimento/:id/convenios/lotes', LotesFaturamentoController.getLotesConvenios);
routes.get('/atendimento/:id/lote-atual', LotesFaturamentoController.getInfoLoteAtual);

// Gerar arquivo TISS
routes.post('/gera-tiss/:metodo', GeraTissController.geraArquivoTiss);

// Contas bancarias
routes.get('/contas', ContasController.index);
routes.get('/contas/:id', ContasController.indexOne);
routes.get('/fluxocaixa', ContasController.indexFluxoCaixa);

routes.post('/contas', ContasController.createOrUpdate);
routes.post('/contas/email', ContasController.emailTest);
routes.put('/contas', ContasController.createOrUpdate);
routes.put('/contas/files/:id/:inputName', (req, res) => {
    const file = upload.single('file');
    file(req, res, async err => {
        if (err instanceof multer.MulterError)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: 'Tamanho da imagem excede o limite de 10mb',
                });
            } else {
                return res.status(400).json({ error: err.message });
            }
        const dados = await ContasController.saveFile(req, res);
        return dados;
    });
});
routes.delete('/contas/files/:id/:key/:inputName', ContasController.deleteFile);
routes.delete('/contas/:id', ContasController.delete);

// Custo
routes.get('/ccusto', CcustoController.index);
routes.get('/ccusto/:id', CcustoController.indexOne);
routes.post('/ccusto', CcustoController.createOrUpdate);
routes.put('/ccusto', CcustoController.createOrUpdate);
routes.delete('/ccusto/:id', CcustoController.delete);

// Plcontas
routes.get('/plcontas', PlcontasController.index);
routes.get('/plcontas/:id', PlcontasController.indexOne);
routes.post('/plcontas', PlcontasController.createOrUpdate);
routes.put('/plcontas', PlcontasController.createOrUpdate);
routes.delete('/plcontas/:id', PlcontasController.delete);

routes.get('/sacado', SacadoController.index);
routes.get('/sacado/:id', SacadoController.indexOne);
routes.post('/sacado', SacadoController.createOrUpdate);
routes.put('/sacado', SacadoController.createOrUpdate);
routes.delete('/sacado/:id', SacadoController.delete);

routes.get('/repre', RepresentanteController.index);

// Paramf
routes.get('/paramf', ParamfController.index);
routes.put('/paramf', ParamfController.update);

// Receber
routes.get('/receber', ReceberController.index);
routes.get('/receber/:id', ReceberController.indexOne);
routes.get('/receber1/:id', Receber1Controller.index);
routes.get('/receber2/:id', Receber2Controller.index);
routes.post('/receber', ReceberController.createUpdate);
routes.put('/receber', ReceberController.createUpdate);
routes.put('/receber/:id/cancelar', ReceberController.cancelar);
routes.put('/receber/:id/estornar', ReceberController.estorno);
routes.put('/receber/:id/recebimento', ReceberController.recebimento);

// Operador
routes.get('/operador', OperadorController.index);
routes.get('/operador/:id', OperadorController.indexOne);
routes.post('/operador', OperadorController.createUpdate);
routes.put('/operador', OperadorController.createUpdate);
routes.delete('/operador/:id', OperadorController.delete);

// Nivel
routes.get('/nivel', NivelController.index);
routes.get('/nivel/:id', NivelController.indexOne);
routes.get('/setnivel/:id', NivelController.nivelOne);
routes.post('/nivel', NivelController.createUpdate);
routes.put('/nivel', NivelController.createUpdate);
routes.delete('/nivel/:id', NivelController.delete);

// Protocolo
routes.get('/protocolo', ProtocoloController.index);
routes.put('/protocolo', ProtocoloController.update);

// USERS
routes.get('/users', UserController.index);
routes.put('/users', UserController.update);
routes.delete('/users/:id', UserController.delete);

// Utils
routes.get('/procsql', UtilController.procSQL);
routes.get('/gera-id', UtilController.geraId);

// NOTIFICACAO
routes.post('/notificacaos', NotificacaoController.store);
// NOTIFICACAO ONESIGNAL PUSH - ORCAMENTO PARTICULAR
routes.get(
    '/notificationPush/:preagendado_id',
    NotificationController.createpush
);

// UPLOAD IMAGENS
routes.post(
    '/pedidomedico/:id',
    upload.single('file'),
    PedidosmedicoController.store
);
routes.delete('/pedidomedico/:key', PedidosmedicoController.delete);

routes.get('/operadorperm', OperadorPermController.index);
routes.get('/operadorpermpostoconv', OperadorPermController.indexPermPostoConv);
routes.get('/operadorpermparam', OperadorPermController.indexParametro);
routes.get('/operadorpermoperador', OperadorPermController.indexOperador);
routes.get('/operadorpermmulti', OperadorPermController.indexOperadorMulti);
routes.get('/operadorpermmenu', OperadorPermController.indexMenu);
routes.put('/authpermission', AuthPermissonController.update);

const avatarUpload = upload.single('file');
routes.put('/avatar', (req, res) => {
    avatarUpload(req, res, err => {
        if (err) return res.status(400).json({ message: err.message });

        // eslint-disable-next-line no-unused-vars
        const { originalname: name, key, Location: url } = req.file;

        const newUrl =
            url === undefined ? `${process.env.APP_URL}/files/${key}` : url;

        return res.status(200).json({ avatar_key: key, avatar_url: newUrl });
    });
});

routes.put('/avatar/:key', OperadorPermController.deleteAvatar);

export default routes;
