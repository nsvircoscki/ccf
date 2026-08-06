// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflowRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import servicoRoutes from './routes/servicoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import imovelRoutes from './routes/imovelRoutes.js';
import confrontanteRoutes from './routes/confrontanteRoutes.js';
import documentoRoutes from './routes/documentoRoutes.js';

const app = express();

app.use(cors());
// O cadastro envia a imagem do mapa embutida em base64; o limite padrão do
// express.json (100kb) rejeitaria qualquer print de tela.
app.use(express.json({ limit: '25mb' }));

// Montagem das rotas limpas
app.use('/workflows', workflowRoutes);
app.use('/tickets', ticketRoutes);
app.use('/servicos', servicoRoutes);
app.use('/clientes', clienteRoutes);
app.use('/imoveis', imovelRoutes);
app.use('/confrontantes', confrontanteRoutes);
app.use('/documentos', documentoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` API rodando na porta ${PORT}`);
});