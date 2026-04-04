/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { 
    X, Apple, MapPin, Building2, Calendar, 
    ShoppingCart, Info, BarChart2, Truck, ClipboardList, Star
} from 'lucide-react';

interface FruitSustainabilityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    reports: any[];
    selectedState?: string | null;
}

const FruitSustainabilityDrawer: React.FC<FruitSustainabilityDrawerProps> = ({
    isOpen,
    onClose,
    reports,
    selectedState
}) => {
    if (!isOpen) return null;

    // 1. Filtrar reportes que pertenecen al contexto (Estado o Nacional)
    const contextReports = useMemo(() => {
        let base = reports;
        if (selectedState) {
            base = base.filter(r => (r.estado_geografico || '').trim().toUpperCase() === selectedState.trim().toUpperCase());
        }
        return base;
    }, [reports, selectedState]);

    // 2. Reportes específicos con presencia de FRUTAS detectada
    const detailReports = useMemo(() => {
        return contextReports.filter(r => 
            r.audit_summary?.presenciaFrutas === true || 
            (Number(r.total_frutas) || 0) > 0
        ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [contextReports]);

    // 3. Analizar por Tipo de Actividad (Solo TN y Conteo, sin porcentaje por petición de Gonzalo)
    const activityBreakdown = useMemo(() => {
        const stats: Record<string, { count: number, tons: number }> = {};
        
        detailReports.forEach(r => {
            const type = (r.tipo_actividad || 'OTROS').trim().toUpperCase();
            if (!stats[type]) stats[type] = { count: 0, tons: 0 };
            
            stats[type].count += 1;
            stats[type].tons += (Number(r.total_frutas) || 0);
        });

        return Object.entries(stats)
            .map(([name, data]) => ({
                name,
                count: data.count,
                tons: data.tons
            }))
            .sort((a, b) => b.tons - a.tons);
    }, [detailReports]);

    // 4. Analizar por Ente Responsable
    const entityBreakdown = useMemo(() => {
        const stats: Record<string, { tons: number, mainActivity: string }> = {};
        const activityCounts: Record<string, Record<string, number>> = {};

        detailReports.forEach(r => {
            const ent = (r.empresa || 'SIN ENTE').trim().toUpperCase();
            const act = (r.tipo_actividad || 'OTROS').trim().toUpperCase();
            
            if (!stats[ent]) stats[ent] = { tons: 0, mainActivity: '' };
            if (!activityCounts[ent]) activityCounts[ent] = {};
            
            stats[ent].tons += (Number(r.total_frutas) || 0);
            activityCounts[ent][act] = (activityCounts[ent][act] || 0) + 1;
        });

        return Object.entries(stats)
            .map(([name, data]) => ({
                name,
                tons: data.tons,
                mainActivity: Object.entries(activityCounts[name]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'VARIADA'
            }))
            .sort((a, b) => b.tons - a.tons)
            .slice(0, 10);
    }, [detailReports]);

    return (
        <>
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10001] transition-opacity duration-300"
                onClick={onClose}
            />
            
            <div className="fixed top-0 right-0 h-full w-full md:w-[750px] bg-slate-50 shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[10002] flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-8 border-b border-white bg-white flex justify-between items-start shadow-sm relative z-10">
                    <div className="flex gap-5">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-pink-50 flex items-center justify-center shadow-lg shadow-pink-500/10 border-2 border-pink-100 text-pink-600">
                            <Apple size={28} />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 font-['Outfit']">
                                <Star size={10} /> Auditoría Logística de Frutas
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                                Sostenibilidad de Frutas {selectedState && <span className="text-pink-500 block">EN {selectedState}</span>}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {detailReports.length} Actividades con suministro de frutas detectada
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/50">
                    
                    {/* Canal de Distribución - Solo TN por canal */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Distribución de Frutas por Canal
                                </h4>
                                <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">Volumen total de frutas frescas por modalidad</p>
                            </div>
                            <Truck size={20} className="text-slate-200" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {activityBreakdown.length > 0 ? (
                                activityBreakdown.map((act) => (
                                    <div key={act.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-pink-100 transition-all group">
                                        <div className="flex items-center gap-5 w-full sm:w-auto">
                                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-sm">
                                                {act.name.includes('BODEGA') ? <ShoppingCart size={24} /> : <ClipboardList size={24} />}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{act.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {act.count} ACTIVIDADES REALIZADAS
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50 font-['Outfit']">
                                            <div className="text-right">
                                                <p className="text-[20px] font-black text-slate-900 tracking-tighter leading-none">
                                                    {act.tons.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    <span className="text-[10px] text-slate-300 ml-1.5 uppercase tracking-widest font-bold">TN</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 italic text-slate-400 text-sm">
                                    No hay distribución de frutas registrada en este contexto.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Desempeño por Ente Responsable */}
                    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Entes Ejecutores</h4>
                                <p className="text-[9px] font-bold text-slate-300 uppercase">Volumen acumulado por organismo</p>
                            </div>
                            <Building2 size={24} className="text-slate-200" />
                        </div>
                        <div className="space-y-4">
                            {entityBreakdown.map((entity, idx) => (
                                <div key={entity.name + idx} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group transition-all hover:bg-slate-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 font-black text-[12px] group-hover:text-pink-500 transition-all shadow-sm">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{entity.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                FOCO: {entity.mainActivity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 tracking-tighter">
                                            {entity.tons.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span className="text-[9px] text-slate-400 ml-1 tracking-widest font-bold">TN</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Historial de Despacho de Frutas */}
                    <section className="space-y-4">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                            {selectedState ? `Jornadas de Frutas en ${selectedState}` : 'Historial de Despacho Frutas'}
                        </h4>
                        <div className="space-y-4 pb-20">
                            {detailReports.slice(0, 15).map((report, idx) => (
                                <div key={report.id + idx} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col sm:flex-row gap-6 hover:border-pink-100 hover:shadow-xl hover:shadow-pink-500/5 transition-all group">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded text-[9px] font-black uppercase tracking-tighter border border-pink-100">
                                                {Number(report.total_frutas).toFixed(2)} TN FRUTAS
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(report.fecha).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{report.punto_atencion || 'PUNTO NO ESPECIFICADO'}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                <MapPin size={10} /> {report.parroquia}, {report.estado_geografico}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="sm:border-l border-slate-50 sm:pl-6 flex flex-col justify-center min-w-[140px]">
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Ente y Actividad</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-pink-500 border border-slate-100">
                                                    <Building2 size={10} />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                                    {report.empresa || 'SIN ENTE'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-pink-500 border border-slate-100">
                                                    <BarChart2 size={10} />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                    {report.tipo_actividad || 'OTRA'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white shadow-2xl">
                    <div className="flex items-center gap-4 p-5 rounded-3xl bg-pink-50/50 border border-pink-50">
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <Info size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-pink-900/60 leading-relaxed uppercase font-['Outfit']">
                             Esta vista detalla el volumen de frutas frescas distribuido en el territorio. Se muestran toneladas (TN) brutas por canal y ente ejecutor.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FruitSustainabilityDrawer;
