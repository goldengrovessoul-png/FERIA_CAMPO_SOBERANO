/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Search, Leaf, Activity, Check, Award, Star, Building2, Globe } from 'lucide-react';
import L from 'leaflet';
import { MapStateController } from '../MapStateController';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for Leaflet default icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ACTIVITY_COLORS: Record<string, string> = {
    'FCS': '#EF4444',             // Rojo
    'FCS - Emblemática': '#10B981', // Verde
    'Bodega móvil': '#007AFF',     // Azul
    'Cielo Abierto': '#6366F1'     // Indigo
};

// Función para generar iconos de colores dinámicos (estética Apple/Moderno)
const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="
                background-color: ${color};
                width: 14px;
                height: 14px;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 15px ${color}88, 0 4px 10px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });
};

const getMarkerIcon = (type: string) => {
    const color = ACTIVITY_COLORS[type] || '#64748b'; // Slate por defecto
    return createCustomIcon(color);
};

const createClusterCustomIcon = (cluster: Record<string, any>) => {
    const count = cluster.getChildCount();
    let size = '36px';
    let color = '#007AFF'; // Azul

    if (count > 50) {
        size = '54px';
        color = '#EF4444'; // Rojo (Crítico)
    } else if (count > 10) {
        size = '44px';
        color = '#F59E0B'; // Ámbar (Medio)
    }

    return L.divIcon({
        html: `
            <div style="
                background-color: ${color}99;
                width: ${size};
                height: ${size};
                border: 2px solid rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: 'Inter', sans-serif;
                font-weight: 900;
                font-size: 13px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            ">
                ${count}
            </div>
        `,
        className: 'marker-cluster-custom',
        iconSize: L.point(40, 40, true),
    });
};

interface TerritorialMapProps {
    filteredReports: Record<string, any>[];
    filterEstado: string;
    selectedEnte: string | null;
    selectedEstado: string | null;
    minppalPresencia: Record<string, any>[];
    vulnerabilityData: Record<string, any>[];
    catalogos: {
        entes: string[];
        actividades: string[];
        [key: string]: any;
    };
    isMapFilterOpen: boolean;
    setIsMapFilterOpen: (open: boolean) => void;
    isMapLegendOpen: boolean;
    setIsMapLegendOpen: (open: boolean) => void;
    filterEnte: string;
    setFilterEnte: (ente: string) => void;
    filterTipo: string;
    setFilterTipo: (tipo: string) => void;
    setSelectedEstado: (estado: string | null) => void;
    setSelectedEnte: (ente: string | null) => void;
    setIsDrillDownOpen: (open: boolean) => void;
    setIsStateDrillDownOpen: (open: boolean) => void;
    clearFilters: () => void;
    navigate: (path: string) => void;
}

