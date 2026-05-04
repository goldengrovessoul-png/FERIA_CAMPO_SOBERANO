import { apiClient } from '../lib/api';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
}

export interface DashboardContext {
    filtros_activos?: {
        estado?: string;
        ente?: string;
        rubro?: string;
        rango_fechas?: string;
    };
    resumen_actual?: Record<string, unknown>;
}

export class AiAuditService {
    static async getChatCompletion(userPrompt: string, history: ChatMessage[], context: DashboardContext): Promise<string> {
        try {
            const response = await apiClient.post('/ai/chat', {
                prompt: userPrompt,
                history,
                context
            });

            return response.data.message;
        } catch (err: any) {
            console.error('Error en Auditoría AI:', err);
            return `❌ ERROR DE CONEXIÓN IA: ${err.response?.data?.error || err.message}`;
        }
    }
}
