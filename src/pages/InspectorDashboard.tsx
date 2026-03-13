import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, LogOut, ChevronRight, CheckCircle2, FileEdit, User, MapPin, Loader2, RefreshCw, Camera, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ChatBox from '../components/Chat/ChatBox';
import { MessageCircle, X } from 'lucide-react';
import { ChatService } from '../services/ChatService';
import type { ChatMessage } from '../services/ChatService';

interface Report {
    id: string;
    tipo_actividad: string;
    parroquia: string;
    fecha: string;
    estado_reporte: string;
}

export default function InspectorDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(localStorage.getItem(`profile_img_${profile?.id}`));
    const [hiddenReports, setHiddenReports] = useState<string[]>(JSON.parse(localStorage.getItem(`hidden_reports_${profile?.id}`) || '[]'));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [adminInfo, setAdminInfo] = useState<{ id: string, name: string } | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Buscar primer administrador disponible para chatear
    useEffect(() => {
        async function getAdmin() {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, nombre')
                    .eq('rol', 'ADMIN')
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    setAdminInfo({ id: data.id, name: `Admin ${data.nombre}` });
                    fetchUnreadCount(data.id);
                }
            } catch (err) {
                console.error('[InspectorDashboard] Error al buscar Admin para chat:', err);
            }
        }
        getAdmin();
    }, []);

    async function fetchUnreadCount(admId: string) {
        if (!profile?.id) return;
        try {
            const counts = await ChatService.getUnreadCounts(profile.id);
            setUnreadCount(counts[admId] || 0);
        } catch (err) {
            console.error('Error al cargar unread count:', err);
        }
    }

    // Suscripción Realtime para el Inspector
    useEffect(() => {
        if (!profile?.id || !adminInfo?.id) return;

        const channel = ChatService.subscribeToMessages(profile.id, (msg: ChatMessage) => {
            if (msg.sender_id === adminInfo.id && !isChatOpen) {
                setUnreadCount(prev => prev + 1);
                new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => { });
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, [profile?.id, adminInfo?.id, isChatOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setProfileImage(base64String);
                localStorage.setItem(`profile_img_${profile?.id}`, base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const hideReport = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmacion = window.confirm(
            "¿Estás seguro de ocultar este reporte de tu lista? \n\n" +
            "Ya no será visible en tu dispositivo, aunque permanecerá seguro en el servidor central."
        );

        if (confirmacion) {
            const newHidden = [...hiddenReports, id];
            setHiddenReports(newHidden);
            localStorage.setItem(`hidden_reports_${profile?.id}`, JSON.stringify(newHidden));
        }
    };

    const fetchReports = useCallback(async () => {
        if (!profile?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reports')
                .select('id, tipo_actividad, parroquia, fecha, estado_reporte')
                .eq('inspector_id', profile.id)
                .order('fecha', { ascending: false })
                .limit(20);

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => console.error(error),
                { enableHighAccuracy: true }
            );
        }
        fetchReports();
    }, [fetchReports]);

    const visibleReports = reports.filter(r => !hiddenReports.includes(r.id));

    const isReportFromToday = (fechaString: string) => {
        if (!fechaString) return false;
        // Reemplazar espacio por T para compatibilidad con Safari/iOS
        const safeDateString = fechaString.replace(' ', 'T');
        return new Date(safeDateString).toDateString() === new Date().toDateString();
    };

    const stats = {
        total: visibleReports.filter(r => isReportFromToday(r.fecha)).length,
        enviados: visibleReports.filter(r => r.estado_reporte === 'enviado' && isReportFromToday(r.fecha)).length,
        borradores: visibleReports.filter(r => r.estado_reporte === 'borrador' && isReportFromToday(r.fecha)).length
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
            {/* Header Premium */}
            <div className="bg-white px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-sm flex justify-between items-center border-b border-slate-100 sticky top-0 z-20">
                <div className="flex items-center gap-5">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-500 border-2 border-slate-50 cursor-pointer hover:border-blue-200 transition-all relative overflow-hidden group shadow-inner"
                    >
                        {profileImage ? (
                            <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">Bienvenido,</p>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{profile?.nombre || 'Inspector'}</h1>
                        {location ? (
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-tight bg-emerald-50 px-3 py-1 rounded-xl w-fit">
                                <MapPin size={12} className="animate-pulse" />
                                <span>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-tight bg-slate-50 px-3 py-1 rounded-xl w-fit">
                                <Loader2 size={12} className="animate-spin text-slate-300" />
                                <span>Localizando...</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSignOut}
                        className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 group overflow-hidden relative"
                    >
                        <LogOut size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-10 space-y-8 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>

                {/* Resumen Card Dinámico */}
                <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/30 text-white relative overflow-hidden -mt-14 z-10">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                    <p className="text-blue-200 text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-80 text-center md:text-left">Actividad de Hoy</p>

                    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-6xl font-black tracking-tighter leading-none mb-2">
                                {String(stats.total).padStart(2, '0')}
                            </p>
                            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Informes Totales</p>
                        </div>
                        <div className="flex gap-8 bg-black/20 backdrop-blur-md p-4 rounded-3xl w-full md:w-auto justify-around">
                            <div className="text-center">
                                <p className="text-2xl font-black text-emerald-400 tracking-tight">
                                    {String(stats.enviados).padStart(2, '0')}
                                </p>
                                <p className="text-[9px] text-emerald-100 font-bold uppercase tracking-widest opacity-80">Enviados</p>
                            </div>
                            <div className="w-px h-8 bg-white/10 self-center"></div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-orange-400 tracking-tight">
                                    {String(stats.borradores).padStart(2, '0')}
                                </p>
                                <p className="text-[9px] text-orange-100 font-bold uppercase tracking-widest opacity-80">Borrador</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acción Principal */}
                <button
                    onClick={() => navigate('/reporte')}
                    className="w-full bg-white group hover:bg-slate-50 transition-all p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/60 flex items-center gap-5 relative overflow-hidden border border-white hover:border-blue-100"
                >
                    <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
                        <Plus size={36} strokeWidth={3} />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="text-xl font-black text-slate-800 leading-tight mb-1">Nueva Jornada</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Registro distribución real</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                    </div>
                </button>

                {/* Lista de Reportes Real */}
                <section>
                    <div className="flex justify-between items-center mb-6 px-4">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Informes Recientes</h2>
                        <button
                            onClick={fetchReports}
                            disabled={loading}
                            className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full active:scale-90 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando con Supabase...</p>
                            </div>
                        ) : visibleReports.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300">
                                <p className="text-[10px] font-black uppercase tracking-widest">No hay informes registrados hoy</p>
                            </div>
                        ) : (
                            visibleReports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => {
                                        if (report.estado_reporte === 'enviado') {
                                            navigate(`/ver-reporte/${report.id}`);
                                        } else {
                                            navigate(`/reporte?id=${report.id}`);
                                        }
                                    }}
                                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${report.estado_reporte === 'enviado' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100/50 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white'}`}>
                                        {report.estado_reporte === 'enviado' ? <CheckCircle2 size={28} /> : <FileEdit size={28} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-black text-slate-800 text-base truncate pr-2 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{report.tipo_actividad}</h4>
                                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                {new Date((report.fecha || '').replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <MapPin size={12} className="text-slate-300" />
                                            <p className="text-slate-500 text-xs font-bold truncate">{report.parroquia || 'Ubicación no especificada'}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {report.estado_reporte === 'enviado' ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                        <FileText size={14} />
                                                        <span className="text-[9px] font-black uppercase tracking-tight">Ver PDF</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                                        <FileEdit size={14} />
                                                        <span className="text-[9px] font-black uppercase tracking-tight">Editar</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => hideReport(report.id, e)}
                                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center"
                                            title="Limpiar de la lista"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                                            <ChevronRight className="group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={24} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* BOTÓN FLOTANTE DE CHAT (WHATSAPP STYLE) */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {isChatOpen && adminInfo && (
                    <div className="mb-2 animate-in slide-in-from-bottom-5 duration-300 w-[90vw] max-w-sm">
                        <ChatBox
                            receiverId={adminInfo.id}
                            receiverName={adminInfo.name}
                            onClose={() => setIsChatOpen(false)}
                        />
                    </div>
                )}
                <button
                    onClick={() => {
                        setIsChatOpen(!isChatOpen);
                        if (!isChatOpen) setUnreadCount(0); // Limpiar al abrir
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 relative ${isChatOpen ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                    {isChatOpen ? <X size={24} /> : <MessageCircle size={28} />}
                    {!isChatOpen && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
