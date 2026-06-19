import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import unidadesRoutes from './routes/unidades.js';
import reunioesRoutes from './routes/reunioes.js';
import { anexoCreateRouter, anexoDeleteRouter } from './routes/anexos.js';
import ldapRoutes from './routes/ldap.js';
import usuariosRoutes from './routes/usuarios.js';

const app = express();
const PORT = parseInt(process.env.SERVER_PORT || '3001');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/unidades-negocio', unidadesRoutes);
app.use('/api/reunioes', reunioesRoutes);
app.use('/api/reunioes/:meetingId/anexos', anexoCreateRouter);
app.use('/api/anexos', anexoDeleteRouter);
app.use('/api/configuracao-ldap', ldapRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Erro não tratado]', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`[Agemar API] Servidor rodando em http://localhost:${PORT}`);
});
