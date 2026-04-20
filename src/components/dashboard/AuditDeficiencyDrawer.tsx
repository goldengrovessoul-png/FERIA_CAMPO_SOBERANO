/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { 
    X, AlertTriangle, MapPin, Building2, Calendar, 
    ArrowDownRight, Package, Activity, 
    Users, UserPlus, Info
} from 'lucide-react';

interface AuditDeficiencyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    auditKey: string | null;
    label: string | null;
    reports: any[];
}

const AuditDeficiencyDrawer: React.FC<AuditDeficiencyDrawerProps> = ({
    isOpen,
    onClose,
    auditKey,
    label,
    reports
}) => {

    // Filtrar reportes con DEFICIENCIAS (audit_summary[key] === false)
    const deficientReports = useMemo(() => {
        return reports.filter(r => r.audit_summary?.[auditKey!] === false)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [reports, auditKey]);

    // Estadísticas por Estado
    const stateDeficiencies = useMemo(() => {
        const counts: Record<string, number> = {};
        deficientReports.forEach(r => {
            const state = r.estado_geografico || 'SIN ESTADO';
            counts[state] = (counts[state] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [deficientReports]);

    // Estadísticas por Ente
    const enteDeficiencies = useMemo(() => {
        const counts: Record<string, number> = {};
        deficientReports.forEach(r => {
            const ente = r.empresa || 'SIN ENTE';
            counts[ente] = (counts[ente] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [deficientReports]);

    if (!isOpen || !auditKey) return null;

    const getIcon = () => {
        switch(auditKey) {
            case 'bodegaLimpia': return <Package size={20} />;
            case 'entornoLimpio': return <Activity size={20} />;
            case 'comunidadNotificada': return <Users size={20} />;
            case 'personalSuficiente': return <UserPlus size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getColor = () => {
        switch(auditKey) {
            case 'bodegaLimpia': return '#3B82F6';
            case 'entornoLimpio': return '#10B981';
            case 'comunidadNotificada': return '#6366F1';
            case 'personalSuficiente': return '#8B5CF6';
            default: return '#EF4444';
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10001] transition-opacity duration-300"
                onClick={onClose}
            />
            
            <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-slate-50 shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[10002] flex flex-col animate-in slide-in-from-right duration-500">
                {/* Cabecera Enfoque Deficiencias */}
                <div className="p-8 border-b border-white bg-white flex justify-between items-start">
                    <div className="flex gap-5">
                        <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-red-500/10 border-2 border-red-50" style={{ color: getColor() }}>
                            {getIcon()}
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 font-['Outfit']">
                                <AlertTriangle size={10} /> Diagnóstico de Deficiencias
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                                {label}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {deficientReports.length} Jornadas con incidencias detectadas
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Alertas Críticas por Estado (SIN RECORTES) */}
                    <section className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                             Focos Territoriales con Incumplimiento
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stateDeficiencies.map((state, idx) => (
                                <div key={state.name} className="bg-white p-6 rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">Falla Nivel {idx + 1}</span>
                                            <ArrowDownRight size={16} className="text-red-400" />
                                        </div>
                                        <p className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{state.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {state.value} ALERTAS REGISTRADAS
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Tabla de Entes con Incumplimiento (SIN RECORTES) */}
                    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Entes Responsables</h4>
                                <p className="text-[9px] font-bold text-slate-300 uppercase">Concentración de fallas por ejecutor</p>
                            </div>
                            <Building2 size={24} className="text-slate-200" />
                        </div>
                        <div className="space-y-3">
                            {enteDeficiencies.map((ente) => (
                                <div key={ente.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-red-200 hover:bg-red-50/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:rotate-6 transition-all duration-300">
                                            <Building2 size={16} />
                                        </div>
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{ente.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                            <div 
                                                className="h-full bg-red-500 transition-all duration-700" 
                                                style={{ width: `${(ente.value / deficientReports.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[12px] font-black text-slate-900">{ente.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Listado de Auditoría Detallado */}
                    <section className="space-y-4">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                            Historial de Hallazgos en Campo
                        </h4>
                        <div className="space-y-4 pb-20">
                            {deficientReports.map((report, idx) => (
                                <div key={report.id + idx} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col sm:flex-row gap-6 hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 transition-all relative overflow-hidden group">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-black uppercase tracking-tighter border border-red-100">
                                                NO CUMPLE {label}
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
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Ente Responsable</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 border border-red-100/50">
                                                <Building2 size={12} />
                                            </div>
                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter leading-none">
                                                {report.empresa || 'SIN ENTE'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white">
                    <div className="flex items-center gap-4 p-5 rounded-3xl bg-red-50/50 border border-red-50">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-red-900/60 leading-relaxed uppercase">
                             Esta vista resalta únicamente las jornadas donde los estándares de control interno NO fueron satisfactorios para aplicar medidas correctivas inmediatas.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuditDeficiencyDrawer;
