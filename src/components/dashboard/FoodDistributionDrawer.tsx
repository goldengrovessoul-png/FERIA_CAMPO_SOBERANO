/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    X, Navigation, Users, Clock, Calendar, Building2, Leaf
} from 'lucide-react';

interface FoodDistributionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string | null;
    reports: any[];
    onReset: () => void;
}

const FoodDistributionDrawer: React.FC<FoodDistributionDrawerProps> = ({
    isOpen,
    onClose,
    category,
    reports,
    onReset
}) => {
    if (!isOpen || !category) return null;

    // Filtrar los reportes que tienen datos para esta categoría
    const categoryFieldMap: Record<string, string> = {
        'PROTEÍNAS': 'total_proteina',
        'FRUTAS': 'total_frutas',
        'HORTALIZAS': 'total_hortalizas',
        'VERDURAS': 'total_verduras',
        'VÍVERES': 'total_viveres'
    };

    const fieldName = categoryFieldMap[category.toUpperCase()] || '';
    const categoryReports = reports
        .filter(r => (Number(r[fieldName]) || 0) > 0)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Asumimos que los datos vienen en KG, convertimos a TN para el total
    const totalCategoryTN = categoryReports.reduce((acc, r) => acc + (Number(r[fieldName]) || 0), 0) / 1000;

    // Función auxiliar para formateo inteligente (Punto medio Gonzalo)
    const formatWeight = (kg: number) => {
        const tn = kg / 1000;
        if (kg === 0) return "0,00 TN";
        if (kg < 100) {
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
                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                            <Leaf size={10} /> Análisis de Distribución
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                            {category}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                             Impacto total de {totalCategoryTN.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN
                        </p>
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
                            <Calendar size={14} /> Cronología de Jornadas
                        </h4>
                        
                        {categoryReports.length === 0 ? (
                            <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay datos para esta categoría</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {categoryReports.map((jornada: any) => (
                                    <div 
                                        key={jornada.id} 
                                        className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-[#007AFF]/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-default"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                                                    {jornada.tipo_actividad || 'FCS'}
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
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{jornada.municipio}, {jornada.estado_geografico}</p>
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
                                            <span className="px-2 py-1 bg-[#10B981]/10 text-[#10B981] rounded-lg text-[9px] font-black uppercase tracking-tighter border border-[#10B981]/20">
                                                + {formatWeight(Number(jornada[fieldName]))} {category}
                                            </span>
                                            
                                            {jornada.empresa && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                                                    <Building2 size={10} /> {jornada.empresa}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Alerta de Sincronización */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-500/30 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Navigation size={20} className="text-blue-400" />
                                </div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Sincronización Operativa</p>
                            </div>
                            <h5 className="text-lg font-black uppercase tracking-tight mb-2 leading-tight">Visualización en Mapa Activa</h5>
                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-6">
                                El mapa operativo ha sido filtrado automáticamente para mostrar solo los puntos de atención donde se distribuyeron {category}.
                            </p>
                            <button 
                                onClick={() => {
                                    onClose();
                                    document.querySelector('.MapContainer')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md"
                            >
                                Ir al Mapa Operativo
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

export default FoodDistributionDrawer;
