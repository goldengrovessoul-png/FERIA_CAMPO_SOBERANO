import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'feria_campo_soberano',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Probar conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL Local');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
