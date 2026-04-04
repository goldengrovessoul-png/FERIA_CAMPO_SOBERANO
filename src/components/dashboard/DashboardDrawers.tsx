/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { 
    X, MapPin, Award, Calendar, Users, Clock, Navigation, Globe, Activity, Building2, Map as MapIcon 
} from 'lucide-react';

interface DashboardDrawersProps {
    isDrillDownOpen: boolean;
    setIsDrillDownOpen: (open: boolean) => void;
    isStateDrillDownOpen: boolean;
    setIsStateDrillDownOpen: (open: boolean) => void;
    selectedEnte: string | null;
    setSelectedEnte: (ente: string | null) => void;
    selectedEstado: string | null;
    setSelectedEstado: (estado: string | null) => void;
    enteJornadasDetails: any[];
    estadoJornadasDetails: any[];
}

const DashboardDrawers: React.FC<DashboardDrawersProps> = ({
    isDrillDownOpen,
    setIsDrillDownOpen,
    isStateDrillDownOpen,
    setIsStateDrillDownOpen,
    selectedEnte,
    setSelectedEnte,
    selectedEstado,
    setSelectedEstado,
    enteJornadasDetails,
    estadoJornadasDetails
}) => {
    return (
        <>
            {/* ── DRAWER DE DRILL-DOWN (NIVEL DE DETALLE POR ENTE) ── */}
            {isDrillDownOpen && (
                <>
                    {/* Overlay Oscuro */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10001] transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsDrillDownOpen(false)}
                    />
                    
                    {/* Panel Lateral (Drawer Premium) */}
                    <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[10002] flex flex-col animate-in slide-in-from-right duration-500">
                        {/* Cabecera del Detalle */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                                    <Award size={10} /> Análisis de Ente
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                                    {selectedEnte}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <MapPin size={12} className="text-[#007AFF]" /> Presencia en {enteJornadasDetails.length} jornadas operativas
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDrillDownOpen(false)}
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
                                
                                {enteJornadasDetails.length === 0 ? (
                                    <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay datos disponibles</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {enteJornadasDetails.map((jornada) => (
                                            <div 
                                                key={jornada.id} 
                                                className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-[#007AFF]/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-default"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1">
                                                        <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                                                            {jornada.tipo_actividad}
                                                        </span>
                                                        <h5 className="text-lg font-black text-slate-900 uppercase tracking-tighter mt-2">{jornada.parroquia}</h5>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(jornada.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 mt-1">
                                                            <Clock size={10} /> 08:00 AM
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                                                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{jornada.municipio}, {jornada.estado_geografico}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Población Atendida</p>
                                                        <div className="flex items-center gap-2">
                                                            <Users size={12} className="text-slate-300" />
                                                            <p className="text-[11px] font-black text-slate-900 tracking-tighter">{jornada.familias.toLocaleString()} FAMILIAS</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {jornada.total_proteina > 0 && (
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-amber-100">
                                                            + {jornada.total_proteina} TN PROTEÍNA
                                                        </span>
                                                    )}
                                                    {jornada.empresa?.trim().toUpperCase() === selectedEnte?.trim().toUpperCase() ? (
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-emerald-100">
                                                            ENTE LÍDER
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                                                            APOYO TÉCNICO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Alerta de Comando y Control */}
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
                                        El mapa operativo ha sido filtrado automáticamente para mostrar solo las ubicaciones geográficas donde {selectedEnte} tuvo presencia efectiva.
                                    </p>
                                    <button 
                                        onClick={() => {
                                            setIsDrillDownOpen(false);
                                            // Scroll to map
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
                                onClick={() => {
                                    setIsDrillDownOpen(false);
                                    setSelectedEnte(null);
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-slate-200 transition-all active:scale-[0.98]"
                            >
                                Restablecer Vista General
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── DRAWER DE DRILL-DOWN (NIVEL DE DETALLE POR ESTADO) ── */}
            {isStateDrillDownOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10001] transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsStateDrillDownOpen(false)}
                    />
                    <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[10002] flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-[#007AFF]/5">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-[#007AFF] rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                                    <Globe size={10} /> Análisis Territorial
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight font-['Outfit']">
                                    Estado {selectedEstado}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <Activity size={12} className="text-[#059669]" /> {estadoJornadasDetails.length} Jornadas en este territorio
                                </p>
                            </div>
                            <button
                                onClick={() => setIsStateDrillDownOpen(false)}
                                className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={14} /> Despliegue Operativo
                                </h4>
                                
                                {estadoJornadasDetails.length === 0 ? (
                                    <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay datos registrados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {estadoJornadasDetails.map((jornada) => (
                                            <div 
                                                key={jornada.id} 
                                                className="group p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-[#F59E0B]/20 hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-default"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1">
                                                        <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                                                            Población Atendida
                                                        </span>
                                                        <h5 className="text-lg font-black text-slate-900 uppercase tracking-tighter mt-2">{jornada.municipio}</h5>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{jornada.parroquia}</p>
                                                            {jornada.nombre_comuna && (
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter leading-tight italic">
                                                                        {jornada.nombre_comuna}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <div className="bg-slate-900 text-white px-3 py-1 rounded-xl text-[11px] font-black">
                                                            {jornada.familias.toLocaleString()} <span className="opacity-50">FAM.</span>
                                                        </div>
                                                        {(Number(jornada.comunas) || 0) > 0 && (
                                                            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-black mt-1 uppercase tracking-tighter">
                                                                {jornada.comunas} Comunas
                                                            </div>
                                                        )}
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{new Date(jornada.fecha).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 border-t border-slate-50 pt-4">
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ente Líder</p>
                                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{jornada.empresa || 'NO ASIGNADO'}</p>
                                                    </div>
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                                        <Building2 size={16} className="text-slate-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#059669] p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/10">
                                            <MapIcon size={20} className="text-white" />
                                        </div>
                                        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em]">Geo-Localización Estratégica</p>
                                    </div>
                                    <h5 className="text-lg font-black uppercase tracking-tight mb-2 leading-tight">Vista de Estado en Mapa</h5>
                                    <p className="text-[11px] font-medium text-emerald-50/70 leading-relaxed mb-6">
                                        Explora la distribución de las {estadoJornadasDetails.reduce((acc, j) => acc + j.familias, 0).toLocaleString()} familias atendidas en el estado {selectedEstado}.
                                    </p>
                                    <button 
                                        onClick={() => {
                                            setIsStateDrillDownOpen(false);
                                            document.querySelector('.MapContainer')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="w-full py-4 bg-white text-[#059669] hover:bg-emerald-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl"
                                    >
                                        Localizar Jornadas
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                            <button
                                onClick={() => {
                                    setIsStateDrillDownOpen(false);
                                    setSelectedEstado(null);
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-slate-200 transition-all active:scale-[0.98]"
                            >
                                Restablecer Vista General
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default DashboardDrawers;
