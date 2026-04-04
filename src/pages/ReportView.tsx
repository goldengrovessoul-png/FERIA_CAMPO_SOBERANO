/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MapPin, Calendar, Download, Printer, User, Users, CheckCircle2, Home, Package, Star } from 'lucide-react';

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
    datos_formulario: any;
    presencia_detallada?: { nombre: string; productos: string[] }[];
    entrepreneurs?: { nombre: string; actividad: string; telefono: string }[];
    profiles?: { nombre: string; apellido: string }; // Nombre del Inspector
}

export default function ReportView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function fetchReport() {
        if (!id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return;

            const [itemsRes, payMethodsRes, presenciaRes, catalogRes, entrepreneursRes] = await Promise.all([
                supabase.from('report_items').select('*').eq('report_id', id),
                supabase.from('report_payment_methods').select('*').eq('report_id', id),
                supabase.from('report_minppal_presencia').select('*').eq('report_id', id),
                supabase.from('catalog_items').select('id, name, type').in('type', ['MINPPAL', 'ARTICULO']),
                supabase.from('report_entrepreneurs').select('*').eq('report_id', id)
            ]);

            const catalogMap = (catalogRes.data || []).reduce((acc: any, item: any) => {
                acc[item.id] = item.name;
                return acc;
            }, {});

            // Agrupar presencia por ente para visualizar mejor
            const presenciaAgrupada = (presenciaRes.data || []).reduce((acc: any, item: any) => {
                if (!acc[item.ente_id]) {
                    acc[item.ente_id] = {
                        nombre: catalogMap[item.ente_id] || 'Ente Desconocido',
                        productos: []
                    };
                }
                acc[item.ente_id].productos.push(catalogMap[item.producto_id] || 'Producto Desconocido');
                return acc;
            }, {});

            // Unificar datos para que el renderizado de abajo funcione
            const formattedData: ReportDetails = {
                ...data,
                payment_methods: payMethodsRes.data || [],
                presencia_detallada: Object.values(presenciaAgrupada),
                entrepreneurs: entrepreneursRes.data || [],
                datos_formulario: {
                    ...(data.datos_formulario || {}),
                    rubros: itemsRes.data || [],
                    observaciones_rubros: data.datos_formulario?.observaciones_rubros || data.datos_formulario?.comentarios || 'Sin observaciones'
                }
            };

            // Cargar datos del inspector de forma segura si existe el ID
            if (data.inspector_id) {
                const { data: profData } = await supabase
                    .from('profiles')
                    .select('nombre, apellido')
                    .eq('id', data.inspector_id)
                    .single();

                if (profData) {
                    formattedData.profiles = profData;
                }
            }

            setReport(formattedData);
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('No se pudo cargar el reporte.');
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
                    {/* Bloque Izquierdo: Logo e Identificación */}
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

                    {/* Bloque Derecho: Título, Estado y Tiempo */}
                    <div className="text-left md:text-right print:text-right space-y-6 shrink-0 pt-2">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black uppercase tracking-tight leading-none text-white">Reporte</h1>
                            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Feria del Campo Soberano</p>
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

                {/* Cuerpo del Documento */}
                <div className="p-10 space-y-12">

                    {/* Sección 1: Datos de Localización */}
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
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Coordenadas de Verificación</p>
                                <p className="font-mono text-[10px] font-bold text-blue-600">
                                    LAT: {report.latitud ? Number(report.latitud).toFixed(6) : '0.000000'} | LNG: {report.longitud ? Number(report.longitud).toFixed(6) : '0.000000'}
                                </p>
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
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Comuna Impactada</p>
                                <p className="text-xs font-bold text-slate-700 uppercase">{report.nombre_comuna || 'General'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Ubicación Exacta (Minimapa) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                            <MapPin size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Georreferenciación Exacta de la Jornada</h2>
                        </div>
                        <div className="w-full h-[300px] bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 relative shadow-inner">
                            {report.latitud && report.longitud ? (
                                <img 
                                    src={`https://static-maps.yandex.ru/1.x/?ll=${report.longitud},${report.latitud}&z=17&l=sat,skl&size=650,300&pt=${report.longitud},${report.latitud},pm2rdl`} 
                                    alt="Mapa Satelital" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback a mapa plano si falla el satelital
                                        (e.target as HTMLImageElement).src = `https://static-maps.yandex.ru/1.x/?ll=${report.longitud},${report.latitud}&z=16&l=map&size=650,300&pt=${report.longitud},${report.latitud},pm2rdl`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Coordenadas no disponibles para el mapa</p>
                                </div>
                            )}
                            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Punto de Verificación Satelital</p>
                            </div>
                        </div>
                    </div>


                    {/* Sección 2: Responsables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8">
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-4">
                                <User size={16} className="text-blue-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-800">Ente Responsable</h3>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 uppercase mb-1">{report.datos_formulario?.responsables?.actividad?.nombre || 'No Registrado'}</p>
                            <p className="text-[9px] text-slate-500 font-medium">C.I: {report.datos_formulario?.responsables?.actividad?.cedula || 'N/A'}</p>
                            <p className="text-[9px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">TLF: {report.datos_formulario?.responsables?.actividad?.telefono || 'N/A'}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Home size={16} className="text-emerald-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Poder Popular</h3>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 uppercase mb-1">{report.datos_formulario?.responsables?.comuna?.nombre || 'No Registrado'}</p>
                            <p className="text-[9px] text-slate-500 font-medium">C.I: {report.datos_formulario?.responsables?.comuna?.cedula || 'N/A'}</p>
                            <p className="text-[9px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">TLF: {report.datos_formulario?.responsables?.comuna?.telefono || 'N/A'}</p>
                        </div>
                    </div>

                    {/* SECCIÓN: Presencia productos MINPPAL */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <CheckCircle2 size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Presencia productos MINPPAL</h2>
                        </div>
                        
                        {report.presencia_detallada && report.presencia_detallada.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {report.presencia_detallada.map((ente, idx) => (
                                    <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-900">{ente.nombre}</h3>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 pl-8">
                                            {ente.productos.map((prod, pIdx) => (
                                                <div key={pIdx} className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[8px] font-bold text-slate-600 uppercase">
                                                    {prod}
                                                </div>
                                            ))}
                                            {ente.productos.length === 0 && (
                                                <span className="text-[8px] italic text-slate-400 uppercase">Sin productos específicos registrados</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No se reportó presencia de productos MINPPAL</p>
                            </div>
                        )}
                    </div>

                    {/* Sección 3: Condiciones Técnicas */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <CheckCircle2 size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Verificación de Condiciones</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-y-4 gap-x-6">
                            {(report.datos_formulario?.condiciones ? Object.entries(report.datos_formulario.condiciones) : []).map(([key, value]) => {
                                const labels: Record<string, string> = {
                                    bodegaLimpia: 'Estructura e Higiene del Punto',
                                    personalSuficiente: 'Personal suficiente para atención',
                                    comunidadNotificada: 'Comunidad notificada previamente',
                                    entornoLimpio: 'Entorno libre de contaminación',
                                    presenciaProteina: 'Suministro de Proteína Animal',
                                    presenciaHortalizas: 'Suministro de Hortalizas',
                                    presenciaFrutas: 'Suministro de Frutas',
                                    sinContaminacion: 'Entorno libre de contaminación' // Compatibilidad con reportes viejos
                                };
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${value ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-transparent'}`}>
                                            <CheckCircle2 size={10} strokeWidth={4} />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase leading-snug">
                                            {labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sección 5: Detalle de Rubros (Tabla) */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <Package size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Detalle de Distribución por Rubro</h2>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rubro / Artículo</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Empaque</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Unit.</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(report.datos_formulario?.rubros || []).map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-800 uppercase">{item.rubro}</p>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-medium text-slate-500 uppercase">{item.empaque}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-black text-slate-900 font-mono">
                                                    {item.cantidad.toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-black text-slate-400 ml-1 uppercase">{item.medida}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-600 font-mono">
                                                Bs. {Number(item.precio_unitario || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-blue-600 font-mono">
                                                Bs. {(Number(item.cantidad || 0) * Number(item.precio_unitario || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-blue-50/30">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Inversión en Rubros</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-blue-700 font-mono">
                                            Bs. {(report.datos_formulario?.rubros || []).reduce((acc: number, item: any) => acc + (Number(item.cantidad || 0) * Number(item.precio_unitario || 0)), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Sección 6: Fotografías (Evidencia) */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <Download size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Registro Fotográfico (Anexos)</h2>
                        </div>
                        <div className="grid grid-cols-3 print:grid-cols-3 gap-4">
                            {report.datos_formulario?.photos?.map((photo: string, idx: number) => (
                                <div key={idx} className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                    <img src={photo} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                            )) || (
                                    <div className="col-span-3 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No se adjuntaron fotografías</p>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Sección 7: Emprendedores Participantes */}
                    {report.entrepreneurs && report.entrepreneurs.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                                <Users size={18} className="text-indigo-600" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Emprendedores Participantes</h2>
                                <span className="ml-auto bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                                    {report.entrepreneurs.length} Registrado{report.entrepreneurs.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-slate-100">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-indigo-50/50">
                                        <tr>
                                            <th className="px-5 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">#</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Nombre</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Tipo de Actividad</th>
                                            <th className="px-5 py-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Teléfono</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {report.entrepreneurs.map((ent: any, idx: number) => (
                                            <>
                                                <tr key={`ent-${idx}`} className="hover:bg-slate-50/50">
                                                    <td className="px-5 py-3 text-[10px] font-black text-slate-400">{idx + 1}</td>
                                                    <td className="px-5 py-3 text-xs font-bold text-slate-800 uppercase">{ent.nombre}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-3 py-1 rounded-full">{ent.actividad}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500 font-mono">{ent.telefono || '—'}</td>
                                                </tr>
                                                {ent.datos_extras && Object.keys(ent.datos_extras).length > 0 && (
                                                    <tr key={`ent-extra-${idx}`} className="bg-indigo-50/30">
                                                        <td></td>
                                                        <td colSpan={3} className="px-5 py-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(ent.datos_extras).map(([k, v]) => (
                                                                    <span key={k} className="text-[8px] font-bold bg-white border border-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase">
                                                                        {k.replace(/_/g, ' ')}: {String(v)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Sección 8: Valoración de los Rubros */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-4">
                            <Star size={16} className="text-amber-500" />
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Valoración Cualitativa de Rubros</h2>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
                            {(() => {
                                const rating = Number(report.datos_formulario?.rating_rubros || report.datos_formulario?.observaciones_rubros);
                                if (!isNaN(rating) && rating > 0) {
                                    return (
                                        <>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star 
                                                        key={s} 
                                                        size={24} 
                                                        className={rating >= s ? 'text-amber-500' : 'text-slate-200'} 
                                                        fill={rating >= s ? 'currentColor' : 'none'} 
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                Calificación: {rating} / 5
                                            </p>
                                        </>
                                    );
                                }
                                return (
                                    <p className="text-xs font-semibold text-slate-500 italic">
                                        {report.datos_formulario?.observaciones_rubros || report.datos_formulario?.comentarios || "Sin valoración registrada."}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Footer del Documento */}
                <div className="bg-slate-50 p-8 border-t border-slate-200 flex flex-col md:flex-row print:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-300">
                            <Printer size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema de Control Feria</p>
                            <p className="text-[9px] font-bold text-slate-500">Generado automáticamente bajo firma digital.</p>
                        </div>
                    </div>
                    <div className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
                        CONFIDENCIAL
                    </div>
                </div>
            </div>

            <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest print:hidden">
                © 2026 Ministerio del Poder Popular para la Alimentación
            </p>
        </div >
    );
}
