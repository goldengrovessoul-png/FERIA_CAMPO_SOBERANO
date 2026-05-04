/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Download, Printer, User, Users, CheckCircle2, Home, Package, Star, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ReportService } from '../services/ReportService';

const MapPinIcon = L.divIcon({
    className: 'custom-pin-icon',
    html: `
        <div style="
            width: 24px;
            height: 24px;
            background-color: #EF4444;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
        </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

interface ReportDetails {
    id: string;
    fecha: string;
    tipo_actividad: string;
    empresa: string;
    estado_geografico: string;
    municipio: string;
    parroquia: string;
    sector: string;
    nombre_comuna: string;
    comunas: number;
    familias: number;
    personas: number;
    latitud: number;
    longitud: number;
    estado_reporte: string;
    comunidades_beneficiadas?: string;
    bodega_movil_nombre?: string;
    datos_formulario: any;
    presencia_detallada?: { nombre: string; productos: string[] }[];
    entrepreneurs?: { nombre: string; actividad: string; telefono: string }[];
    profiles?: { nombre: string; apellido: string }; 
    guia_sica_foto?: string;
    guia_sica_estado?: string;
}

export default function ReportView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function fetchReport() {
        if (!id) return;
        try {
            setLoading(true);
            const data = await ReportService.getReportById(id);
            if (!data) throw new Error('No data');

            // Formatear fotos para que apunten al servidor local si no son base64
            const formatPhoto = (url: string) => {
                if (!url) return '';
                if (url.startsWith('data:') || url.startsWith('http')) return url;
                return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
            };

            if (data.guia_sica_foto) data.guia_sica_foto = formatPhoto(data.guia_sica_foto);
            if (data.datos_formulario?.photos) {
                data.datos_formulario.photos = data.datos_formulario.photos.map(formatPhoto);
            }

            setReport(data);
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('No se pudo cargar el reporte del servidor local.');
            navigate('/app');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando Documento...</p>
                </div>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white flex flex-col items-center py-10 print:py-0 px-4 md:px-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] print:bg-none">
            {/* Header de Navegación (Solo Web) */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden px-4">
                <button
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm text-slate-700 font-bold hover:bg-slate-50 transition-all border border-slate-200"
                >
                    <ArrowLeft size={20} />
                    VOLVER
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all outline-none"
                    >
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* DOCUMENTO TIPO PDF */}
            <div className="w-full max-w-4xl bg-white shadow-2xl rounded-[1rem] overflow-hidden border border-slate-200 relative print:shadow-none print:m-0 print:border-none">

                <div className="bg-slate-900 text-white p-10 flex flex-col md:flex-row print:flex-row justify-between items-start gap-12 border-b-8 border-blue-600">
                    <div className="space-y-8 flex-1">
                        <div className="flex flex-col gap-6">
                            <img 
                                src="/Logo_Minppal.jpeg" 
                                alt="Logo MINPPAL" 
                                className="h-28 w-auto object-contain rounded-xl" 
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-60">ID Documento de Control</p>
                                <p className="font-mono text-[11px] opacity-80 tracking-[0.2em]">{report.id}</p>
                            </div>
                            <div className="space-y-1 border-t border-slate-700/50 pt-2">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-60">Inspector Responsable</p>
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                                    {report.profiles ? `${report.profiles.nombre} ${report.profiles.apellido}` : 'SISTEMA AUTOMATIZADO'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-left md:text-right print:text-right space-y-6 shrink-0 pt-2">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black uppercase tracking-tight leading-none text-white">Reporte</h1>
                            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{report.tipo_actividad || 'Feria del Campo Soberano'}</p>
                            {report.bodega_movil_nombre && (
                                <p className="text-amber-400 text-[12px] font-black uppercase tracking-widest bg-amber-400/10 inline-block px-2 py-1 rounded">
                                    BODEGA: {report.bodega_movil_nombre}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className={`inline-block px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border-2 shadow-lg ${report.estado_reporte === 'enviado' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-emerald-500/20' : 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-orange-500/20'}`}>
                                ESTADO: {report.estado_reporte}
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Fecha de Certificación</p>
                                <p className="text-sm font-bold flex items-center md:justify-end print:justify-end gap-2 text-white">
                                    <Calendar size={14} className="text-blue-500" />
                                    {new Date(report.fecha).toLocaleDateString()} - {new Date(report.fecha).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                <MapPin size={18} className="text-blue-600" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Ubicación Geográfica</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Estado</p>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{report.estado_geografico}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Municipio</p>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{report.municipio}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Parroquia</p>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{report.parroquia}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Sector</p>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{report.sector || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                <Users size={18} className="text-blue-600" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Impacto Social</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">Comunas</p>
                                    <p className="text-xl font-black text-slate-800">{report.comunas}</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">Familias</p>
                                    <p className="text-xl font-black text-slate-800">{report.familias}</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">Personas</p>
                                    <p className="text-xl font-black text-slate-800">{report.personas}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                            <MapPin size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Georreferenciación Satelital</h2>
                        </div>
                        <div className="w-full h-[300px] bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 relative shadow-inner">
                            {report.latitud && report.longitud ? (
                                <MapContainer
                                    center={[report.latitud, report.longitud]}
                                    zoom={17}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" />
                                    <Marker position={[report.latitud, report.longitud]} icon={MapPinIcon} />
                                </MapContainer>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <Package size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Detalle de Distribución</h2>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Rubro</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Cantidad</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Precio Unit.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(report.datos_formulario?.rubros || []).map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 text-xs font-bold uppercase">{item.rubro}</td>
                                            <td className="px-6 py-4 text-center text-xs font-black">{item.cantidad} {item.medida}</td>
                                            <td className="px-6 py-4 text-right text-xs font-bold">Bs. {item.precio_unitario}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <Download size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Registro Fotográfico</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {report.datos_formulario?.photos?.map((photo: string, idx: number) => (
                                <div key={idx} className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                    <img src={photo} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Printer size={20} className="text-slate-300" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Sistema de Control Feria</p>
                            <p className="text-[9px] font-bold text-slate-500">Local Independent Infrastructure</p>
                        </div>
                    </div>
                    <div className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-blue-600 uppercase">
                        CONFIDENCIAL
                    </div>
                </div>
            </div>
        </div >
    );
}
