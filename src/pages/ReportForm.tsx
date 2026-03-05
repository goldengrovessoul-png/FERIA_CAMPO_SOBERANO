import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Camera, Save, Send, ArrowLeft, Plus, Trash2, Users, Package, Home, ChevronDown, User, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface FoodItem {
    id?: string;
    rubro: string;
    empaque: string;
    medida: string;
    precio: string;
    cantidad: number;
}

const METODOS_PAGO = [
    "Efectivo [Moneda Nacional]",
    "Efectivo [Divisa]",
    "Punto de Venta",
    "Transferencia",
    "Pago Móvil",
    "Plataforma Externa [Zelle, Binance, etc]",
    "No Aplica"
];

export default function ReportForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reportId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Listas Dinámicas
    const [catalogos, setCatalogos] = useState({
        estados: [] as string[],
        empresas: [] as string[],
        rubros: [] as string[],
        medidas: [] as string[],
        actividades: [] as string[],
        minppal: [] as string[]
    });

    // Estados del Formulario
    const [tipoActividad, setTipoActividad] = useState('FCS');
    const [empresa, setEmpresa] = useState('');
    const [estadoGeo, setEstadoGeo] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [parroquia, setParroquia] = useState('');
    const [sector, setSector] = useState('');
    const [nombreComuna, setNombreComuna] = useState('');
    const [comunas, setComunas] = useState(0);
    const [familias, setFamilias] = useState(0);
    const [personas, setPersonas] = useState(0);

    // Totales por Categoría (En Toneladas)
    const [totalProteina, setTotalProteina] = useState(0);
    const [totalFrutas, setTotalFrutas] = useState(0);
    const [totalHortalizas, setTotalHortalizas] = useState(0);
    const [totalVerduras, setTotalVerduras] = useState(0);
    const [totalSecos, setTotalSecos] = useState(0);

    const [responsableActividad, setResponsableActividad] = useState({ nombre: '', cedula: '', telefono: '' });
    const [responsableComuna, setResponsableComuna] = useState({ nombre: '', cedula: '', telefono: '' });

    const [condiciones, setCondiciones] = useState({
        bodegaLimpia: false,
        personalSuficiente: false,
        comunidadNotificada: false,
        entornoLimpio: false, // Antes: sinContaminacion
        presenciaProteina: false,
        presenciaHortalizas: false,
        presenciaFrutas: false, // Nuevo
    });

    const [presenciaMinppal, setPresenciaMinppal] = useState<string[]>([]);

    const [metodosPago, setMetodosPago] = useState<string[]>([]);
    const [rubros, setRubros] = useState<FoodItem[]>([]);
    const [observacionesRubros, setObservacionesRubros] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isRestoring, setIsRestoring] = useState(false);

    // Cargar datos si es edición y catálogos
    useEffect(() => {
        fetchCatalogs();
        if (reportId) {
            fetchExistingReport();
        } else {
            restoreLocalDraft();
        }
    }, [reportId]);

    // Auto-save logic
    useEffect(() => {
        if (!reportId && !isRestoring && !loadingCatalogs) {
            const draftData = {
                tipoActividad, empresa, estadoGeo, municipio, parroquia, sector,
                nombreComuna, comunas, familias, personas,
                totalProteina, totalFrutas, totalHortalizas, totalVerduras, totalSecos,
                responsableActividad, responsableComuna, condiciones,
                presenciaMinppal, metodosPago, rubros, observacionesRubros, photos
            };
            localStorage.setItem('fcs_report_draft', JSON.stringify(draftData));
        }
    }, [
        tipoActividad, empresa, estadoGeo, municipio, parroquia, sector,
        nombreComuna, comunas, familias, personas,
        totalProteina, totalFrutas, totalHortalizas, totalVerduras, totalSecos,
        responsableActividad, responsableComuna, condiciones,
        presenciaMinppal, metodosPago, rubros, observacionesRubros, photos,
        reportId, isRestoring, loadingCatalogs
    ]);

    function restoreLocalDraft() {
        const savedDraft = localStorage.getItem('fcs_report_draft');
        if (savedDraft) {
            try {
                setIsRestoring(true);
                const data = JSON.parse(savedDraft);
                setTipoActividad(data.tipoActividad || 'FCS');
                setEmpresa(data.empresa || '');
                setEstadoGeo(data.estadoGeo || '');
                setMunicipio(data.municipio || '');
                setParroquia(data.parroquia || '');
                setSector(data.sector || '');
                setNombreComuna(data.nombreComuna || '');
                setComunas(data.comunas || 0);
                setFamilias(data.familias || 0);
                setPersonas(data.personas || 0);
                setTotalProteina(data.totalProteina || 0);
                setTotalFrutas(data.totalFrutas || 0);
                setTotalHortalizas(data.totalHortalizas || 0);
                setTotalVerduras(data.totalVerduras || 0);
                setTotalSecos(data.totalSecos || 0);
                setResponsableActividad(data.responsableActividad || { nombre: '', cedula: '', telefono: '' });
                setResponsableComuna(data.responsableComuna || { nombre: '', cedula: '', telefono: '' });
                setCondiciones(data.condiciones || { bodegaLimpia: false, personalSuficiente: false, comunidadNotificada: false, entornoLimpio: false, presenciaProteina: false, presenciaHortalizas: false, presenciaFrutas: false });
                setPresenciaMinppal(data.presenciaMinppal || []);
                setMetodosPago(data.metodosPago || []);
                setRubros(data.rubros || []);
                setObservacionesRubros(data.observacionesRubros || '');
                setPhotos(data.photos || []);
            } catch (e) {
                console.error("Error al restaurar borrador local:", e);
            } finally {
                setIsRestoring(false);
            }
        }
    }

    async function fetchCatalogs() {
        try {
            setLoadingCatalogs(true);
            const { data, error } = await supabase
                .from('catalog_items')
                .select('type, name')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;

            const newCatalogs = {
                estados: data.filter(i => i.type === 'ESTADO').map(i => i.name),
                empresas: data.filter(i => i.type === 'ENTE').map(i => i.name),
                rubros: data.filter(i => i.type === 'ARTICULO').map(i => i.name),
                medidas: data.filter(i => i.type === 'MEDIDA').map(i => i.name),
                actividades: data.filter(i => i.type === 'ACTIVIDAD').map(i => i.name),
                minppal: data.filter(i => i.type === 'MINPPAL').map(i => i.name)
            };

            // Fallbacks si están vacíos
            if (newCatalogs.actividades.length === 0) newCatalogs.actividades = ["FCS", "FCS - Emblemática", "Bodega móvil", "Cielo Abierto"];
            if (newCatalogs.medidas.length === 0) newCatalogs.medidas = ["Toneladas (tn)", "Gramos (gr)", "Kilogramos (kg)", "Unidades (und)", "Litros (lts)"];
            if (newCatalogs.minppal.length === 0) newCatalogs.minppal = ["LÁCTEOS LOS ANDES", "INDUGRAM", "DIANA", "SALBIVEN", "ARGELIA LAYA", "RED NUTRIVIDA", "NUTRICACAO", "NUTRIMAÑOCO"];

            setCatalogos(newCatalogs);

            // Establecer actividad por defecto si no es edición
            if (!reportId && newCatalogs.actividades.length > 0) {
                setTipoActividad(newCatalogs.actividades[0]);
            }
        } catch (error) {
            console.error('Error cargando catálogos:', error);
        } finally {
            setLoadingCatalogs(false);
        }
    }

    async function fetchExistingReport() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (error) throw error;
            if (data) {
                setTipoActividad(data.tipo_actividad);
                setEmpresa(data.empresa);
                setEstadoGeo(data.estado_geografico);
                setMunicipio(data.municipio);
                setParroquia(data.parroquia);
                setSector(data.sector || '');
                setNombreComuna(data.nombre_comuna || '');
                setComunas(data.comunas);
                setFamilias(data.familias);
                setPersonas(data.personas);

                // Cargar totales por categoría
                setTotalProteina(data.total_proteina || 0);
                setTotalFrutas(data.total_frutas || 0);
                setTotalHortalizas(data.total_hortalizas || 0);
                setTotalVerduras(data.total_verduras || 0);
                setTotalSecos(data.total_secos || 0);

                const df = data.datos_formulario || {};
                if (df.responsables) {
                    setResponsableActividad(df.responsables.actividad);
                    setResponsableComuna(df.responsables.comuna);
                }
                if (df.condiciones) setCondiciones(df.condiciones);
                if (df.presenciaMinppal) {
                    if (Array.isArray(df.presenciaMinppal)) {
                        setPresenciaMinppal(df.presenciaMinppal);
                    } else {
                        // Compatibilidad hacia atrás
                        const keysMap: Record<string, string> = {
                            lacteosLosAndes: 'LÁCTEOS LOS ANDES',
                            indugram: 'INDUGRAM',
                            diana: 'DIANA',
                            salbiven: 'SALBIVEN',
                            argeliaLaya: 'ARGELIA LAYA',
                            redNutrivida: 'RED NUTRIVIDA',
                            nutricacao: 'NUTRICACAO',
                            nutrimanoco: 'NUTRIMAÑOCO'
                        };
                        const arr = Object.keys(df.presenciaMinppal)
                            .filter(key => df.presenciaMinppal[key] === true)
                            .map(key => keysMap[key] || key.toUpperCase());
                        setPresenciaMinppal(arr);
                    }
                }
                if (df.observaciones_rubros) setObservacionesRubros(df.observaciones_rubros);
                if (df.photos) setPhotos(df.photos);

                // Cargar rubros (desde la tabla report_items)
                const { data: items } = await supabase.from('report_items').select('*').eq('report_id', reportId);
                if (items) setRubros(items.map((i: any) => ({
                    rubro: i.rubro,
                    empaque: i.empaque,
                    medida: i.medida,
                    precio: i.precio_unitario.toString(),
                    cantidad: i.cantidad
                })));

                // Cargar métodos de pago
                const { data: mp } = await supabase.from('report_payment_methods').select('metodo').eq('report_id', reportId);
                if (mp) setMetodosPago(mp.map((m: any) => m.metodo));
            }
        } catch (error) {
            console.error('Error al cargar reporte:', error);
            alert('No se pudo cargar el borrador.');
        } finally {
            setLoading(false);
        }
    }

    // Captura de GPS Automática
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError('Tu navegador no soporta geolocalización');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            (err) => {
                console.error(err);
                setLocationError('Activa el GPS para enviar el reporte.');
            },
            { enableHighAccuracy: true }
        );
    }, []);

    const toggleMetodoPago = (metodo: string) => {
        if (metodosPago.includes(metodo)) {
            setMetodosPago(metodosPago.filter(m => m !== metodo));
        } else {
            setMetodosPago([...metodosPago, metodo]);
        }
    };

    const toggleMinppal = (item: string) => {
        if (presenciaMinppal.includes(item)) {
            setPresenciaMinppal(presenciaMinppal.filter(m => m !== item));
        } else {
            setPresenciaMinppal([...presenciaMinppal, item]);
        }
    };

    const addRubro = () => setRubros([...rubros, { rubro: '', empaque: '', medida: 'kg', precio: '', cantidad: 1 }]);
    const removeRubro = (index: number) => setRubros(rubros.filter((_, i) => i !== index));
    const updateRubro = (index: number, field: keyof FoodItem, value: any) => {
        const newRubros = [...rubros];
        newRubros[index] = { ...newRubros[index], [field]: value };
        setRubros(newRubros);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos = [...photos];
        Array.from(files).forEach(file => {
            if (newPhotos.length < 3) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotos(prev => [...prev, reader.result as string].slice(0, 3));
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (estadoReporte: 'borrador' | 'enviado') => {
        if (!location && estadoReporte === 'enviado') {
            alert('Es obligatorio tener coordenadas GPS para enviar.');
            return;
        }

        if (estadoReporte === 'enviado' && !showConfirm) {
            setShowConfirm(true);
            return;
        }

        setLoading(true);
        setShowConfirm(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const reportData: any = {
                inspector_id: user?.id,
                tipo_actividad: tipoActividad,
                empresa,
                estado_geografico: estadoGeo,
                municipio,
                parroquia,
                sector,
                nombre_comuna: nombreComuna,
                comunas,
                familias,
                personas,
                total_proteina: totalProteina,
                total_frutas: totalFrutas,
                total_hortalizas: totalHortalizas,
                total_verduras: totalVerduras,
                total_secos: totalSecos,
                latitud: location?.lat || 0,
                longitud: location?.lng || 0,
                estado_reporte: estadoReporte,
                datos_formulario: {
                    responsables: { actividad: responsableActividad, comuna: responsableComuna },
                    condiciones,
                    presenciaMinppal,
                    observaciones_rubros: observacionesRubros,
                    photos
                }
            };

            let reportIdToUse = reportId;

            if (reportIdToUse) {
                const { error: updateError } = await supabase
                    .from('reports')
                    .update(reportData)
                    .eq('id', reportIdToUse);

                if (updateError) throw updateError;
            } else {
                const { data: insertedReport, error: reportError } = await supabase
                    .from('reports')
                    .insert(reportData)
                    .select()
                    .single();

                if (reportError) throw reportError;
                reportIdToUse = insertedReport.id;
            }

            // Limpiar datos antiguos
            if (reportId) {
                await supabase.from('report_items').delete().eq('report_id', reportIdToUse);
                await supabase.from('report_payment_methods').delete().eq('report_id', reportIdToUse);
            }

            // Insertar Rubros
            if (rubros.length > 0) {
                const rubrosData = rubros.map(item => ({
                    report_id: reportIdToUse,
                    rubro: item.rubro,
                    empaque: item.empaque,
                    medida: item.medida,
                    cantidad: item.cantidad,
                    precio_unitario: Number(item.precio) || 0
                }));
                const { error: rubrosError } = await supabase.from('report_items').insert(rubrosData);
                if (rubrosError) throw rubrosError;
            }

            // Insertar Métodos de Pago
            if (metodosPago.length > 0) {
                const pagosData = metodosPago.map(m => ({
                    report_id: reportIdToUse,
                    metodo: m
                }));
                const { error: pagosError } = await supabase.from('report_payment_methods').insert(pagosData);
                if (pagosError) throw pagosError;
            }

            alert(estadoReporte === 'borrador' ? 'Borrador guardado con éxito.' : '¡Informe enviado correctamente!');
            if (!reportId) localStorage.removeItem('fcs_report_draft');
            navigate('/app');
        } catch (error: any) {
            console.error('Error al procesar reporte:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingCatalogs) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Sincronizando Catálogos</h2>
                    <p className="text-sm text-slate-500 font-medium">Preparando listas dinámicas de artículos y entes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col notranslate" translate="no">

            {/* Modal de Confirmación */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">¿Confirmar Envío?</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                Una vez enviado, el informe <span className="text-red-600 font-black">no podrá ser modificado</span>. ¿Está seguro de que todos los datos son correctos?
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Revisar
                            </button>
                            <button
                                onClick={() => handleSubmit('enviado')}
                                className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Sí, Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Fijo */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Elaborar Reporte</h1>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex flex-col items-end gap-0.5 ${location ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${location ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {location ? 'GPS Activo' : 'GPS Requerido'}
                    </div>
                    {locationError && !location && <span className="text-[7px] lowercase font-bold opacity-70">{locationError}</span>}
                </div>
            </header>

            {/* Contenido Formulario */}
            <div className="flex-1 overflow-y-auto px-6 py-8 pb-40">
                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Sección 1: Tipo Actividad */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">Información General</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Actividad</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {catalogos.actividades.map(tipo => (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => setTipoActividad(tipo)}
                                            className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest transition-all border-2 ${tipoActividad === tipo ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                        >
                                            {tipo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Ente Responsable</label>
                                <div className="relative">
                                    <select
                                        translate="no"
                                        value={empresa}
                                        onChange={(e) => setEmpresa(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all notranslate"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {catalogos.empresas.map(e => <option key={e} value={e} className="notranslate">{e}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sección 2: Ubicación */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <MapPin size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Ubicación Actual</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                <div className="relative">
                                    <select
                                        value={estadoGeo}
                                        onChange={(e) => setEstadoGeo(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {catalogos.estados.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Municipio</label>
                                    <input type="text" value={municipio} onChange={(e) => setMunicipio(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase" placeholder="Ej: Sucre" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parroquia</label>
                                    <input type="text" value={parroquia} onChange={(e) => setParroquia(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase" placeholder="Ej: Petare" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector</label>
                                <input type="text" value={sector} onChange={(e) => setSector(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Ej: Jose Félix Ribas" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Comuna Beneficiaria</label>
                                <input type="text" value={nombreComuna} onChange={(e) => setNombreComuna(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Ej: Comuna Lanceros de la Patria" />
                            </div>
                        </div>
                    </section>

                    {/* Sección 3: Responsables */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Responsables</h2>
                        </div>

                        <div className="space-y-8">
                            {/* Responsable de Actividad */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit">Ente Responsable / Empresa</p>
                                <div className="space-y-4">
                                    <input type="text" value={responsableActividad.nombre} onChange={(e) => setResponsableActividad({ ...responsableActividad, nombre: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" placeholder="Nombre Completo" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={responsableActividad.cedula} onChange={(e) => setResponsableActividad({ ...responsableActividad, cedula: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" placeholder="Cédula" />
                                        <input type="text" value={responsableActividad.telefono} onChange={(e) => setResponsableActividad({ ...responsableActividad, telefono: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" placeholder="Teléfono" />
                                    </div>
                                </div>
                            </div>

                            {/* Responsable de Comuna */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">Poder Popular / Comuna</p>
                                <div className="space-y-4">
                                    <input type="text" value={responsableComuna.nombre} onChange={(e) => setResponsableComuna({ ...responsableComuna, nombre: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" placeholder="Nombre Completo" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={responsableComuna.cedula} onChange={(e) => setResponsableComuna({ ...responsableComuna, cedula: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" placeholder="Cédula" />
                                        <input type="text" value={responsableComuna.telefono} onChange={(e) => setResponsableComuna({ ...responsableComuna, telefono: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" placeholder="Teléfono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sección 4: Impacto Social (Original) */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <Users size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Impacto Social</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl group transition-all hover:bg-slate-100">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Home size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunas / Consejos Comunales</label>
                                    <input type="number" value={comunas} onChange={(e) => setComunas(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-800 focus:ring-0" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                                    <Users size={24} />
                                </div>
                                <div className="flex-1 text-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Familias</label>
                                    <input type="number" value={familias} onChange={(e) => setFamilias(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 text-center focus:ring-0" />
                                </div>
                                <div className="flex-1 text-right border-l border-slate-200">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">Personas</label>
                                    <input type="number" value={personas} onChange={(e) => setPersonas(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 text-right pr-4 focus:ring-0" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* NUEVA SECCIÓN: Distribución Consolidada (Grandes Totales) */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Package size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Distribución Consolidada (Toneladas)</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Proteína', value: totalProteina, setter: setTotalProteina, color: 'blue' },
                                { label: 'Frutas', value: totalFrutas, setter: setTotalFrutas, color: 'amber' },
                                { label: 'Hortalizas', value: totalHortalizas, setter: setTotalHortalizas, color: 'emerald' },
                                { label: 'Verduras', value: totalVerduras, setter: setTotalVerduras, color: 'orange' },
                                { label: 'Secos', value: totalSecos, setter: setTotalSecos, color: 'slate' },
                            ].map((cat) => (
                                <div key={cat.label} className="bg-slate-50 p-4 rounded-3xl space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cat.label}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={cat.value}
                                            onChange={(e) => cat.setter(Number(e.target.value))}
                                            className="w-full bg-transparent border-none p-0 text-lg font-black text-slate-800 focus:ring-0 font-mono"
                                            placeholder="0.00"
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase">TN</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sección 5: Rubros */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Package size={20} />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Rubros</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addRubro}
                                className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {rubros.map((item, index) => (
                                <div key={index} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 relative group">
                                    <button
                                        onClick={() => removeRubro(index)}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg flex items-center justify-center active:scale-90 opacity-0 group-hover:opacity-100 transition-all border border-red-50"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Rubro</label>
                                        <div className="relative">
                                            <select
                                                translate="no"
                                                value={item.rubro}
                                                onChange={(e) => updateRubro(index, 'rubro', e.target.value)}
                                                className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 appearance-none transition-all notranslate"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {catalogos.rubros.map(r => <option key={r} value={r} className="notranslate">{r}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Empaque</label>
                                            <div className="relative">
                                                <select
                                                    translate="no"
                                                    value={item.empaque}
                                                    onChange={(e) => updateRubro(index, 'empaque', e.target.value)}
                                                    className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-amber-500/10 appearance-none transition-all notranslate"
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {["Bulto", "Caja", "Envase Liquido", "Saco", "Unidad / Pieza"].map(e => <option key={e} value={e} className="notranslate">{e}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Medida</label>
                                            <div className="relative">
                                                <select
                                                    translate="no"
                                                    value={item.medida}
                                                    onChange={(e) => updateRubro(index, 'medida', e.target.value)}
                                                    className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-amber-500/10 appearance-none transition-all notranslate"
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {catalogos.medidas.map(m => <option key={m} value={m} className="notranslate">{m}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={item.cantidad}
                                                onChange={(e) => updateRubro(index, 'cantidad', Math.floor(Number(e.target.value)))}
                                                className="w-full bg-white border-none rounded-2xl p-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-amber-500/10 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio (Bs.)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.precio}
                                                onChange={(e) => updateRubro(index, 'precio', e.target.value)}
                                                className="w-full bg-white border-none rounded-2xl p-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-amber-500/10 transition-all font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Subtotal del Item */}
                                    <div className="flex justify-end pt-2">
                                        <div className="bg-amber-100/50 px-4 py-2 rounded-xl border border-amber-200/40">
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-right">Subtotal Rubro</p>
                                            <p className="text-sm font-black text-slate-900 font-mono text-right">
                                                Bs. {(Number(item.cantidad) * (Number(item.precio) || 0)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Resumen de Totales de la Sección */}
                        {rubros.length > 0 && (
                            <div className="mt-8 p-6 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 text-white flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Inversión Rubros</p>
                                    <p className="text-2xl font-black font-mono">
                                        Bs. {rubros.reduce((acc, item) => acc + (Number(item.cantidad) * (Number(item.precio) || 0)), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="text-right space-y-1 border-l border-white/20 pl-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Volumen Total</p>
                                    <p className="text-xl font-black font-mono">
                                        {rubros.reduce((acc, item) => acc + Number(item.cantidad), 0).toLocaleString()} <span className="text-[10px] uppercase">Und/Kg</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Campo de Observaciones con Contador */}
                        <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observaciones de Rubros</label>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${observacionesRubros.length >= 210 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                                    Quedan {220 - observacionesRubros.length} caracteres
                                </span>
                            </div>
                            <textarea
                                value={observacionesRubros}
                                onChange={(e) => setObservacionesRubros(e.target.value.slice(0, 220))}
                                placeholder="Escriba aquí cualquier problema o detalle con los rubros reportados..."
                                className="w-full bg-slate-50 border-none rounded-3xl p-5 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-amber-500/10 transition-all resize-none h-32"
                            />
                        </div>
                    </section>

                    {/* SECCIÓN: Presencia productos MINPPAL */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Presencia productos MINPPAL</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {catalogos.minppal.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => toggleMinppal(item)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${presenciaMinppal.includes(item) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${presenciaMinppal.includes(item) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                                        <CheckCircle2 size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-left">{item}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Sección 6: Condiciones del Punto */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Condiciones del Punto</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'bodegaLimpia', label: 'Estructura y punto de venta limpio' },
                                { id: 'personalSuficiente', label: 'Personal suficiente para la atención' },
                                { id: 'comunidadNotificada', label: 'Comunidad notificada previamente' },
                                { id: 'entornoLimpio', label: 'Entorno libre de contaminación' },
                                { id: 'presenciaProteina', label: 'Presencia de proteína animal' },
                                { id: 'presenciaHortalizas', label: 'Presencia de hortalizas' },
                                { id: 'presenciaFrutas', label: 'Presencia de frutas' },
                            ].map((cond) => (
                                <button
                                    key={cond.id}
                                    type="button"
                                    onClick={() => setCondiciones({ ...condiciones, [cond.id]: !condiciones[cond.id as keyof typeof condiciones] })}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${condiciones[cond.id as keyof typeof condiciones] ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${condiciones[cond.id as keyof typeof condiciones] ? 'bg-teal-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                                        <CheckCircle2 size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-tight text-left">{cond.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Sección 7: Métodos de Pago */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-6">Métodos de Pago</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {METODOS_PAGO.map(metodo => (
                                <button
                                    key={metodo}
                                    type="button"
                                    onClick={() => toggleMetodoPago(metodo)}
                                    className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest transition-all border-2 ${metodosPago.includes(metodo) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                >
                                    {metodo}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Sección 8: Fotos */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                <Camera size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Evidencias Fotográficas</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {photos.map((photo, index) => (
                                <div key={index} className="aspect-square rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm bg-slate-50">
                                    <img src={photo} alt={`Captura ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(index)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {photos.length < 3 && (
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                                    <Camera size={24} className="mb-1 opacity-50" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Libre</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-[2rem] font-bold text-xs shadow-xl active:scale-95 transition-all cursor-pointer">
                                <Camera size={20} />
                                USAR CÁMARA
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={photos.length >= 3}
                                />
                            </label>
                            <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-100 text-slate-700 rounded-[2rem] font-bold text-xs active:scale-95 transition-all cursor-pointer border border-slate-200">
                                <Package size={20} />
                                GALERÍA
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={photos.length >= 3}
                                />
                            </label>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6 opacity-60 text-center">
                            {photos.length} de 3 imágenes capturadas
                        </p>
                    </section>
                </div>
            </div>

            {/* Footer Fijo con Botones de Acción */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl px-6 py-6 border-t border-slate-100 flex gap-4 z-50">
                <button
                    onClick={() => handleSubmit('borrador')}
                    disabled={loading}
                    className="flex-1 py-5 bg-slate-100 text-slate-700 font-black rounded-[2rem] text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Save size={18} /> Borrador
                </button>
                <button
                    onClick={() => handleSubmit('enviado')}
                    disabled={loading || !location}
                    className="flex-[2] py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-[2rem] text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? 'Procesando...' : (
                        <>
                            <Send size={18} /> Enviar Informe
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
}
