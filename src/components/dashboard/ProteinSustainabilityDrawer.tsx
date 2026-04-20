/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import { 
    X, Award, MapPin, Building2, Calendar, 
    Package, ShoppingCart, 
    Info, TrendingUp
} from 'lucide-react';

interface ProteinSustainabilityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    reports: any[];
    reportItems: any[];
    selectedState?: string | null;
}

// Constante de palabras clave de proteína (fuera del componente para evitar problemas de dependencias)
const PROTEIN_KEYWORDS = ['HUEVO', 'COCHINO', 'CERDO', 'SARDINA', 'MORTADELA', 'POLLO', 'CARNE'];

const ProteinSustainabilityDrawer: React.FC<ProteinSustainabilityDrawerProps> = ({
    isOpen,
    onClose,
    reports,
    reportItems,
    selectedState
}) => {
    // 1. Filtrar reportes que tienen PROTEÍNA ANIMAL y además POR ESTADO si está seleccionado
    const filteredReports = useMemo(() => {
        let base = reports.filter(r => 
            r.audit_summary?.presenciaProteina === true || 
            (Number(r.total_proteina) || 0) > 0
        );

        if (selectedState) {
            base = base.filter(r => (r.estado_geografico || '').trim().toUpperCase() === selectedState.trim().toUpperCase());
        }

        return base.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [reports, selectedState]);

    const reportIdsWithProtein = useMemo(() => new Set(filteredReports.map(r => r.id)), [filteredReports]);

    // 3. Analizar desgloses por Rubro (Solo para los reportes filtrados)
    const proteinBreakdown = useMemo(() => {
        const counts: Record<string, { count: number, tons: number }> = {};
        
        reportItems.forEach(item => {
            if (reportIdsWithProtein.has(item.report_id)) {
                const rubro = (item.rubro || '').trim().toUpperCase();
                
                // Verificar si coincide con alguna de nuestras palabras clave
                const matchedKey = PROTEIN_KEYWORDS.find(key => rubro.includes(key));
                
                if (matchedKey) {
                    const groupName = matchedKey === 'CERDO' ? 'COCHINO' : matchedKey;
                    if (!counts[groupName]) counts[groupName] = { count: 0, tons: 0 };
                    counts[groupName].count += 1;
                    counts[groupName].tons += (Number(item.cantidad) || 0) / 1000;
                }
            }
        });

        return Object.entries(counts)
            .map(([name, stats]) => ({ 
                name, 
                value: stats.count, 
                tons: stats.tons 
            }))
            .sort((a, b) => b.tons - a.tons);
    }, [reportItems, reportIdsWithProtein]);

    // 4. Analizar Distribución Territorial (Solo si NO hay estado seleccionado, o mostrar desgloses internos si hay)
    const territorialProteinData = useMemo(() => {
        const stateStats: Record<string, { total: number, types: Record<string, number> }> = {};

        filteredReports.forEach(r => {
            const state = (r.estado_geografico || 'SIN ESTADO').trim().toUpperCase();
            if (!stateStats[state]) stateStats[state] = { total: 0, types: {} };
            stateStats[state].total += 1;
        });

        // Añadir pesos por tipo
        reportItems.forEach(item => {
            if (reportIdsWithProtein.has(item.report_id)) {
                const rubro = (item.rubro || '').trim().toUpperCase();
                const matchedKey = PROTEIN_KEYWORDS.find(key => rubro.includes(key));
                if (matchedKey) {
                    const rep = filteredReports.find(r => r.id === item.report_id);
                    if (rep) {
                        const state = (rep.estado_geografico || 'SIN ESTADO').trim().toUpperCase();
                        const groupName = matchedKey === 'CERDO' ? 'COCHINO' : matchedKey;
                        stateStats[state].types[groupName] = (stateStats[state].types[groupName] || 0) + (Number(item.cantidad) || 0) / 1000;
                    }
                }
            }
        });

        return Object.entries(stateStats)
            .map(([name, stats]) => ({
                name,
                totalJornadas: stats.total,
                mainProtein: Object.entries(stats.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'VARIADO',
                totalTons: Object.values(stats.types).reduce((a, b) => a + b, 0)
            }))
            .sort((a, b) => b.totalTons - a.totalTons);
    }, [filteredReports, reportItems, reportIdsWithProtein]);

    if (!isOpen) return null;

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
                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-50 flex items-center justify-center shadow-lg shadow-amber-500/10 border-2 border-amber-100 text-amber-600">
                            <Award size={28} />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 font-['Outfit']">
                                <TrendingUp size={10} /> Análisis de Sostenibilidad {selectedState ? '- TERRITORIAL' : ''}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                                Proteína Animal {selectedState && <span className="text-amber-500 block">EN {selectedState}</span>}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {filteredReports.length} Jornadas detectadas con proteína en {selectedState || 'TODO EL PAÍS'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/50">
                    
                    {/* Desglose por Tipo de Proteína (Contextual) */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Presencia por Rubro {selectedState ? `(${selectedState})` : '(Nacional)'}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">Volumen en toneladas detectado</p>
                            </div>
                            <Package size={20} className="text-slate-200" />
                        </div>
                        
                        {proteinBreakdown.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {proteinBreakdown.map((item) => (
                                    <div key={item.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-amber-200 transition-all hover:bg-white hover:scale-[1.02]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                <ShoppingCart size={18} />
                                            </div>
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                {item.value} Jornadas
                                            </span>
                                        </div>
                                        <h5 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-1">{item.name}</h5>
                                        <p className="text-[22px] font-black text-slate-900 tracking-tighter leading-none">
                                            {item.tons.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span className="text-[10px] text-slate-400 ml-1.5 uppercase tracking-widest">TN</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay datos específicos de rubros cargados aún</p>
                            </div>
                        )}
                    </section>

                    {/* Impacto Territorial (Solo se ve si no hay estado, o como resumen regional) */}
                    {!selectedState && (
                        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Territorial</h4>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase">Predominancia de rubro por estado</p>
                                </div>
                                <MapPin size={24} className="text-slate-200" />
                            </div>
                            <div className="space-y-4">
                                {territorialProteinData.map((state) => (
                                    <div key={state.name} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-amber-200 hover:bg-amber-50/20 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-all shadow-sm">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{state.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Principal:</span>
                                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                        {state.mainProtein}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900 tracking-tighter">
                                                {state.totalTons.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-[9px] text-slate-400 ml-1 tracking-widest">TN</span>
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {state.totalJornadas} JORNADAS SI
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Ejecución Detallada */}
                    <section className="space-y-4">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                            {selectedState ? `Jornadas en ${selectedState}` : 'Ejecución en Campo (Proteína)'}
                        </h4>
                        <div className="space-y-4 pb-20">
                            {filteredReports.slice(0, 20).map((report, idx) => (
                                <div key={report.id + idx} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col sm:flex-row gap-6 hover:border-amber-100 hover:shadow-xl hover:shadow-amber-500/5 transition-all relative overflow-hidden group">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-tighter border border-amber-100">
                                                {Number(report.total_proteina).toFixed(2)} TN PROTEÍNA
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
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-all border border-slate-100">
                                                <Building2 size={12} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter leading-none">
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
                    <div className="flex items-center gap-4 p-5 rounded-3xl bg-amber-50/50 border border-amber-50">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <Info size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed uppercase font-['Outfit']">
                             {selectedState 
                                ? `Mostrando análisis detallado para el estado ${selectedState}. La información refleja la sostenibilidad proteica local.` 
                                : 'Análisis nacional detallado de la sostenibilidad proteica en las bases de misiones sociales.'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProteinSustainabilityDrawer;
