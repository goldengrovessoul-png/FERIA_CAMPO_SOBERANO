/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    X, Navigation, Users, Clock, Calendar, Building2, Activity as ActivityIcon, Package
} from 'lucide-react';

interface ActivityTypeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activityType: string | null;
    reports: any[];
    onReset: () => void;
}

const ActivityTypeDrawer: React.FC<ActivityTypeDrawerProps> = ({
    isOpen,
    onClose,
    activityType,
    reports,
    onReset
}) => {
    if (!isOpen || !activityType) return null;

    // Filtrar los reportes por tipo de actividad
    const activityReports = reports
        .filter(r => (r.tipo_actividad || '').trim().toUpperCase() === activityType.trim().toUpperCase())
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const totalBeneficiaries = activityReports.reduce((acc, r) => acc + (Number(r.familias) || 0), 0);
    // Convertimos acumulado de KG de cada rubro a TN total (división entre 1000)
    const totalTN = activityReports.reduce((acc, r) => {
        return acc + (Number(r.total_proteina) || 0) + (Number(r.total_frutas) || 0) + 
               (Number(r.total_hortalizas) || 0) + (Number(r.total_verduras) || 0) + 
               (Number(r.total_viveres) || 0);
    }, 0) / 1000;

    // Función auxiliar para formateo inteligente (Punto medio Gonzalo)
    const formatWeight = (kg: number) => {
        const tn = kg / 1000;
        if (kg === 0) return "0,00 TN";
        if (kg < 200) { // En actividades ampliamos el rango a 200kg para ser más precavidos
            return `${tn.toLocaleString('es-VE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TN (${kg.toLocaleString('es-VE')} KG)`;
        }
        return `${tn.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN`;
    };

    return (
        <>
            {/* Overlay Oscuro */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10001] transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            />
            
            {/* Panel Lateral (Drawer Premium) */}
            <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[10002] flex flex-col animate-in slide-in-from-right duration-500">
                {/* Cabecera del Detalle */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-indigo-50/30">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                            <ActivityIcon size={10} /> Análisis Operativo
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                            {activityType}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <Users size={12} className="text-indigo-600" /> {totalBeneficiaries.toLocaleString()} FAMILIAS
                             </p>
                             <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <Package size={12} className="text-emerald-600" /> {totalTN.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN
                             </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Contenido (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Cronología de Despliegue
                        </h4>
                        
                        {activityReports.length === 0 ? (
                            <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay jornadas registradas para este tipo</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activityReports.map((jornada: any) => {
                                    const jornadaTotalTN = (Number(jornada.total_proteina) || 0) + (Number(jornada.total_frutas) || 0) + 
                                                         (Number(jornada.total_hortalizas) || 0) + (Number(jornada.total_verduras) || 0) + 
                                                         (Number(jornada.total_viveres) || 0);

                                    return (
                                        <div 
                                            key={jornada.id} 
                                            className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-default"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                                        {jornada.estado_geografico}
                                                    </span>
                                                    <h5 className="text-lg font-black text-slate-900 uppercase tracking-tighter mt-2">{jornada.punto_atencion || jornada.parroquia}</h5>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(jornada.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 mt-1">
                                                        <Clock size={10} /> {jornada.hora || '08:00 AM'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Municipio</p>
                                                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{jornada.municipio}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atención Directa</p>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={12} className="text-slate-300" />
                                                        <p className="text-[11px] font-black text-slate-900 tracking-tighter">{(jornada.familias || 0).toLocaleString()} FAMILIAS</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-emerald-100">
                                                    + {formatWeight(jornadaTotalTN)} DISTRIBUIDAS
                                                </span>
                                                
                                                {jornada.empresa && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                                                        <Building2 size={10} /> {jornada.empresa}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Alerta de Comando y Control */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-500/30 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                    <Navigation size={20} className="text-indigo-400" />
                                </div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Geolocalización Táctica</p>
                            </div>
                            <h5 className="text-lg font-black uppercase tracking-tight mb-2 leading-tight">Visualización en Mapa Activa</h5>
                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-6">
                                El tablero ha filtrado el despliegue geográfico para mostrar solo los operativos de tipo {activityType}.
                            </p>
                            <button 
                                onClick={() => {
                                    onClose();
                                    document.querySelector('.MapContainer')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md"
                            >
                                Localizar Actividades
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pie del Drawer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                    <button
                        onClick={onReset}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                        Restablecer Vista General
                    </button>
                </div>
            </div>
        </>
    );
};

export default ActivityTypeDrawer;
