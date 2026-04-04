/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    BarChart3, Users, LogOut, Search,
    TrendingUp, Package,
    Activity, RefreshCw, Home,
    ChevronDown, Award, Building2, Eraser, Star, AlertTriangle, Percent, ArrowDownRight,
    Leaf, UserPlus
} from 'lucide-react';

import { useAuth } from '../lib/AuthContext';
import TerritorialMap from '../components/dashboard/TerritorialMap';
import KpiSection from '../components/dashboard/KpiSection';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';
import MinppalPresence from '../components/dashboard/MinppalPresence';
import DashboardDrawers from '../components/dashboard/DashboardDrawers';

import JefePlanningTable from '../components/JefePlanningTable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend, LabelList, ReferenceLine
} from 'recharts';


import { useDashboardData } from '../hooks/useDashboardData';

const StateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none min-w-[260px]">
                <p className="text-[11px] font-black text-[#007AFF] uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-3">ESTADO: {label}</p>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Total Actividades:</span>
                        <span className="text-slate-900">{data.value}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Comunas Atendidas:</span>
                        <span className="text-slate-900">{data.comunas}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Total Personas Atendidas:</span>
                        <span className="text-blue-600 font-bold">{data.personas.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Total Distribuido:</span>
                        <span className="text-emerald-600 font-bold">{data.total_distribuido.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const MONO_BLUE = [
    '#007AFF', // Solid
    '#268DFF', // Tint 1
    '#4D9FFF', // Tint 2
    '#73B2FF', // Tint 3
    '#99C5FF', // Tint 4
    '#BFD8FF', // Tint 5
    '#1B66D1'  // Shade 1
];

// ChartGradients component is removed as per instruction to inline defs

export default function JefeDashboard() {
    const navigate = useNavigate();
    const { session, loading: authLoading } = useAuth();
    const {
        loading, debug, reports, filteredReports, filteredReportIds, reportItems, minppalPresencia,
        searchTerm, setSearchTerm, filterEstado, setFilterEstado, filterTipo, setFilterTipo,
        filterEnte, setFilterEnte, filterRubro, setFilterRubro, startDate, setStartDate, endDate, setEndDate,
        clearFilters, fetchData, proteinEfficiency, entrepreneurDiversity, abastecimientoHogar,
        monthlyComparison, priceTrackingData, foodDistribution, paymentData, timelineData,
        stateData, priceComparisonByState, activityTypeData, sicaData, rubroPresenceData,
        rubroVolumeData, minppalProductsPresenceData, savingsImpactData, entrepreneurStats,
        ratingData, inspectorReportData, enteReportData, proteinPresenceStats, hortalizasPresenceStats,
        frutasPresenceStats, minppalDetailData, totalEstados, totalMunicipios, totalParroquias,
        comunasByStateData, familiasByStateData, selectedEnte, setSelectedEnte, selectedEstado,
        setSelectedEstado, enteJornadasDetails, estadoJornadasDetails, vulnerabilityData, catalogos,
        entrepreneurs
    } = useDashboardData(session, authLoading);

    // Estados para UI interactiva del Mapa
    const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
    const [isMapLegendOpen, setIsMapLegendOpen] = useState(false);

    // Estados para el Drill-down del Jefe (Funcionalidad Premium)
    const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
    const [isStateDrillDownOpen, setIsStateDrillDownOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F2F2F7] text-slate-900 font-sans relative">
            <div className="fixed top-0 left-0 right-0 bg-black text-white p-1 z-[9999] text-[9px] font-mono text-center flex flex-wrap justify-center gap-4 opacity-80">
                <span>DEBUG: {debug}</span>
                <span>R: {reports.length}</span>
                <span>Filt: {filteredReports.length}</span>
                <span>Fam: {filteredReports.reduce((acc, r) => acc + Number(r.familias || 0), 0)}</span>
                <span>Prot: {filteredReports.reduce((acc, r) => acc + Number(r.total_proteina || 0), 0)}</span>
            </div>
            <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center sticky top-0 z-[1000] gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#007AFF] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase font-['Outfit']">Tablero de Gestión</h1>
                        <p className="text-[#007AFF] text-[10px] md:text-[13px] font-black uppercase tracking-[0.1em] mt-1 md:mt-2 font-mono">Feria del Campo Soberano</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {session?.user?.user_metadata?.rol === 'ADMIN' && (
                        <button onClick={() => navigate('/admin')} className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-500/30">
                            Volver al Admin
                        </button>
                    )}
                    <button onClick={() => fetchData()} className="flex-1 md:flex-none p-3 bg-slate-100 text-slate-600 hover:text-[#007AFF] hover:bg-blue-50 rounded-2xl transition-all border border-slate-200 flex justify-center">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => navigate('/login')} className="flex-[3] md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg">
                        <LogOut size={16} /> Salir
                    </button>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-[1640px] mx-auto space-y-6 md:space-y-10">
                {debug.includes('Error') && (
                    <div className="bg-red-50 border border-red-200 p-6 md:p-8 rounded-[2rem] shadow-sm text-red-900 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                                <span className="text-2xl font-black">!</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase mb-2 tracking-tight">Error de Conexión de Red</h2>
                                <p className="text-sm font-medium mb-3">La aplicación no puede conectar con el servidor (Supabase). No es un error de código, es un bloqueo de tu conexión local a internet (ERR_QUIC_PROTOCOL_ERROR o similar).</p>
                                <p className="text-[11px] font-mono font-bold bg-white p-3 border border-red-100 rounded-xl mb-4 text-red-700">{debug}</p>
                                <h3 className="text-xs font-black uppercase tracking-widest text-red-800 mb-2">Posibles Soluciones Rápidas:</h3>
                                <ul className="text-xs mt-2 list-disc pl-5 opacity-90 space-y-1">
                                    <li>Pausa tu <strong>Antivirus</strong> (el "Escudo Web" de Avast o Kaspersky a menudo bloquea estas conexiones).</li>
                                    <li>Desconéctate de VPNs o redes corporativas restrictivas.</li>
                                    <li>Prueba a abrir la app desde otro navegador (Microsoft Edge, Firefox) o en Pestaña de Incógnito (Ctrl+Shift+N).</li>
                                    <li><strong>Solución directa en Chrome:</strong> Abre <code>chrome://flags/#enable-quic</code> en una pestaña nueva, deshabilita "Experimental QUIC protocol", y reinicia tu navegador.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-200/60">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Centro de Búsqueda</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refina el análisis operativo</p>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-100"
                        >
                            <Eraser size={14} /> Limpiar Filtros
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Búsqueda</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF]" size={16} />
                                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Parroquia o Municipio..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black outline-none focus:border-[#007AFF]/20 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado / Entidad</label>
                            <div className="relative">
                                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black appearance-none outline-none focus:border-[#007AFF]/20 transition-all">
                                    <option value="Todos">Todos los Estados</option>
                                    {catalogos.estados.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo Actividad</label>
                            <div className="relative">
                                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black appearance-none outline-none">
                                    <option value="Todos">Todos los Tipos</option>
                                    {catalogos.actividades.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ente / Empresa</label>
                            <div className="relative">
                                <select value={filterEnte} onChange={(e) => setFilterEnte(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black appearance-none outline-none">
                                    <option value="Todos">Todos los Entes</option>
                                    {catalogos.entes.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 border-t border-slate-50 pt-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rubro Específico</label>
                            <div className="relative">
                                <select value={filterRubro} onChange={(e) => setFilterRubro(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black appearance-none outline-none">
                                    <option value="Todos">Todos los Rubros</option>
                                    {catalogos.articulos.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Desde</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Hasta</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black outline-none" />
                        </div>
                    </div>
                </div>

                {/* KPIs y Cobertura Territorial (Modularizado) */}
                <KpiSection 
                    filteredReports={filteredReports}
                    totalEstados={totalEstados}
                    totalMunicipios={totalMunicipios}
                    totalParroquias={totalParroquias}
                />


                {/* PANEL ANALÍTICO TERRITORIAL (Modularizado) */}
                <AnalyticsCharts 
                    comunasByStateData={comunasByStateData}
                    familiasByStateData={familiasByStateData}
                    setSelectedEstado={setSelectedEstado}
                    setIsDrillDownOpen={setIsDrillDownOpen}
                    setIsStateDrillDownOpen={setIsStateDrillDownOpen}
                />

                {/* PANEL MINPPAL (Modularizado) */}
                <MinppalPresence 
                    minppalDetailData={minppalDetailData}
                    setSelectedEnte={setSelectedEnte}
                    setIsDrillDownOpen={setIsDrillDownOpen}
                    setIsStateDrillDownOpen={setIsStateDrillDownOpen}
                />



                {/* ── MAPA OPERATIVO (Modularizado) ──────────────────────────── */}
                <TerritorialMap 
                    filteredReports={filteredReports}
                    filterEstado={filterEstado}
                    filterTipo={filterTipo}
                    setFilterTipo={setFilterTipo}
                    selectedEnte={selectedEnte}
                    selectedEstado={selectedEstado}
                    minppalPresencia={minppalPresencia}
                    vulnerabilityData={vulnerabilityData}
                    catalogos={catalogos}
                    isMapFilterOpen={isMapFilterOpen}
                    setIsMapFilterOpen={setIsMapFilterOpen}
                    isMapLegendOpen={isMapLegendOpen}
                    setIsMapLegendOpen={setIsMapLegendOpen}
                    filterEnte={filterEnte}
                    setFilterEnte={setFilterEnte}
                    setSelectedEstado={setSelectedEstado}
                    setSelectedEnte={setSelectedEnte}
                    setIsDrillDownOpen={setIsDrillDownOpen}
                    setIsStateDrillDownOpen={setIsStateDrillDownOpen}
                    clearFilters={clearFilters}
                    navigate={navigate}
                />



                {/* Grid Analítico Principal Reestructurado para Simetría */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">

                    {/* FILA 1: Histórico y Despliegue Ente */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-blue-50 text-[#007AFF] rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Histórico de Jornadas</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timelineData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} />
                                        <Line type="monotone" dataKey="count" stroke="#007AFF" strokeWidth={4} dot={{ r: 4, fill: '#007AFF', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-inner"><Building2 size={20} /></div>
                                <div>
                                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Actividades Organizadas (por Ente)</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distribución de Liderazgo Operativo</p>
                                </div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={enteReportData} layout="vertical" margin={{ left: 20, right: 50, top: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorAmber2" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#D97706" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#fff' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                                        <Bar 
                                            dataKey="value" 
                                            fill="url(#colorAmber2)" 
                                            radius={[0, 10, 10, 0]} 
                                            barSize={16}
                                            style={{ cursor: 'pointer' }}
                                            onClick={(data) => {
                                                if (data && data.name) {
                                                    setSelectedEnte(data.name);
                                                    setIsStateDrillDownOpen(false); 
                                                    setIsDrillDownOpen(true);
                                                }
                                            }}
                                        >
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 900, fill: '#D97706' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* FILA 2: Tripleta Central de Distribución */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Activity size={20} /></div>
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Tipos de Actividad</h3>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activityTypeData} margin={{ top: 20 }}>
                                        <defs>
                                            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#007AFF" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#007AFF" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                        <XAxis dataKey="name" hide />
                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: 900 }} />
                                        <Bar dataKey="value" fill="url(#colorBlue)" radius={[10, 10, 0, 0]} barSize={40}>
                                            <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
                            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-12">Cobranza Consolidada</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paymentData} layout="vertical" margin={{ left: 20, right: 50, top: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorIndigo" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#4F46E5" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                        <Bar dataKey="value" fill="url(#colorIndigo)" radius={[0, 10, 10, 0]} barSize={18}>
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 900, fill: '#4F46E5' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full flex flex-col items-center">
                            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-10 text-center">Distribución Alimentaria (TN)</h3>
                            <div className="h-[320px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={foodDistribution}
                                            innerRadius={75}
                                            outerRadius={105}
                                            paddingAngle={10}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={8}
                                        >
                                            {foodDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={MONO_BLUE[index % MONO_BLUE.length]} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                            formatter={(value: any) => [Number(value || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'TN']}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-50px]">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter font-['Outfit']">
                                        {foodDistribution.reduce((a, b) => a + Number(b.value), 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">TN Totales</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* FILA 3: Actividades por Estado y Auditoría de Calidad */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-full">
                            <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center shadow-inner">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Actividades por Estado</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analítica de despliegue territorial</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[600px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stateData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorBlueH" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#007AFF" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#007AFF" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={140}
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                            interval={0}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<StateTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" fill="url(#colorBlueH)" radius={[0, 12, 12, 0]} barSize={16}>
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 900, fill: '#007AFF' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 h-full flex flex-col">
                            <div className="mb-10">
                                <h3 className="text-[11px] font-black uppercase text-[#007AFF] tracking-[0.25em] mb-1">Auditoría</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estándares de Control Interno</p>
                            </div>

                            <div className="flex flex-col gap-5 flex-grow">
                                {[
                                    { label: 'Higiene de Bodega', key: 'bodegaLimpia', icon: <Package size={20} />, color: '#3B82F6', light: '#eff6ff' },
                                    { label: 'Entorno Limpio', key: 'entornoLimpio', icon: <Activity size={20} />, color: '#10B981', light: '#ecfdf5' },
                                    { label: 'Notificación Comunitaria', key: 'comunidadNotificada', icon: <Users size={20} />, color: '#6366F1', light: '#eef2ff' },
                                    { label: 'Personal Suficiente', key: 'personalSuficiente', icon: <UserPlus size={20} />, color: '#8B5CF6', light: '#f5f3ff' }
                                ].map((item) => {
                                    const total = filteredReports.length || 1;
                                    const count = filteredReports.filter((r: any) => r.audit_summary?.[item.key] === true).length;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={item.key} className="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/50 flex items-center gap-6 group hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-500">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0" style={{ backgroundColor: item.light, color: item.color }}>
                                                {item.icon}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                                        <div className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{count}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100">
                                                            {pct}%
                                                        </span>
                                                        <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">Cumplimiento</p>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-white rounded-full overflow-hidden mt-3 shadow-inner p-[1px]">
                                                    <div className="h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                                                </div>
                                                <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                    Presente en {count} de {total} (Total Jornadas)
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* NUEVA SECCIÓN: ANALÍTICA DETALLADA DE RUBROS CRÍTICOS */}
                <div className="lg:col-span-12 space-y-8">
                    {[
                        {
                            title: 'Sostenibilidad de Proteína Animal',
                            stats: proteinPresenceStats,
                            color: '#F59E0B',
                            lightColor: '#FEF3C7',
                            icon: <Award size={22} />
                        },
                        {
                            title: 'Sostenibilidad de Hortalizas y Verduras',
                            stats: hortalizasPresenceStats,
                            color: '#84CC16',
                            lightColor: '#F7FEE7',
                            icon: <Leaf size={22} />
                        },
                        {
                            title: 'Sostenibilidad de Frutas',
                            stats: frutasPresenceStats,
                            color: '#EC4899',
                            lightColor: '#FDF2F8',
                            icon: <Star size={22} />
                        }
                    ].map((category, idx) => (
                        <div key={idx} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
                            <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: category.lightColor, color: category.color }}>
                                    {category.icon}
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">{category.title}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Presente en {category.stats.presenceCount} de {category.stats.total} jornadas (corresponde al {category.stats.pct}% del total)
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                                    <div className="h-[240px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={category.stats.globalChartData}
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                    cornerRadius={6}
                                                >
                                                    {category.stats.globalChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                                    formatter={(value: any) => [value, 'Jornadas']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                                            <span className="text-3xl font-black text-slate-900 tracking-tighter" style={{ color: category.color }}>
                                                {category.stats.presenceCount}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Jornadas SI</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SI ({category.stats.presenceCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">NO ({category.stats.absenceCount})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-8">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Presencia Efectiva por Entidad Federal (Monto Numérico)</p>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={category.stats.stateChartData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    width={140}
                                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                                    interval={0}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '16px', border: 'none' }}
                                                    formatter={(value: any) => [value, 'Jornadas con Presencia']}
                                                />
                                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={12}>
                                                    {category.stats.stateChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={category.color} fillOpacity={0.1 + (0.9 * (entry.value / (Math.max(...category.stats.stateChartData.map(d => d.value)) || 1)))} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="value"
                                                        position="right"
                                                        style={{ fontSize: 10, fontWeight: 900, fill: category.color }}
                                                        formatter={(v: any) => v > 0 ? v : ''}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}


                    {/* FILA 4: Productividad (Ancho Completo) */}
                    <div className="lg:col-span-12">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20"><Users size={20} /></div>
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Productividad de Inspectores</h3>
                            </div>
                            <div className="h-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={inspectorReportData} layout="vertical" margin={{ left: 10, right: 40, top: 20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorDark" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#1e293b" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#1e293b" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                        <Bar dataKey="value" fill="url(#colorDark)" radius={[0, 10, 10, 0]} barSize={18}>
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 900, fill: '#1e293b' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN: PRESENCIA DE PRODUCTOS ESPECÍFICOS MINPPAL (Gráfico A) */}
                <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 mt-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Presencia de Productos Específicos (Nivel Entes MINPPAL)</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gráfico A: Detección de artículos por marca/ente en campo</p>
                        </div>
                    </div>
                    <div className="h-[600px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={minppalProductsPresenceData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmberA" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={240}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                    interval={0}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#fef3c7' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
                                    formatter={(v) => [`${v} Jornadas`, 'Presencia']}
                                />
                                <Bar dataKey="value" fill="url(#colorAmberA)" radius={[0, 12, 12, 0]} barSize={14}>
                                    <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 900, fill: '#b45309' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mt-8">
                    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Rubros del Sector Privado (Terceros)</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gráfico C: Presencia de rubros base en campo</p>
                            </div>
                        </div>
                        <div className="h-[700px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rubroPresenceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#fcfcfc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                    <Bar dataKey="value" fill="url(#colorIndigo3)" radius={[0, 10, 10, 0]} barSize={12}>
                                        <defs>
                                            <linearGradient id="colorIndigo3" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#4F46E5" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <LabelList dataKey="value" position="right" style={{ fontSize: 9, fontWeight: 900, fill: '#4F46E5' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Volumen por Rubro Privado</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gráfico D: Consolidado de distribución (Terceros)</p>
                            </div>
                        </div>
                        <div className="h-[700px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rubroVolumeData} layout="vertical" margin={{ left: 10, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#fcfcfc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                    <Bar dataKey="value" fill="url(#colorEmerald2)" radius={[0, 10, 10, 0]} barSize={12}>
                                        <defs>
                                            <linearGradient id="colorEmerald2" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <LabelList dataKey="value" position="right" formatter={(v: any) => v > 0 ? Math.round(v).toLocaleString('es-VE', { maximumFractionDigits: 0 }) : ''} style={{ fontSize: 9, fontWeight: 900, fill: '#059669' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* SEGUIMIENTO OPERATIVO DE LAS FERIAS DEL CAMPO SOBERANO (GUIA SICA) */}
                <div className="mt-8 bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col">
                    <div className="text-center mb-10">
                        <h2 className="lg:text-xl text-lg font-black uppercase text-slate-900 tracking-tighter">Seguimiento Operativo de las Ferias del Campo Soberano</h2>
                        <p className="md:text-sm text-xs font-bold text-slate-500 mt-2">¿Presentó la Guía de Movilización de Alimentos del SICA de los Alimentos entregados en la Feria o Punto de Distribución Radial?</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* CHART SICA */}
                        <div className="flex flex-col items-center justify-center relative min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Sí', value: sicaData.totalSi },
                                            { name: 'No', value: sicaData.totalNo }
                                        ].filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={110}
                                        outerRadius={180}
                                        dataKey="value"
                                        stroke="white"
                                        strokeWidth={6}
                                        labelLine={true}
                                        label={({ cx, cy, midAngle = 0, innerRadius, outerRadius, value, name, percent = 0 }) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            const align = x > cx ? 'start' : 'end';
                                            return (
                                                <text x={x} y={y} fill={name === 'Sí' ? '#22c55e' : '#ef4444'} textAnchor={align} dominantBaseline="central" className="font-sans">
                                                    <tspan x={x} dy="-10" fontSize="16" fontWeight="bold">{name}</tspan>
                                                    <tspan x={x} dy="20" fontSize="16" fontWeight="bold">{value}</tspan>
                                                    <tspan x={x} dy="20" fontSize="14" fill="#64748b" fontWeight="normal">{(percent * 100).toFixed(0)}%</tspan>
                                                </text>
                                            );
                                        }}
                                    >
                                        <Cell key="cell-0" fill="#22c55e" /> {/* Verde - Sí */}
                                        <Cell key="cell-1" fill="#ef4444" /> {/* Rojo - No */}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* TABLE SICA */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                            <table className="w-full text-left text-[11px] bg-white lg:text-sm">
                                <thead>
                                    <tr className="uppercase font-black text-slate-900 border-b border-slate-200">
                                        <th className="px-3 py-2 bg-slate-100 border-r border-slate-300">Entidad Federal</th>
                                        <th className="px-3 py-2 bg-[#22c55e] border-r border-white/20 text-white text-center w-28">Sí</th>
                                        <th className="px-3 py-2 bg-[#ef4444] text-white text-center w-28">No</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sicaData.stateRows.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 font-semibold text-slate-700">
                                            <td className="px-3 py-1.5 border-r border-slate-200">{row.entidad}</td>
                                            <td className="px-3 py-1.5 border-r border-slate-200 text-center text-slate-900">{row.si > 0 ? row.si : ''}</td>
                                            <td className="px-3 py-1.5 text-center text-slate-900">{row.no > 0 ? row.no : ''}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-[3px] border-slate-800 font-black bg-slate-50 text-slate-900">
                                        <td className="px-3 py-3 border-r border-slate-200 text-center uppercase tracking-widest text-sm text-slate-900">TOTAL</td>
                                        <td className="px-3 py-3 border-r border-slate-200 text-center text-base">{sicaData.totalSi}</td>
                                        <td className="px-3 py-3 text-center text-base">{sicaData.totalNo}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN: VALORACIÓN ESTATAL DE RUBROS (Sustituye a Novedades) */}
                <div className="mt-8 bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <Star size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Calificación de Rubros (1-5)</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distribución de valoraciones cuantitativas reportadas por inspectores</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratingData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                <XAxis
                                    dataKey="star"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 900, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${value} Reportes`, 'Frecuencia']}
                                />
                                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80}>
                                    {ratingData.map((entry: any, index: number) => {
                                        // Semántica de colores: 1-2 Rojo, 3 Amarillo, 4-5 Verde
                                        let color = '#22c55e'; // Verde
                                        if (entry.rating <= 2) color = '#ef4444'; // Rojo
                                        else if (entry.rating === 3) color = '#f59e0b'; // Ámbar/Amarillo

                                        return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                    <LabelList dataKey="value" position="top" style={{ fontSize: 14, fontWeight: 900, fill: '#475569' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 flex justify-center gap-8 border-t border-slate-50 pt-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Prioridad Crítica</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Atención Requerida</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Operación Óptima</span>
                        </div>
                    </div>
                </div>

                {/* NUEVO KPI: EMPRENDIMIENTO (Al final para no alterar la visual) */}
                <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <Award size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Impacto de Emprendimiento</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Participación de actores locales en las jornadas</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-slate-50 p-4 px-8 rounded-[2rem] border border-white shadow-sm">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Emprendedores</p>
                                <p className="text-3xl font-black text-slate-900 leading-none">{entrepreneurStats.total}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200"></div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Alcance Territorial</p>
                                <p className="text-3xl font-black text-slate-900 leading-none">
                                    {new Set(entrepreneurs.filter(e => filteredReportIds.has(e.report_id)).map(e => {
                                        const r = reports.find(rep => rep.id === e.report_id);
                                        return r?.estado_geografico;
                                    })).size}
                                </p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Estados</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-12">
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={entrepreneurStats.chartData}>
                                        <defs>
                                            <linearGradient id="colorIndEnt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4F46E5" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [`${value} Emprendedores`, 'Actividad']}
                                        />
                                        <Bar dataKey="value" fill="url(#colorIndEnt)" radius={[12, 12, 0, 0]} barSize={60}>
                                            <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 900, fill: '#4F46E5' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ── SECCIÓN: CONTROL DE AHORRO SOCIAL Y MONITOREO DE PRECIOS ── */}
                <div className="mt-12 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-['Outfit']">Control de Ahorro Social</h2>
                            <p className="text-emerald-500 text-sm font-black uppercase tracking-[0.2em] mt-2 font-mono">Monitoreo de Precios y Beneficio a la Población</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-emerald-50 p-4 px-8 rounded-3xl border border-emerald-100 flex flex-col items-center">
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Ahorro Promedio</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-500" />
                                    <p className="text-2xl font-black text-emerald-600">
                                        {priceTrackingData.length > 0
                                            ? (priceTrackingData.reduce((acc, curr) => acc + curr.savings, 0) / priceTrackingData.length).toFixed(1)
                                            : '0.0'}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rubro / Artículo</th>
                                        <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Referencia Nacional</th>
                                        <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Promedio Ferias</th>
                                        <th className="pb-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ahorro (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceTrackingData.length > 0 ? priceTrackingData.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                                            <td className="py-6 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 group-hover:text-[#007AFF] transition-colors uppercase leading-none">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 px-2 py-0.5 bg-slate-50 rounded-lg self-start">{item.presentation}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase mb-1">Bs.</span>
                                                    <span className="text-lg font-black text-slate-800 font-mono tracking-tight">{item.nationalRef.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase mb-1">Bs.</span>
                                                    <span className={`text-lg font-black font-mono tracking-tight ${item.avgFair > item.nationalRef ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {item.avgFair > 0 ? item.avgFair.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : 'S/D'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${item.savings > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} font-black`}>
                                                    {item.savings > 0 ? <ArrowDownRight size={14} /> : <AlertTriangle size={14} />}
                                                    <span className="text-sm font-mono">{Math.abs(item.savings).toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay datos de precios disponibles con los filtros actuales</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── SECCIÓN: ANÁLISIS DE INDICADORES ESTRATÉGICOS (KPIs SOLICITADOS) ── */}
                <div className="mt-12 space-y-12 pb-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-['Outfit']">Análisis de Indicadores Estratégicos</h2>
                            <p className="text-[#007AFF] text-sm font-black uppercase tracking-[0.2em] mt-2 font-mono">Medición Avanzada de Impacto Operativo</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                        {/* KPI 1: Eficiencia en Proteína */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100/50 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                                    <Percent size={32} />
                                </div>
                                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 text-center">Eficiencia en Proteína</h4>
                                <div className="text-6xl font-black text-slate-900 tracking-tighter mb-4 flex items-baseline justify-center">
                                    {Math.round(proteinEfficiency.totalProteina).toLocaleString('es-VE')}
                                    <span className="text-2xl opacity-30 ml-2">TN</span>
                                </div>
                                <span className="px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
                                    {proteinEfficiency.pct}% del Volumen Total
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase text-center leading-relaxed mt-10 max-w-[250px]">
                                    Volumen absoluto de proteína animal distribuido a nivel nacional.
                                </p>
                            </div>
                        </div>

                        {/* KPI 3: Abastecimiento per Cápita */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 bg-blue-50 text-[#007AFF] rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                                    <Home size={32} />
                                </div>
                                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 text-center">Abastecimiento por Hogar</h4>
                                <div className="text-6xl font-black text-slate-900 tracking-tighter mb-4 flex items-baseline justify-center">
                                    {abastecimientoHogar.kg.toLocaleString('es-VE')}
                                    <span className="text-2xl opacity-30 ml-2">KG</span>
                                </div>
                                <span className="px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-[#007AFF] shadow-sm border border-blue-100">
                                    Promedio Nacional
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase text-center leading-relaxed mt-10 max-w-[250px]">
                                    Distribución per cápita estimada en base a {abastecimientoHogar.familias.toLocaleString('es-VE')} familias abastecidas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                        {/* KPI 2: Diversidad Productiva (Emprendedores) */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                            <div className="flex items-center gap-5 mb-12">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase text-slate-900 tracking-tighter">Diversidad Productiva</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Media de emprendedores por actividad</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={entrepreneurDiversity} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                                        <Bar dataKey="value" fill="#6366F1" radius={[0, 10, 10, 0]} barSize={20}>
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 900, fill: '#4F46E5' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* KPI 4: Comparativa Mensual */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden group min-h-[400px]">
                            <div className={`absolute -right-10 -top-10 w-48 h-48 ${monthlyComparison.trend === 'up' ? 'bg-blue-50' : 'bg-orange-50'} rounded-full blur-3xl transition-all duration-700`}></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className={`w-14 h-14 ${monthlyComparison.trend === 'up' ? 'bg-blue-50 text-[#007AFF]' : 'bg-orange-50 text-orange-600'} rounded-2xl flex items-center justify-center shadow-inner`}>
                                        <TrendingUp size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-slate-900 tracking-tighter">Tendencia Mensual</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cobertura de Familias</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 mb-10">
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Mes Actual</div>
                                    <div className="flex items-center gap-5">
                                        <div className="text-6xl font-black text-slate-900 tracking-tighter">{monthlyComparison.cur.toLocaleString('es-VE')}</div>
                                        <div className={`flex flex-col items-center p-3 rounded-2xl ${monthlyComparison.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            <span className="text-xl font-black">{monthlyComparison.trend === 'up' ? '↑' : '↓'}</span>
                                            <span className="text-sm font-black">{monthlyComparison.pct}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-8">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Mes Anterior</p>
                                        <p className="text-xl font-black text-slate-800 tracking-tight">{monthlyComparison.last.toLocaleString('es-VE')}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado</p>
                                        <p className={`text-[11px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg ${monthlyComparison.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {monthlyComparison.trend === 'up' ? 'Crecimiento' : 'Contracción'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECCIÓN: COMPARATIVA DE PRECIOS POR ESTADO (NUEVA MÉTRICA SOLICITADA) ── */}
                <div className="mt-12 bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-20 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Comparativa de Precio por Estado</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Alertas Visuales vs Precio Nacional Sugerido (Catálogo)</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <label className="absolute -top-6 left-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cambiar Rubro</label>
                                <select
                                    value={filterRubro}
                                    onChange={(e) => setFilterRubro(e.target.value)}
                                    className="w-full pl-5 pr-10 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-red-100 transition-all appearance-none"
                                >
                                    <option value="Todos">-- SELECCIONE UN RUBRO --</option>
                                    {catalogos.articulos.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>

                            {priceComparisonByState.referencePrice > 0 && (
                                <div className="bg-red-600 px-6 py-3 rounded-2xl shadow-lg shadow-red-200 min-w-[180px]">
                                    <p className="text-[9px] font-bold text-red-100 uppercase tracking-widest mb-1 text-center">Ref. Nacional Sugerida</p>
                                    <p className="text-xl font-black text-white text-center">Bs. {priceComparisonByState.referencePrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                            PRECIO PROMEDIO DE {priceComparisonByState.productName} POR ESTADO
                        </h2>
                    </div>

                    <div className="h-[800px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={priceComparisonByState.data}
                                layout="vertical"
                                margin={{ left: 20, right: 80, top: 20, bottom: 20 }}
                            >
                                <defs>
                                    <linearGradient id="colorPriceBar" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                <XAxis type="number" hide domain={[0, priceComparisonByState.referencePrice * 1.2 || 'auto']} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={150}
                                    tick={{ fontSize: 10, fontStyle: 'normal', fontWeight: 900, fill: '#1e293b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 'Precio Promedio']}
                                />

                                {priceComparisonByState.referencePrice > 0 && (
                                    <ReferenceLine
                                        x={priceComparisonByState.referencePrice}
                                        stroke="#ef4444"
                                        strokeDasharray="5 5"
                                        strokeWidth={3}
                                        label={{
                                            position: 'top',
                                            value: `Precio Mercado: Bs. ${priceComparisonByState.referencePrice.toLocaleString()}`,
                                            fill: '#ef4444',
                                            fontSize: 10,
                                            fontWeight: 900
                                        }}
                                    />
                                )}

                                <Bar dataKey="avgPrice" fill="url(#colorPriceBar)" radius={[0, 10, 10, 0]} barSize={24}>
                                    <LabelList
                                        dataKey="avgPrice"
                                        position="right"
                                        formatter={(v: any) => `Bs. ${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                                        style={{ fontSize: 11, fontWeight: 900, fill: '#1e3a8a' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* ── SECCIÓN: ANÁLISIS DE IMPACTO SOCIAL Y AHORRO ── */}
                <div className="mt-12 bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-12 overflow-hidden relative group">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-200">
                                <TrendingUp size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-['Outfit']">Impacto de Ahorro Social</h2>
                                <p className="text-emerald-600 text-[11px] font-black uppercase tracking-[0.2em] mt-1 font-mono">Contraste de Precios: MINPPAL vs Sector Privado</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="bg-emerald-50 px-8 py-5 rounded-[2rem] border border-emerald-100/50">
                                <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mb-1">Ahorro Generado al Pueblo</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-black text-emerald-600/50">Bs.</span>
                                    <span className="text-3xl font-black text-emerald-700 tracking-tighter">
                                        {savingsImpactData.totalAhorroVal.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-slate-900 px-8 py-5 rounded-[2rem] shadow-2xl shadow-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">% Impacto Eficacia</p>
                                <p className="text-3xl font-black text-white text-center tracking-tighter">
                                    {savingsImpactData.totalAhorroPct.toFixed(1)}<span className="text-sm opacity-50 ml-1">%</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                        {/* Gráfico Comparativo de Inversión */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between px-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Inversión Proyectada (Escala Nacional)</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#007AFF]"></div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">Minppal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">Privado</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[350px] w-full bg-slate-50/50 rounded-[2.5rem] p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={savingsImpactData.comparativoGlobal} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                        />
                                        <YAxis hide domain={[0, 'dataMax + 100000']} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-VE')}`, 'Monto Total']}
                                        />
                                        <Bar dataKey="valor" radius={[15, 15, 15, 15]} barSize={60}>
                                            {savingsImpactData.comparativoGlobal.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <LabelList
                                                dataKey="valor"
                                                position="top"
                                                formatter={(v: any) => `Bs. ${Number(v).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`}
                                                style={{ fontSize: 11, fontWeight: 900, fill: '#1e293b' }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase text-center italic px-10">
                                * Este gráfico contrasta la inversión real de los rubros distribuidos frente a su costo equivalente en el mercado privado nacional.
                            </p>
                        </div>

                        {/* Ranking Top Ahorro */}
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Ranking: Mayor Impacto de Ahorro (Top 10)</h4>
                            <div className="bg-slate-50/50 rounded-[2.5rem] p-2 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                                            <th className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Ahorro total</th>
                                            <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Eficiencia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50">
                                        {savingsImpactData.ranking.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-white transition-all">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-none">{item.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{item.presentacion}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="text-xs font-black text-slate-700 font-mono">
                                                        Bs. {item.ahorroTotal.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] font-mono">
                                                        <ArrowDownRight size={10} />
                                                        {item.porcentajeAhorro.toFixed(0)}%
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 lg:px-0">
                    <JefePlanningTable
                        filterEstado={filterEstado}
                        reportItems={reportItems}
                        filteredReportIds={filteredReportIds}
                        catalog={catalogos.fullCatalog}
                    />
                </div>

                <div className="pb-10"></div>
            </main>

            {/* ── DRAWERS DE DRILL-DOWN MODULARIZADOS ── */}
            <DashboardDrawers 
                isDrillDownOpen={isDrillDownOpen}
                setIsDrillDownOpen={setIsDrillDownOpen}
                isStateDrillDownOpen={isStateDrillDownOpen}
                setIsStateDrillDownOpen={setIsStateDrillDownOpen}
                selectedEnte={selectedEnte}
                setSelectedEnte={setSelectedEnte}
                selectedEstado={selectedEstado}
                setSelectedEstado={setSelectedEstado}
                enteJornadasDetails={enteJornadasDetails}
                estadoJornadasDetails={estadoJornadasDetails}
            />
        </div>
    );
}