const TerritorialMap: React.FC<TerritorialMapProps> = ({
    filteredReports,
    filterEstado,
    selectedEnte,
    selectedEstado,
    minppalPresencia,
    vulnerabilityData,
    catalogos,
    isMapFilterOpen,
    setIsMapFilterOpen,
    isMapLegendOpen,
    setIsMapLegendOpen,
    filterEnte,
    setFilterEnte,
    filterTipo,
    setFilterTipo,
    setSelectedEstado,
    setSelectedEnte,
    setIsDrillDownOpen,
    setIsStateDrillDownOpen,
    clearFilters,
    navigate
}) => {
    return (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 relative h-[500px] md:h-[620px] overflow-hidden">
            <style>{`
                .premium-popup .leaflet-popup-content-wrapper {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px) saturate(180%);
                    -webkit-backdrop-filter: blur(12px) saturate(180%);
                    border-radius: 2.5rem;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .premium-popup .leaflet-popup-content {
                    margin: 0 !important;
                    width: 280px !important;
                }
                .premium-popup .leaflet-popup-tip-container {
                    display: none;
                }
                .premium-popup .leaflet-popup-close-button {
                    padding: 20px 20px 0 0 !important;
                    color: white !important;
                    font-size: 20px !important;
                }
            `}</style>

            {/* Botones de Control Flotantes (Mobile Friendly) */}
            <div className="absolute top-6 right-6 z-[1001] flex flex-col gap-3">
                <button
                    onClick={() => setIsMapFilterOpen(!isMapFilterOpen)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md transition-all ${isMapFilterOpen ? 'bg-[#007AFF] text-white' : 'bg-white/90 text-slate-600 border border-slate-100'}`}
                >
                    <Search size={22} />
                </button>
                <button
                    onClick={() => setIsMapLegendOpen(!isMapLegendOpen)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md transition-all ${isMapLegendOpen ? 'bg-[#007AFF] text-white' : 'bg-white/90 text-slate-600 border border-slate-100'}`}
                >
                    <Leaf size={22} />
                </button>
            </div>

            {/* Cabecera del Mapa */}
            {!isMapFilterOpen && !isMapLegendOpen && (
                <div className="absolute top-6 left-6 z-[1001] bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-xl hidden sm:block">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#007AFF]">Mapa Operativo</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ubicación de Jornadas Activas</p>
                    <p className="text-[10px] font-black text-slate-600 mt-2">
                        <span className="text-[#007AFF]">{filteredReports.filter(r => r.latitud && r.longitud).length}</span> puntos georeferenciados
                    </p>
                </div>
            )}

            {/* Leyenda del Mapa (Colapsable) */}
            {isMapLegendOpen && (
                <div className="absolute bottom-6 left-6 right-6 sm:right-auto z-[1001] bg-white/95 backdrop-blur-sm p-5 rounded-3xl border border-slate-100 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leyenda de Actividades</p>
                        <button onClick={() => setIsMapLegendOpen(false)} className="text-slate-300 hover:text-red-500"><Search size={14} className="rotate-45" /></button>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3">
                        {Object.entries(ACTIVITY_COLORS).map(([type, color]) => (
                            <div key={type} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }}></div>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-full w-full rounded-[3rem] overflow-hidden">
                <MapContainer
                    center={[7.0, -66.0] as L.LatLngExpression}
                    zoom={6}
                    maxZoom={22}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapStateController
                        selectedState={filterEstado === 'Todos' ? '' : filterEstado}
                    />
                    <LayersControl position="bottomright">
                        <LayersControl.BaseLayer checked name="Satélite Premium">
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; Esri'
                                maxZoom={22}
                                maxNativeZoom={19}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Mapa de Calles">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap'
                                maxZoom={19}
                            />
                        </LayersControl.BaseLayer>

                        <LayersControl.Overlay name="🏷️ Mostrar Nombres de Lugares">
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; Esri'
                                zIndex={100}
                                maxZoom={22}
                                maxNativeZoom={19}
                            />
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name="📍 Jornadas Operativas (Filtradas)">
                            <MarkerClusterGroup
                                chunkedLoading
                                iconCreateFunction={createClusterCustomIcon}
                                maxClusterRadius={50}
                                spiderfyOnMaxZoom={true}
                                showCoverageOnHover={false}
                            >
                                {filteredReports
                                    .filter(r => r.latitud && r.longitud)
                                    .filter(r => {
                                        if (selectedEnte) {
                                            const isLeader = r.empresa?.trim().toUpperCase() === selectedEnte.trim().toUpperCase();
                                            const isInvited = minppalPresencia.some(pres =>
                                                pres.report_id === r.id &&
                                                pres.presente &&
                                                pres.ente_name?.trim().toUpperCase() === selectedEnte.trim().toUpperCase()
                                            );
                                            if (!(isLeader || isInvited)) return false;
                                        }
                                        if (selectedEstado) {
                                            const isSameState = (r.estado_geografico || '').trim().toUpperCase() === selectedEstado.trim().toUpperCase();
                                            if (!isSameState) return false;
                                        }
                                        return true;
                                    })
                                    .map(report => {
                                        const activityType = (report.tipo_actividad || '').trim().toUpperCase();
                                        return (
                                            <Marker
                                                key={`filtered-${report.id}`}
                                                position={[report.latitud, report.longitud]}
                                                icon={getMarkerIcon(activityType)}
                                            >
                                                <Popup className="premium-popup">
                                                    <div className="p-0 font-sans min-w-[280px] overflow-hidden rounded-[2rem]">
                                                        <div className="bg-slate-900 p-5 text-white">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                                                        style={{ backgroundColor: ACTIVITY_COLORS[activityType] || '#64748b' }}
                                                                    ></div>
                                                                    <p className="text-[9px] font-black opacity-70 uppercase tracking-[0.2em]">{activityType}</p>
                                                                </div>
                                                                <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 tracking-widest animate-pulse">
                                                                    ACTIVA
                                                                </span>
                                                            </div>
                                                            <h4 className="text-lg font-black uppercase tracking-tight leading-tight">{report.parroquia}</h4>
                                                            <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">
                                                                {report.municipio}, {report.estado_geografico}
                                                            </p>
                                                        </div>

                                                        <div className="p-5 space-y-5 bg-white">
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Distribución de Carga</p>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="bg-amber-50 p-2 rounded-2xl border border-amber-100/50 flex flex-col items-center">
                                                                        <Award size={14} className="text-amber-600 mb-1" />
                                                                        <span className="text-[10px] font-black text-amber-700">{(Number(report.total_proteina) || 0).toLocaleString('es-VE')} TN</span>
                                                                        <span className="text-[7px] font-bold text-amber-400 uppercase">Proteína</span>
                                                                    </div>
                                                                    <div className="bg-emerald-50 p-2 rounded-2xl border border-emerald-100/50 flex flex-col items-center">
                                                                        <Leaf size={14} className="text-emerald-600 mb-1" />
                                                                        <span className="text-[10px] font-black text-emerald-700">{(Number(report.total_hortalizas) + Number(report.total_verduras) || 0).toLocaleString('es-VE')} TN</span>
                                                                        <span className="text-[7px] font-bold text-emerald-400 uppercase">Vegetales</span>
                                                                    </div>
                                                                    <div className="bg-pink-50 p-2 rounded-2xl border border-pink-100/50 flex flex-col items-center">
                                                                        <Star size={14} className="text-pink-600 mb-1" />
                                                                        <span className="text-[10px] font-black text-pink-700">{(Number(report.total_frutas) || 0).toLocaleString('es-VE')} TN</span>
                                                                        <span className="text-[7px] font-bold text-pink-400 uppercase">Frutas</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Auditoría Técnica</p>
                                                                <div className="flex justify-between">
                                                                    {[
                                                                        { key: 'bodegaLimpia', color: '#3B82F6', label: 'Higiene' },
                                                                        { key: 'personalSuficiente', color: '#8B5CF6', label: 'Personal' },
                                                                        { key: 'entornoLimpio', color: '#10B981', label: 'Entorno' },
                                                                        { key: 'comunidadNotificada', color: '#F59E0B', label: 'Comunidad' }
                                                                    ].map((step) => {
                                                                        const active = report.audit_summary?.[step.key] === true;
                                                                        return (
                                                                            <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                                                                                <div
                                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${active ? 'border-white shadow-lg' : 'bg-slate-50 border-transparent opacity-20 text-slate-300'}`}
                                                                                    style={{ backgroundColor: active ? step.color : undefined, color: active ? 'white' : undefined }}
                                                                                >
                                                                                    {active ? <Check size={12} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300" />}
                                                                                </div>
                                                                                <span className={`text-[7px] font-black uppercase tracking-tighter ${active ? 'text-slate-900' : 'text-slate-300'}`}>
                                                                                    {step.label}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t border-slate-50">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Atención Social Consolidada</p>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center">
                                                                        <span className="text-[11px] font-black text-slate-900">{(report.comunas || 0).toLocaleString()}</span>
                                                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Comunas</span>
                                                                    </div>
                                                                    <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-100/50 flex flex-col items-center">
                                                                        <span className="text-[11px] font-black text-blue-700">{(report.familias || 0).toLocaleString()}</span>
                                                                        <span className="text-[7px] font-bold text-blue-400 uppercase tracking-tighter">Familias</span>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center">
                                                                        <span className="text-[11px] font-black text-slate-900">{(report.personas || 0).toLocaleString()}</span>
                                                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Personas</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 size={12} className="text-slate-400" />
                                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{report.empresa}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => navigate(`/ver-reporte/${report.id}`)}
                                                                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                                                    >
                                                                        Ver Informe →
                                                                    </button>
                                                                </div>
                                                                <div className="flex gap-4 pt-1 border-t border-dashed border-slate-100">
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSelectedEstado(report.estado_geografico || '');
                                                                            setIsStateDrillDownOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-2 text-[8px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                                                                    >
                                                                        <Globe size={10} /> Ver Estado
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSelectedEnte(report.empresa || '');
                                                                            setIsDrillDownOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-2 text-[8px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                                                                    >
                                                                        <Building2 size={10} /> Ver Ente
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                            </MarkerClusterGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name="⚠️ Zonas de Vulnerabilidad">
                            <LayerGroup>
                                {vulnerabilityData.map(v => {
                                    const colors = ['#10B981', '#FBBF24', '#F59E0B', '#EF4444', '#7F1D1D'];
                                    const color = colors[v.nivel_prioridad - 1] || '#EF4444';
                                    return (
                                        <Circle
                                            key={`vuln-${v.id}`}
                                            center={[v.latitud, v.longitud]}
                                            pathOptions={{
                                                fillColor: color,
                                                color: color,
                                                fillOpacity: 0.6,
                                                weight: 2
                                            }}
                                            radius={50000}
                                        >
                                            <Popup>
                                                <div className="p-3 font-sans min-w-[180px]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">VULNERABILIDAD NIVEL {v.nivel_prioridad}</p>
                                                    </div>
                                                    <p className="text-sm font-black text-slate-800 uppercase leading-tight">{v.parroquia || v.municipio}</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{v.estado}</p>
                                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                                        <p className="text-[10px] leading-relaxed text-slate-600 italic">
                                                            "{v.descripcion_problema}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Circle>
                                    );
                                })}
                            </LayerGroup>
                        </LayersControl.Overlay>
                    </LayersControl>
                </MapContainer>
            </div>

            {/* Panel de Filtros Flotante del Mapa */}
            {isMapFilterOpen && (
                <div className="absolute top-20 right-6 z-[1001] w-[280px] sm:w-[320px] animate-in slide-in-from-right-5 duration-300">
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center shadow-inner">
                                    <Activity size={18} />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 leading-tight">Panel de<br />Filtros Map</h4>
                            </div>
                            <button onClick={() => setIsMapFilterOpen(false)} className="text-slate-300 hover:text-red-500">
                                <Search size={16} className="rotate-45" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Ente / Empresa</label>
                                <select
                                    value={filterEnte}
                                    onChange={(e) => setFilterEnte(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-200 transition-all text-slate-700"
                                >
                                    <option value="Todos">🏢 Todos los Entes</option>
                                    {catalogos.entes.map(e => (
                                        <option key={`map-ente-filter-${e}`} value={e}>{e}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Tipo de Actividad</label>
                                <select
                                    value={filterTipo}
                                    onChange={(e) => setFilterTipo(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-200 transition-all text-slate-700"
                                >
                                    <option value="Todos">⚡ Todas las Act.</option>
                                    {catalogos.actividades.map(a => (
                                        <option key={`map-act-filter-${a}`} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={clearFilters}
                                    className="w-full py-2 bg-slate-100/50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                    Restablecer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TerritorialMap;
