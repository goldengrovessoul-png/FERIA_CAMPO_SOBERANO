/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { 
    X, Users, Clock, Calendar, Building2, Banknote, CreditCard, ShieldCheck, MapPin, Globe2
} from 'lucide-react';

interface PaymentModeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMode: string | null;
    reports: any[];
    paymentMethods: any[];
    onReset: () => void;
}

const PaymentModeDrawer: React.FC<PaymentModeDrawerProps> = ({
    isOpen,
    onClose,
    paymentMode,
    reports,
    paymentMethods,
    onReset
}) => {
    // Auditamos el modo seleccionado para asegurar coincidencia total con el gráfico
    const normalizedSelectedMode = paymentMode?.toUpperCase().trim() || '';

    // Filtrado de reportes por método de pago exacto (Sincronización Gonzalo)
    const modeReports = useMemo(() => {
        if (!isOpen || !paymentMode) return [];
        
        // Identificamos los IDs de reportes que usaron este método específico
        const targetReportIds = new Set(
            paymentMethods
                .filter(p => {
                    const label = (p.metodo || '').replace(/\[.*\]/, '').trim().toUpperCase();
                    return label === normalizedSelectedMode;
                })
                .map(p => p.report_id)
        );

        return reports
            .filter(r => targetReportIds.has(r.id))
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [isOpen, paymentMode, reports, paymentMethods, normalizedSelectedMode]);

    // Cálculo de estadísticas territoriales (Punto clave de Gonzalo)
    const territorialStats = useMemo(() => {
        const stats: Record<string, number> = {};
        modeReports.forEach(r => {
            const state = (r.estado_geografico || 'SIN ESTADO').trim().toUpperCase();
            stats[state] = (stats[state] || 0) + 1;
        });

        return Object.entries(stats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [modeReports]);

    const totalActividades = modeReports.length;
    const totalEstados = territorialStats.length;

    if (!isOpen || !paymentMode) return null;

    const getIcon = () => {
        if (normalizedSelectedMode === 'EFECTIVO') return <Banknote size={10} />;
        if (normalizedSelectedMode === 'PAGO MÓVIL' || normalizedSelectedMode === 'TRANSFERENCIA' || normalizedSelectedMode === 'PUNTO DE VENTA') return <CreditCard size={10} />;
        return <ShieldCheck size={10} />;
    };

    const getTagColor = () => {
        if (normalizedSelectedMode === 'EFECTIVO') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (normalizedSelectedMode === 'NO APLICA') return 'bg-slate-100 text-slate-700 border-slate-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
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
                        <div className={`inline-flex items-center gap-2 px-3 py-1 ${getTagColor()} rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border`}>
                            {getIcon()} Auditoría de Cobranza
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                            {paymentMode}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                             Despliegue operativo en {totalActividades} ACTIVIDADES
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
                    
                    {/* RESUMEN TERRITORIAL - NUEVO (Gonzalo Requerimiento) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                <Globe2 size={20} className="text-blue-100" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] opacity-70">Análisis Geográfico</p>
                                <h4 className="text-lg font-black tracking-tight">{totalEstados} ESTADOS IMPACTADOS</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {territorialStats.slice(0, 4).map((state, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex justify-between items-center group hover:bg-white/10 transition-all">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-100">{state.name}</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-black">{state.count}</span>
                                </div>
                            ))}
                            {totalEstados > 4 && (
                                <div className="col-span-2 text-center pt-2 text-[9px] font-black uppercase tracking-widest opacity-50 italic">
                                    + {totalEstados - 4} estados adicionales procesaron {paymentMode}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Histórico de Recaudación ({totalActividades} registros)
                        </h4>
                        
                        {modeReports.length === 0 ? (
                            <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No se encontraron reportes sincronizados</p>
                                <p className="text-[10px] text-slate-400 mt-2">Los 103 reportes están siendo filtrados para su auditoría.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {modeReports.map((jornada: any) => (
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
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={10} className="text-red-500" />
                                                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{jornada.estado_geografico}</p>
                                                </div>
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
                                            <div className={`flex items-center gap-1.5 px-2 py-1 ${getTagColor()} rounded-lg text-[9px] font-black uppercase tracking-tighter border`}>
                                                {getIcon()} {paymentMode} DETECTADO
                                            </div>
                                            
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

export default PaymentModeDrawer;
