/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { 
    X, MapPin, Users, Home, Box, PieChart, Activity, Building2, Globe2, 
    ChevronRight, TrendingUp, UserCheck
} from 'lucide-react';

interface StateAnalyticsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    stateName: string | null;
    reports: any[];
}

const StateAnalyticsDrawer: React.FC<StateAnalyticsDrawerProps> = ({
    isOpen,
    onClose,
    stateName,
    reports
}) => {
    // Auditamos los datos del estado seleccionado (Gonzalo Analytics)
    const stats = useMemo(() => {
        if (!isOpen || !stateName) return null;

        const normalizedState = stateName.trim().toUpperCase();
        const stateReports = reports.filter(r => 
            String(r.estado_geografico || '').trim().toUpperCase() === normalizedState
        );

        const totals = stateReports.reduce((acc, r) => {
            // Suma de Población
            acc.actividades += 1;
            acc.comunas += (r.comunas || 0);
            acc.familias += (r.familias || 0);
            acc.personas += (r.personas || 0);

            // Tipo de Actividad (New Gonzalo Logic)
            const type = (r.tipo_actividad || 'Ferial').trim().toUpperCase();
            if (!acc.activitiesByType[type]) {
                acc.activitiesByType[type] = 0;
            }
            acc.activitiesByType[type] += 1;

            // Suma de Tonelaje (Proteína + Frutas + Hortalizas + Verduras + Víveres)
            const tons = (
                Number(r.total_proteina || 0) + 
                Number(r.total_frutas || 0) + 
                Number(r.total_hortalizas || 0) + 
                Number(r.total_verduras || 0) + 
                Number(r.total_viveres || 0)
            );
            acc.tonelaje += tons;

            // Participación por Entes (Nombre del Ente | Actividades | Tonelaje)
            const enteName = (r.empresa || 'FCS').trim().toUpperCase();
            if (!acc.entes[enteName]) {
                acc.entes[enteName] = { count: 0, tons: 0 };
            }
            acc.entes[enteName].count += 1;
            acc.entes[enteName].tons += tons;

            return acc;
        }, {
            actividades: 0,
            comunas: 0,
            familias: 0,
            personas: 0,
            tonelaje: 0,
            activitiesByType: {} as Record<string, number>,
            entes: {} as Record<string, { count: number, tons: number }>
        });

        // Convertimos el objeto de entes a un array ordenado por toneladas
        const entesList = Object.entries(totals.entes).map(([name, data]: [string, any]) => ({
            name,
            ...data
        })).sort((a, b) => b.tons - a.tons);

        return { ...totals, entesList };
    }, [isOpen, stateName, reports]);

    if (!isOpen || !stateName || !stats) return null;

    // Formateador de peso premium (TN / KG)
    const formatWeight = (tons: number) => {
        if (tons >= 0.1) {
            return `${tons.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN`;
        }
        return `${(tons * 1000).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN (KG)`;
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[10001] transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            />
            
            {/* Panel Lateral */}
            <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-slate-50 shadow-[-20px_0_80px_rgba(0,0,0,0.3)] z-[10002] flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/20">
                
                {/* Cabecera Táctica */}
                <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                             <Globe2 size={10} /> Análisis Operativo Territorial
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-['Outfit'] flex items-center gap-3">
                            <MapPin className="text-red-500" size={32} /> {stateName}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Auditoría de Despliegue Feria Campo Soberano
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Contenido Dinámico */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    
                    {/* KPIs PRINCIPALES (Gonzalo Requirements) */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Actividades */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><Activity size={20} /></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Actividades</p>
                            <h4 className="text-2xl font-black text-slate-900">{stats.actividades}</h4>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Jornadas Ejecutadas</p>
                        </div>
                        {/* Comunas */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Home size={20} /></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comunas</p>
                            <h4 className="text-2xl font-black text-slate-900">{stats.comunas}</h4>
                            <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">Poder Popular Atendido</p>
                        </div>
                        {/* Familias */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Users size={20} /></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Familias</p>
                            <h4 className="text-2xl font-black text-slate-900">{(stats.familias || 0).toLocaleString()}</h4>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Núcleos Familiares</p>
                        </div>
                        {/* Personas */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-purple-500/5 transition-all">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><UserCheck size={20} /></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Personas</p>
                            <h4 className="text-2xl font-black text-slate-900">{(stats.personas || 0).toLocaleString()}</h4>
                            <p className="text-[10px] font-bold text-purple-500 uppercase mt-1">Ciudadanos Beneficiados</p>
                        </div>
                    </div>

                    {/* DESGLOSE POR TIPO DE ACTIVIDAD (Unified Gonzalo Card) */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={16} className="text-indigo-500" /> RESUMEN DE DESPLIEGUE POR MODALIDAD
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            {[
                                { id: 'FCS', label: 'Feria Campo Soberano' },
                                { id: 'BODEGA MÓVIL', label: 'Bodega Móvil' },
                                { id: 'FCS EMBLEMÁTICA', label: 'FCS Emblemática' },
                                { id: 'PDR', label: 'PDR (Plan de Respuesta)' }
                            ].map((mod) => {
                                const count = stats.activitiesByType[mod.id] || 0;
                                const isActive = count > 0;
                                
                                return (
                                    <div key={mod.id} className="flex flex-col gap-1 border-l-2 border-slate-50 pl-4 group-hover:border-indigo-100 transition-colors">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight opacity-70">
                                            {mod.label}
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-2xl font-black ${isActive ? 'text-slate-900' : 'text-slate-200'} tracking-tighter leading-none`}>
                                                {count.toLocaleString('es-VE')}
                                            </span>
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-50"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ALIMENTOS DISTRIBUIDOS */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                                <Box size={24} className="text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] opacity-70">Soberanía Alimentaria</p>
                                <h3 className="text-2xl font-black tracking-tight tracking-tighter">ALIMENTOS DISTRIBUIDOS</h3>
                            </div>
                        </div>
                        <div className="flex items-end gap-3">
                            <h2 className="text-5xl font-black tracking-tighter leading-none">
                                {formatWeight(stats.tonelaje)}
                            </h2>
                            <TrendingUp className="text-emerald-400 mb-1" size={32} />
                        </div>
                        <div className="mt-6 flex gap-2">
                             <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Proteína</span>
                             <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Víveres</span>
                             <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Hortalizas</span>
                        </div>
                    </div>

                    {/* PARTICIPACIÓN POR ENTES (Double Stats: Actividades + Tons) */}
                    <div className="space-y-6 pb-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={16} className="text-indigo-500" /> Participación por Entes
                            </h4>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase">{stats.entesList.length} Entes</span>
                        </div>

                        <div className="space-y-4">
                            {stats.entesList.map((ente: any, idx: number) => (
                                <div 
                                    key={idx}
                                    className="bg-white p-6 rounded-[2.2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-500/20 hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors border border-slate-50">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                                {ente.name}
                                            </h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Corresponsabilidad Alimentaria</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Participación</p>
                                            <p className="text-[13px] font-black text-slate-900 uppercase">{ente.count} <span className="text-[9px] opacity-40">Veces</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aporte</p>
                                            <p className="text-[13px] font-black text-indigo-600 uppercase italic">
                                                {formatWeight(ente.tons)}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pie del Panel */}
                <div className="p-8 border-t border-slate-100 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <PieChart size={18} /> Cerrar Auditoría Territorial
                    </button>
                </div>
            </div>
        </>
    );
};

export default StateAnalyticsDrawer;
