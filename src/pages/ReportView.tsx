import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MapPin, Calendar, Download, FileText, Printer, User, Users, CheckCircle2, Home, Package } from 'lucide-react';

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
}

export default function ReportView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
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

            const { data: items } = await supabase.from('report_items').select('*').eq('report_id', id);
            const { data: payMethods } = await supabase.from('report_payment_methods').select('*').eq('report_id', id);

            // Unificar datos para que el renderizado de abajo funcione
            const formattedData = {
                ...data,
                payment_methods: payMethods || [],
                datos_formulario: {
                    ...(data.datos_formulario || {}),
                    rubros: items || [],
                    observaciones_rubros: data.datos_formulario?.observaciones_rubros || data.datos_formulario?.comentarios || 'Sin observaciones'
                }
            };

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

                {/* Cabecera del Documento */}
                <div className="bg-slate-900 text-white p-10 flex flex-col md:flex-row print:flex-row justify-between gap-8 border-b-8 border-blue-600">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Informe Técnico</h1>
                                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Feria del Campo Soberano</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-[10px] font-black uppercase">ID Documento</p>
                            <p className="font-mono text-xs opacity-70 tracking-widest">{report.id}</p>
                        </div>
                    </div>

                    <div className="text-left md:text-right print:text-right space-y-4">
                        <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${report.estado_reporte === 'enviado' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 print:bg-emerald-100' : 'bg-orange-500/10 border-orange-500 text-orange-400 print:bg-orange-100'}`}>
                            ESTADO: {report.estado_reporte}
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-[10px] font-black uppercase print:text-slate-300">Fecha de Emisión</p>
                            <p className="text-sm font-bold flex items-center md:justify-end print:justify-end gap-2 text-white print:text-white">
                                <Calendar size={14} className="text-blue-500" />
                                {new Date(report.fecha).toLocaleDateString()} - {new Date(report.fecha).toLocaleTimeString()}
                            </p>
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

                    {/* NUEVA SECCIÓN: Presencia productos MINPPAL */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6">
                            <CheckCircle2 size={18} className="text-blue-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Presencia productos MINPPAL</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-y-4 gap-x-6">
                            {(() => {
                                const labels: Record<string, string> = {
                                    lacteosLosAndes: 'Lácteos Los Andes',
                                    indugram: 'Indugram',
                                    diana: 'Diana',
                                    salbiven: 'Salbiven',
                                    argeliaLaya: 'Argelia Laya',
                                    redNutrivida: 'Red Nutrivida (INN)',
                                    nutricacao: 'Nutricacao',
                                    nutrimanoco: 'Nutrimañoco'
                                };
                                const presencia = report.datos_formulario?.presenciaMinppal;

                                if (Array.isArray(presencia)) {
                                    return presencia.length > 0 ? presencia.map(nombre => (
                                        <div key={nombre} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-blue-600 text-white">
                                                <CheckCircle2 size={10} strokeWidth={4} />
                                            </div>
                                            <span className="text-[9px] font-bold uppercase leading-snug text-slate-800">
                                                {nombre}
                                            </span>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest col-span-full">Sin presencia MINPPAL reportada</p>
                                    );
                                }

                                // Old object fallback
                                return Object.entries(labels).map(([key, label]) => {
                                    const isPresent = (presencia || {})[key];
                                    return (
                                        <div key={key} className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isPresent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                                                <CheckCircle2 size={10} strokeWidth={4} />
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase leading-snug ${isPresent ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {label}
                                            </span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
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

                    {/* Sección 7: Comentarios / Observaciones */}
                    <div>
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-4">
                            <FileText size={16} className="text-blue-600" />
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Comentarios y Observaciones del Inspector</h2>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-xs text-slate-600 leading-relaxed font-medium">
                            {report.datos_formulario?.observaciones_rubros || report.datos_formulario?.comentarios || "Sin comentarios."}
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
