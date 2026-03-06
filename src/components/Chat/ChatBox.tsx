import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Check, CheckCheck, MessageSquare, X } from 'lucide-react';
import { ChatService } from '../../services/ChatService';
import type { ChatMessage } from '../../services/ChatService';
import { useAuth } from '../../lib/AuthContext';

interface ChatBoxProps {
    receiverId: string;
    receiverName: string;
    onClose?: () => void;
    isAdminView?: boolean;
}

const ChatBox: React.FC<Exclude<ChatBoxProps, 'isAdminView'>> = ({ receiverId, receiverName, onClose }) => {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const MAX_CHARS = 220;

    console.log(`[ChatBox] Iniciado con receiverId: ${receiverId} (${receiverName})`);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    /**
     * Cargar mensajes del servidor
     */
    const loadMessages = async () => {
        if (!profile?.id) return;
        try {
            const data = await ChatService.getMessages(profile.id, receiverId);
            setMessages(data);
            setLoading(false);
            scrollToBottom();

            // Marcar como leídos al cargar
            await ChatService.markAsRead(profile.id, receiverId);
        } catch (err) {
            console.error('Error cargando mensajes:', err);
        }
    };

    useEffect(() => {
        loadMessages();

        // Suscripción en tiempo real
        if (profile?.id) {
            const channel = ChatService.subscribeToMessages(profile.id, (msg) => {
                console.log('[ChatBox] Nuevo mensaje recibido por Realtime:', msg);
                if (msg.sender_id === receiverId) {
                    setMessages(prev => {
                        // Evitar duplicados por si acaso el mensaje enviado localmente ya está
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    scrollToBottom();

                    // Marcar como leído inmediatamente ya que el chat está abierto
                    ChatService.markAsRead(profile.id, receiverId).catch(console.error);
                }
            });

            return () => {
                channel.unsubscribe();
            };
        }
    }, [receiverId, profile?.id]);

    useEffect(scrollToBottom, [messages]);

    /**
     * Enviar mensaje
     */
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile?.id || newMessage.length > MAX_CHARS) return;

        const currentMsg = newMessage.trim();
        setNewMessage(''); // Limpiar input para UI rápida

        try {
            const sentMsg = await ChatService.sendMessage(profile.id, receiverId, currentMsg);
            setMessages(prev => [...prev, sentMsg]);
            scrollToBottom();
        } catch (err) {
            console.error('Error al enviar:', err);
            setNewMessage(currentMsg); // Devolver texto si falla
        }
    };

    const remainingChars = MAX_CHARS - newMessage.length;
    const isOverLimit = newMessage.length > MAX_CHARS;

    return (
        <div className={`flex flex-col h-[500px] w-full max-w-md bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden`}>
            {/* Cabecera */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm leading-none">{receiverName}</h3>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-bold">En línea</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                )}
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                        <MessageSquare className="w-10 h-10 mb-2 text-slate-700" />
                        <p className="text-xs text-slate-500">No hay mensajes aún.<br />¡Saluda iniciando la conversación!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_id === profile?.id ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-50 text-[9px]">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender_id === profile?.id && (
                                        msg.read ? <CheckCheck className="w-3 h-3 text-cyan-400" /> : <Check className="w-3 h-3" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input con contador */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="relative">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className={`w-full bg-black/30 border ${isOverLimit ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-blue-500/50'} text-white text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all resize-none h-14 custom-scrollbar`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />

                    {/* Botón enviar */}
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isOverLimit}
                        className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${newMessage.trim() && !isOverLimit ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* Contador estilo X (Twitter) */}
                <div className="flex justify-end mt-2 items-center gap-2">
                    <span className={`text-[10px] font-bold tracking-tighter ${remainingChars < 0 ? 'text-red-400' : remainingChars <= 20 ? 'text-yellow-400' : 'text-white/30'}`}>
                        {remainingChars} / {MAX_CHARS}
                    </span>
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${isOverLimit ? 'bg-red-500' : remainingChars <= 20 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, (newMessage.length / MAX_CHARS) * 100)}%` }}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;
