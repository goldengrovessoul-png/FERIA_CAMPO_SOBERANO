/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Activity, MapPin, Home, Users, Globe, Map, Navigation } from 'lucide-react';

interface KpiSectionProps {
    filteredReports: Record<string, any>[];
    totalEstados: number;
    totalMunicipios: number;
    totalParroquias: number;
}

/**
 * Componente que renderiza las tarjetas de KPIs principales y cobertura territorial.
 * Extraído de JefeDashboard para mejorar la mantenibilidad y legibilidad.
 */
const KpiSection: React.FC<KpiSectionProps> = ({ 
    filteredReports, 
    totalEstados, 
    totalMunicipios, 
    totalParroquias 
}) => {
    // Calculo de valores analíticos básicos
    const kpisPrincipales = [
        { 
            label: 'Jornadas Ejecutadas', 
            value: filteredReports.length, 
            icon: <Activity size={20} />, 
            color: 'text-[#007AFF]', 
            bg: 'bg-blue-50' 
        },
        { 
            label: 'Comunas Atendidas', 
            value: filteredReports.reduce((acc, r) => acc + (Number(r.comunas) || 0), 0).toLocaleString(), 
            icon: <MapPin size={20} />, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
        },
        { 
            label: 'Familias Beneficiadas', 
            value: filteredReports.reduce((acc, r) => acc + (Number(r.familias) || 0), 0).toLocaleString(), 
            icon: <Home size={20} />, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50' 
        },
        { 
            label: 'Habitantes Atendidos', 
            value: filteredReports.reduce((acc, r) => acc + (Number(r.personas) || 0), 0).toLocaleString(), 
            icon: <Users size={20} />, 
            color: 'text-sky-600', 
            bg: 'bg-sky-50' 
        },
    ];

    const coberturaTerritorial = [
        { 
            label: 'Total Estados Atendidos', 
            value: totalEstados.toLocaleString(), 
            icon: <Globe size={20} />, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50' 
        },
        { 
            label: 'Total Municipios Atendidos', 
            value: totalMunicipios.toLocaleString(), 
            icon: <Map size={20} />, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50' 
        },
        { 
            label: 'Total Parroquias Atendidas', 
            value: totalParroquias.toLocaleString(), 
            icon: <Navigation size={20} />, 
            color: 'text-rose-600', 
            bg: 'bg-rose-50' 
        },
    ];

    return (
        <>
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {kpisPrincipales.map((kpi) => (
                    <div key={kpi.label} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-[#007AFF]/20 transition-all">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">{kpi.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value.toString()}</p>
                        </div>
                        <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center shadow-inner`}>{kpi.icon}</div>
                    </div>
                ))}
            </div>

            {/* Cobertura Territorial */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mt-6 md:mt-10">
                {coberturaTerritorial.map((kpi) => (
                    <div key={kpi.label} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-all">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">{kpi.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value}</p>
                        </div>
                        <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center shadow-inner`}>{kpi.icon}</div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default KpiSection;
