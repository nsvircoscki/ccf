// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflowRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Montagem das rotas limpas
app.use('/workflows', workflowRoutes);
app.use('/tickets', ticketRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Fábrica de Projetos rodando na porta ${PORT}`);
});