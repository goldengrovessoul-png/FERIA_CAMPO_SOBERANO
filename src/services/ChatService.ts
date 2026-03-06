import { supabase } from '../lib/supabase';

export interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

export const ChatService = {
    /**
     * Enviar un mensaje
     */
    async sendMessage(senderId: string, receiverId: string, content: string) {
        if (content.length > 220) {
            throw new Error('El mensaje excede los 220 caracteres permitidos.');
        }

        const { data, error } = await supabase
            .from('chat_messages')
            .insert([
                { sender_id: senderId, receiver_id: receiverId, content }
            ])
            .select()
            .single();

        if (error) throw error;
        return data as ChatMessage;
    },

    /**
     * Obtener historial de mensajes entre dos usuarios
     */
    async getMessages(user1: string, user2: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`*`)
            .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    /**
     * Marcar mensajes como leídos
     */
    async markAsRead(receiverId: string, senderId: string) {
        const { error } = await supabase
            .from('chat_messages')
            .update({ read: true })
            .eq('receiver_id', receiverId)
            .eq('sender_id', senderId)
            .eq('read', false);

        if (error) throw error;
    },

    /**
     * Obtener conteo de mensajes no leídos por remitente
     */
    async getUnreadCounts(receiverId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('sender_id')
            .eq('receiver_id', receiverId)
            .eq('read', false);

        if (error) throw error;

        // Agrupar por sender_id
        const counts: Record<string, number> = {};
        data.forEach(msg => {
            counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });
        return counts;
    },

    /**
     * Suscribirse a nuevos mensajes para el usuario actual
     */
    subscribeToMessages(userId: string, onMessage: (message: ChatMessage) => void) {
        return supabase
            .channel('chat_room_global') // Un solo canal para todos los eventos de la tabla
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                },
                (payload) => {
                    const msg = payload.new as ChatMessage;
                    // Filtramos aquí manualmente para máxima fiabilidad
                    if (msg.receiver_id === userId) {
                        onMessage(msg);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[ChatService] Estado suscripción para ${userId}:`, status);
            });
    }
};
