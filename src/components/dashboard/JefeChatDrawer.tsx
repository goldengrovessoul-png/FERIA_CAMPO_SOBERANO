import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { AiAuditService } from '../../services/AiAuditService';
import type { ChatMessage } from '../../services/AiAuditService';

interface JefeChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentContext: any;
}

const JefeChatDrawer: React.FC<JefeChatDrawerProps> = ({ isOpen, onClose, currentContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al final
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await AiAuditService.getChatCompletion(
                [...messages, userMsg],
                currentContext
            );
            
            if (response) {
                setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            }
        } catch (err: any) {
            setError(err.message || 'Error en comunicación con el sistema.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex pointer-events-none">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
                onClick={onClose}
            />

            {/* Side Panel (Left) */}
            <div className={`
                relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col
                transition-transform duration-500 ease-out pointer-events-auto
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Header - Premium Look */}
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg ring-1 ring-amber-500/50">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Chat del Jefe</h2>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Auditoría Estratégica en Tiempo Real
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                                <Bot className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-slate-600 font-bold text-lg mb-2">Sala de Guerra Digital</h3>
                            <p className="text-slate-500 text-sm max-w-[240px]">
                                El sistema ha captura el contexto actual. 
                                ¿Qué auditoría necesita, Jefe?
                            </p>
                            <div className="mt-8 flex flex-wrap gap-2 justify-center">
                                <button 
                                    onClick={() => setInputValue('¿Cómo va la distribución de frutas hoy?')}
                                    className="px-4 py-2 bg-white rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
                                >
                                    Estadísticas de Frutas
                                </button>
                                <button 
                                    onClick={() => setInputValue('¿Qué estados tienen alertas de hortalizas?')}
                                    className="px-4 py-2 bg-white rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
                                >
                                    Alertas por Estado
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div 
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`
                                max-w-[85%] flex gap-3
                                ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
                            `}>
                                <div className={`
                                    w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                                    ${msg.role === 'user' ? 'bg-slate-800' : 'bg-white border border-slate-200'}
                                `}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                                </div>
                                <div className={`
                                    p-4 rounded-2xl shadow-sm leading-relaxed text-sm
                                    ${msg.role === 'user' 
                                        ? 'bg-slate-800 text-white rounded-tr-none' 
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}
                                `}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                </div>
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <span className="text-slate-400 text-xs font-medium">Auditor analizando datos...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-xs text-red-800 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Consultar al auditor..."
                            className="flex-1 bg-slate-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-slate-900 transition-all font-medium placeholder:text-slate-400"
                        />
                        <button 
                            disabled={!inputValue.trim() || isLoading}
                            onClick={handleSend}
                            className={`
                                p-4 rounded-2xl shadow-lg transition-all
                                ${!inputValue.trim() || isLoading 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95'}
                            `}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-tighter">
                        Sala de Guerra Estratégica • Feria Campo Soberano
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JefeChatDrawer;
