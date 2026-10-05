// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { garantirSegredoJwt } from './config/jwt.js';
import { autenticar, exigirSetor } from './middlewares/autenticar.js';
import workflowRoutes from './routes/workflowRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import servicoRoutes from './routes/servicoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import imovelRoutes from './routes/imovelRoutes.js';
import documentoRoutes from './routes/documentoRoutes.js';
import cartorioRoutes from './routes/cartorioRoutes.js';
import authRoutes from './routes/authRoutes.js';
import tipoProcessoRoutes from './routes/tipoProcessoRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cobrancaRoutes from './routes/cobrancaRoutes.js';
import notaFiscalRoutes from './routes/notaFiscalRoutes.js';
import tarefaRoutes from './routes/tarefaRoutes.js';
import sisPontoRoutes from './routes/sisPontoRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import pontoExportRoutes from './routes/pontoExportRoutes.js';
import { gerarPrevistas } from './services/ponto/batidaService.js';

// Para aqui, com mensagem clara, se faltar o segredo — ver config/jwt.js.
garantirSegredoJwt();

const app = express();

app.use(cors());
// O cadastro envia a imagem do mapa embutida em base64; o limite padrão do
// express.json (100kb) rejeitaria qualquer print de tela.
app.use(express.json({ limit: '25mb' }));

// Única rota aberta: é por ela que a pessoa consegue o token. As rotas dela
// que exigem sessão (/me, /alterar-senha) aplicam o autenticar por conta própria.
app.use('/auth', authRoutes);

// Export de pontos pro PC da folha: token de máquina (PONTO_EXPORT_TOKENS) em
// vez de sessão. Precisa vir antes do /sis-ponto autenticado abaixo; caminhos
// que não forem do export seguem adiante normalmente.
app.use('/sis-ponto', pontoExportRoutes);

// Todo o resto exige sessão: autenticar identifica quem chama e preenche
// req.usuario antes de qualquer rota rodar.
app.use('/workflows', autenticar, workflowRoutes);
app.use('/tickets', autenticar, ticketRoutes);
app.use('/servicos', autenticar, servicoRoutes);
app.use('/clientes', autenticar, clienteRoutes);
app.use('/imoveis', autenticar, imovelRoutes);
app.use('/documentos', autenticar, documentoRoutes);
app.use('/cartorios', autenticar, cartorioRoutes);
app.use('/tipos-processo', autenticar, tipoProcessoRoutes);
app.use('/notificacoes', autenticar, notificationRoutes);
app.use('/cobrancas', autenticar, cobrancaRoutes);
app.use('/notas-fiscais', autenticar, notaFiscalRoutes);
app.use('/tarefas', autenticar, tarefaRoutes);
app.use('/sis-ponto', autenticar, sisPontoRoutes);
// Cadastro de pessoas: só a administração.
app.use('/usuarios', autenticar, exigirSetor('ENG', 'DEV'), usuarioRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` API rodando na porta ${PORT}`);
});

// Horários da jornada que ficaram sem batida (esquecimento/falta) viram
// "previstos" para o ENG decidir. Roda ao subir e a cada 30 min; também roda
// antes da revisão e do export.
const atualizarPrevistas = () => gerarPrevistas().catch((erro) => console.error('Erro ao gerar horários previstos:', erro.message));
setTimeout(atualizarPrevistas, 10 * 1000);
setInterval(atualizarPrevistas, 30 * 60 * 1000);
