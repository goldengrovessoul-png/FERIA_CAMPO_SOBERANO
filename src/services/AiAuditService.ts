import { supabase } from '../lib/supabase';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
    tool_calls?: any[];
}

export class AiAuditService {
    private static API_URL = 'https://api.openai.com/v1/chat/completions';

    static async getChatCompletion(userPrompt: string, history: ChatMessage[], context: any): Promise<string> {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('Configuración de IA no detectada en el entorno.');
        }

        const systemMessage: ChatMessage = {
            role: 'system',
            content: `# PROMPT DE SISTEMA: ANALISTA ESTRATÉGICO CUSPAL

## IDENTIDAD Y TONO
Eres un Analista de Datos Senior experto en la operación de CUSPAL y las Ferias del Campo Soberano del Ministerio del Poder Popular para la Alimentación (MINPPAL) de Venezuela. 
- Tu tono es profesional, ejecutivo y estratégico.
- Te diriges a Ministros, Directores y Jefes de Operación.
- Siempre respondes en Español.

## CONOCIMIENTO DE DATOS
Tu fuente de verdad es la base de datos PostgreSQL con las siguientes tablas:
1. **reports**: Jornadas de Feria. Campos clave: id, fecha, tipo_actividad, empresa (ente), estado_geografico, municipio, personas, familias, comunas, total_proteina, total_secos, total_frutas, total_hortalizas, total_verduras, guia_sica_estado ('SÍ'/'NO').
2. **report_items**: Desglose de rubros por report_id (vínculo: reports.id = report_items.report_id). Campos: rubro, cantidad.
3. **state_product_planning**: Planificación por estado (metas). Campos: estado, rubro, meta_tn, recibido_tn.
4. **catalog_items**: Precios de referencia. Campos: name (rubro), precio_privado, precio_referencia.

## REGLAS DE RESPUESTA
1. **Analizar antes de actuar**: Explica brevemente qué datos vas a consultar.
2. **Seguridad**: Solo usas consultas SELECT a través de la herramienta disponible.
3. **Presentación**: Usa tablas markdown limpias para comparativas.
4. **Insights**: Al final de cada respuesta, añade el apartado "💡 ANÁLISIS ESTRATÉGICO" resaltando anomalías o éxitos.

## RESTRICCIONES
- No inventes datos. Si no hay data, indica "Data no disponible". Solo los datos devueltos por la herramienta SQL son reales.
- No reveles que eres una IA. Eres el Auditor de la Sala de Guerra.

SITUACIÓN ACTUAL DEL DASHBOARD (FILTROS):
${JSON.stringify({
    estado: context.filtros_activos?.estado,
    ente: context.filtros_activos?.ente,
    rubro: context.filtros_activos?.rubro,
    rango_fechas: context.filtros_activos?.rango_fechas,
    resumen_visual: context.resumen_actual
}, null, 2)}`
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

        try {
            const messages = [systemMessage, ...history, { role: 'user', content: userPrompt }];

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: messages,
                    tools: [{
                        type: 'function',
                        function: {
                            name: 'execute_sql_query',
                            description: 'Ejecuta una consulta SQL SELECT sobre la base de datos de CUSPAL.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    query: {
                                        type: 'string',
                                        description: 'Consulta SQL SELECT válida'
                                    }
                                },
                                required: ['query']
                            }
                        }
                    }],
                    tool_choice: 'auto'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Error del servidor IA: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message;

            // Manejar Tool Calls (SQL)
            if (assistantMessage.tool_calls) {
                const toolCall = assistantMessage.tool_calls[0];
                const query = JSON.parse(toolCall.function.arguments).query;

                // Validación de seguridad básica
                if (!query.toLowerCase().trim().startsWith('select')) {
                    return "ERROR DE SEGURIDAD: Solo se permiten consultas de lectura (SELECT).";
                }

                // Ejecutar SQL vía RPC en Supabase
                const { data: queryResult, error: queryError } = await supabase.rpc('exec_sql', { sql_query: query });

                if (queryError) {
                    throw new Error(`Error en Base de Datos: ${queryError.message}`);
                }

                // Enviar resultado de vuelta a la IA para el análisis final
                const finalResponse = await fetch(this.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            ...messages,
                            assistantMessage,
                            {
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                name: 'execute_sql_query',
                                content: JSON.stringify(queryResult)
                            }
                        ]
                    })
                });

                const finalData = await finalResponse.json();
                return finalData.choices[0].message.content;
            }

            return assistantMessage.content;

        } catch (err: any) {
            if (err.name === 'AbortError') {
                return "⚠️ TIEMPO DE RESPUESTA AGOTADO: La consulta tomó más de 10 segundos. Por favor, intenta una pregunta más específica.";
            }
            return `❌ ERROR DE CONEXIÓN: ${err.message}`;
        }
    }
}
