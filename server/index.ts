import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bodegaRoutes from './routes/bodegaRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import planningRoutes from './routes/planningRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from './middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- REGISTRO DE RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/bodegas', bodegaRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/admin', adminRoutes);

// Servir archivos estáticos de fotos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- RUTAS BASE ---

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      message: 'Servidor Feria Campo Soberano Activo',
      db_time: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error de conexión a la DB' });
  }
});

// Ejemplo de ruta para obtener reportes (simulando lo que hacía Supabase)
app.get('/api/reportes', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM reportes ORDER BY fecha DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
});
