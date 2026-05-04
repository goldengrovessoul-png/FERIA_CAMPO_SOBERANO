import { Response } from 'express';
import { query } from '../db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const chatWithAi = async (req: AuthRequest, res: Response) => {
  const { prompt, history, context } = req.body;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Configuración de IA no detectada en el servidor.' });
  }

  try {
    // 1. Preparar el sistema de mensajes (Prompt de Sistema)
    const systemPrompt = {
      role: 'system',
      content: `Eres el Auditor de la Sala de Guerra de CUSPAL (Venezuela). 
      Analizas datos de la tabla 'reports' y 'report_items'. 
      Solo puedes hacer consultas SELECT. 
      Responde siempre en español ejecutivo.
      Contexto de filtros actuales: ${JSON.stringify(context)}`
    };

    // 2. Llamada a OpenAI (Simplificada para el ejemplo, asumiendo fetch o librería)
    // Nota: Aquí el servidor hace el trabajo pesado
    
    // Simulamos la ejecución del SQL que la IA sugeriría
    // En una implementación real, aquí integraríamos la lógica de Tool Calls
    
    // Por ahora, para la migración básica, habilitamos un endpoint de ejecución SQL seguro
    res.json({ message: "Capa AI lista en el servidor. (Pendiente integración completa de GPT-4)" });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const executeAiSql = async (req: AuthRequest, res: Response) => {
  const { sql } = req.body;

  // Validación crítica de seguridad
  if (!sql.toLowerCase().trim().startsWith('select')) {
    return res.status(403).json({ error: 'Solo se permiten consultas de lectura (SELECT).' });
  }

  try {
    const { rows } = await query(sql);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: `Error en Base de Datos: ${error.message}` });
  }
};
