/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Camera, Save, Send, ArrowLeft, Plus, Trash2, Users, Package, Home, ChevronDown, User, CheckCircle2, AlertTriangle, X, FileText, UserPlus, Star, Search } from 'lucide-react';

interface FoodItem {
    id?: string;
    rubro: string;
    empaque: string;
    medida: string;
    precio: string;
    cantidad: number;
}

interface CatalogEntry {
    id: string;
    name: string;
    type: string;
    parent_id?: string | null;
    empresa_id?: string | null;
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
        minppal: [] as CatalogEntry[],
        productos_minppal: [] as CatalogEntry[],
        entrepreneurTypes: [] as string[],
        fullCatalog: [] as any[]
    });
    const [customEntrepFields, setCustomEntrepFields] = useState<{id: string, nombre: string, etiqueta: string, tipo: string, requerido: boolean}[]>([]);

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

    const [dpaData, setDpaData] = useState<{ estado: string, municipio: string, parroquia: string }[]>([]);

    const dpaEstados = useMemo(() => {
        const unique = Array.from(new Set(dpaData.map(d => d.estado)));
        // Asegurar que Petare y Dependencias siempre estén si existen en dpaData
        return unique.sort();
    }, [dpaData]);

    const dpaMunicipios = useMemo(() => {
        return Array.from(new Set(dpaData.filter(d => d.estado.toUpperCase() === estadoGeo.toUpperCase()).map(d => d.municipio))).sort();
    }, [dpaData, estadoGeo]);

    const dpaParroquias = useMemo(() => {
        return Array.from(new Set(dpaData.filter(d => d.estado.toUpperCase() === estadoGeo.toUpperCase() && d.municipio.toUpperCase() === municipio.toUpperCase()).map(d => d.parroquia))).sort();
    }, [dpaData, estadoGeo, municipio]);

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

    // Estructura: { enteId: string, productosIds: string[] }[]
    const [presenciaEntes, setPresenciaEntes] = useState<{ enteId: string, productosIds: string[] }[]>([]);

    const [metodosPago, setMetodosPago] = useState<string[]>([]);
    const [rubros, setRubros] = useState<FoodItem[]>([]);
    const [entrepreneurs, setEntrepreneurs] = useState<{ nombre: string, actividad: string, telefono: string, datos_extras: Record<string, string> }[]>([]);
    const [ratingRubros, setRatingRubros] = useState<number>(0);
    const [photos, setPhotos] = useState<string[]>([]);
    const [rubrosSearch, setRubrosSearch] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

    const isInvalid = (field: string) => validationErrors[field];
    const errorClass = (field: string) => isInvalid(field) 
        ? 'border-[3px] border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)] bg-red-50/10' 
        : 'border-transparent';

    const clearError = (field: string) => {
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Guía SICA (Opcional)
    const [guiaSicaEstado, setGuiaSicaEstado] = useState('');
    const [guiaSicaFoto, setGuiaSicaFoto] = useState('');

    // Cargar datos si es edición y catálogos
    useEffect(() => {
        fetchCatalogs();
        if (reportId) {
            fetchExistingReport();
        } else {
            restoreLocalDraft();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId]);

    // Auto-save logic
    useEffect(() => {
        if (!reportId && !isRestoring && !loadingCatalogs) {
            const draftData = {
                tipoActividad, empresa, estadoGeo, municipio, parroquia, sector,
                nombreComuna, comunas, familias, personas,
                totalProteina, totalFrutas, totalHortalizas, totalVerduras, totalSecos,
                responsableActividad, responsableComuna, condiciones,
                presenciaEntes, metodosPago, rubros, entrepreneurs, ratingRubros, photos,
                guiaSicaEstado, guiaSicaFoto
            };
            localStorage.setItem('fcs_report_draft', JSON.stringify(draftData));
        }
    }, [
        tipoActividad, empresa, estadoGeo, municipio, parroquia, sector,
        nombreComuna, comunas, familias, personas,
        totalProteina, totalFrutas, totalHortalizas, totalVerduras, totalSecos,
        responsableActividad, responsableComuna, condiciones,
        presenciaEntes, metodosPago, rubros, entrepreneurs, ratingRubros, photos,
        guiaSicaEstado, guiaSicaFoto,
        reportId, isRestoring, loadingCatalogs
    ]);

    // Recálculo automático de totales por categoría
    useEffect(() => {
        if (loadingCatalogs) return;

        const totals = { proteina: 0, frutas: 0, hortalizas: 0, verduras: 0, secos: 0 };
        
        rubros.forEach(item => {
            const qty = Number(item.cantidad) || 0;
            if (qty <= 0) return;

            // Encontrar el item en el catálogo para saber su categoría (padre)
            const catItem = catalogos.fullCatalog.find(c => c.name.trim().toUpperCase() === item.rubro.trim().toUpperCase());
            let categoryName = '';

            if (catItem) {
                if (catItem.type === 'RUBRO' && !catItem.parent_id) {
                    categoryName = catItem.name.trim().toUpperCase();
                } else if (catItem.parent_id) {
                    const parent = catalogos.fullCatalog.find(p => p.id === catItem.parent_id);
                    if (parent && parent.type === 'RUBRO') {
                        categoryName = parent.name.trim().toUpperCase();
                    }
                }
            }

            // Normalización: de la medida seleccionada a TONELADAS
            let tons = 0;
            const m = item.medida.toLowerCase();
            if (m.includes('ton')) tons = qty;
            else if (m.includes('kg')) tons = qty / 1000;
            else if (m.includes('gr')) tons = qty / 1000000;
            else if (m.includes('und') || m.includes('pza') || m.includes('caja') || m.includes('bulto')) {
                // Para unidades, usamos un peso estimado si no hay más info (ej. 1kg por unidad)
                // O mejor, el usuario ya debería haber reportado en kg si es peso.
                // Si es unidad, asumimos 1kg como base conservadora o lo dejamos en 0 si no es pesable.
                tons = qty / 1000; 
            }

            if (categoryName.includes('PROTE')) totals.proteina += tons;
            else if (categoryName.includes('FRUTA')) totals.frutas += tons;
            else if (categoryName.includes('HORTA')) totals.hortalizas += tons;
            else if (categoryName.includes('VERDU')) totals.verduras += tons;
            else if (categoryName.includes('SECO')) totals.secos += tons;
            else {
                // Fallback por nombre de rubro directo
                const name = item.rubro.trim().toUpperCase();
                if (name.includes('PROTE')) totals.proteina += tons;
                else if (name.includes('FRUTA')) totals.frutas += tons;
                else if (name.includes('HORTA')) totals.hortalizas += tons;
                else if (name.includes('VERDU')) totals.verduras += tons;
                else if (name.includes('SECO')) totals.secos += tons;
            }
        });

        setTotalProteina(Number(totals.proteina.toFixed(3)));
        setTotalFrutas(Number(totals.frutas.toFixed(3)));
        setTotalHortalizas(Number(totals.hortalizas.toFixed(3)));
        setTotalVerduras(Number(totals.verduras.toFixed(3)));
        setTotalSecos(Number(totals.secos.toFixed(3)));

    }, [rubros, catalogos.fullCatalog, loadingCatalogs]);

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
                setPresenciaEntes(data.presenciaEntes || []);
                setMetodosPago(data.metodosPago || []);
                setRubros(data.rubros || []);
                setEntrepreneurs(data.entrepreneurs || []);
                setRatingRubros(Number(data.ratingRubros) || 0);
                setPhotos(data.photos || []);
                setGuiaSicaEstado(data.guiaSicaEstado || '');
                setGuiaSicaFoto(data.guiaSicaFoto || '');
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
            const [catalogRes, dpaRes] = await Promise.all([
                supabase.from('catalog_items').select('id, type, name, parent_id, empresa_id').eq('is_active', true).order('name', { ascending: true }),
                supabase.from('venezuela_dpa').select('*').limit(3000)
            ]);

            if (catalogRes.error) throw catalogRes.error;
            if (dpaRes.error) throw dpaRes.error;

            setDpaData(dpaRes.data || []);

            const data = catalogRes.data;

            const newCatalogs = {
                estados: data.filter((i: any) => i.type === 'ESTADO').map((i: any) => i.name),
                empresas: data.filter((i: any) => i.type === 'ENTE').map((i: any) => i.name),
                rubros: data.filter((i: any) => (i.type === 'ARTICULO' || i.type === 'RUBRO')).map((i: any) => i.name),
                medidas: data.filter((i: any) => i.type === 'MEDIDA').map((i: any) => i.name),
                actividades: data.filter((i: any) => i.type === 'ACTIVIDAD').map((i: any) => i.name),
                minppal: data.filter((i: any) => i.type === 'MINPPAL' || i.type === 'ENTE').map((i: any) => ({ id: i.id, name: i.name, type: i.type })),
                productos_minppal: data.filter((i: any) => (i.type === 'ARTICULO' || i.type === 'RUBRO')).map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    type: i.type,
                    parent_id: i.parent_id,
                    empresa_id: i.empresa_id
                })),
                entrepreneurTypes: [] as string[],
                fullCatalog: data
            };

            // Cargar Tipos de Emprendimiento desde la tabla específica
            const { data: entrepData } = await supabase.from('cat_emprendimiento_tipos').select('nombre').order('nombre', { ascending: true });
            newCatalogs.entrepreneurTypes = entrepData?.map(e => e.nombre) || [];

            // Cargar campos personalizados de emprendimiento
            const { data: customFieldsData } = await supabase
                .from('cat_emprendimiento_campos')
                .select('id, nombre, etiqueta, tipo, requerido')
                .order('orden', { ascending: true });
            setCustomEntrepFields((customFieldsData || []).filter((f: any) => !['nombre', 'actividad', 'telefono'].includes(f.nombre)));

            // Fallbacks si están vacíos
            if (newCatalogs.actividades.length === 0) newCatalogs.actividades = ["FCS", "FCS - Emblemática", "Bodega móvil", "Cielo Abierto"];
            if (newCatalogs.medidas.length === 0) newCatalogs.medidas = ["Toneladas (tn)", "Gramos (gr)", "Kilogramos (kg)", "Unidades (und)", "Litros (lts)"];
            if (newCatalogs.minppal.length === 0) newCatalogs.minppal = [];

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

    // Filtrar el catálogo de artículos/rubros para la nueva UI de checklist
    const availableItems = useMemo(() => {
        return (catalogos.fullCatalog || []).filter((i: any) => i.type === 'ARTICULO' || i.type === 'RUBRO');
    }, [catalogos.fullCatalog]);

    const filteredItems = useMemo(() => {
        if (!rubrosSearch.trim()) return availableItems;
        const s = rubrosSearch.toLowerCase();
        return availableItems.filter((i: any) => i.name.toLowerCase().includes(s));
    }, [availableItems, rubrosSearch]);

    const toggleRubroPresencia = (catalogItem: any) => {
        const existe = rubros.find(r => r.rubro === catalogItem.name);
        if (existe) {
            setRubros(rubros.filter(r => r.rubro !== catalogItem.name));
        } else {
            // Determinar medida default según nombre o presentación
            let measure = 'kg';
            const pres = (catalogItem.presentacion || '').toUpperCase();
            const name = (catalogItem.name || '').toUpperCase();
            if (pres.includes('LT') || pres.includes('LITRO') || name.includes('LITRO')) measure = 'litro';
            else if (name.includes('UNID') || pres.includes('UNID')) measure = 'unidad';
            
            setRubros([...rubros, {
                rubro: catalogItem.name,
                empaque: 'Unidad / Pieza',
                medida: measure,
                precio: '',
                cantidad: 1
            }]);
        }
    };

    const updateRubroValue = (name: string, field: keyof FoodItem, value: any) => {
        setRubros(prev => prev.map(r => {
            if (r.rubro === name) {
                return { ...r, [field]: value };
            }
            return r;
        }));
    };

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
                if (df.presenciaEntes) {
                    setPresenciaEntes(df.presenciaEntes);
                } else if (df.presenciaMinppal) {
                    // Mapear datos antiguos a la nueva estructura
                    // Como no tenemos los IDs de los entes antiguos fácilmente aquí,
                    // esta parte será un poco limitada hasta que se recarguen los catálogos
                }
                if (df.rating_rubros) setRatingRubros(Number(df.rating_rubros));
                if (df.photos) setPhotos(df.photos);

                // Cargar Guía SICA (Nuevos campos)
                setGuiaSicaEstado(data.guia_sica_estado || '');
                setGuiaSicaFoto(data.guia_sica_foto || '');

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

                // Cargar Emprendedores
                const { data: ents } = await supabase.from('report_entrepreneurs').select('*').eq('report_id', reportId);
                if (ents) setEntrepreneurs(ents.map((e: any) => ({
                    nombre: e.nombre,
                    actividad: e.actividad,
                    telefono: e.telefono || '',
                    datos_extras: e.datos_extras || {}
                })));
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

    const toggleEnte = (enteId: string) => {
        const existe = presenciaEntes.find(p => p.enteId === enteId);
        if (existe) {
            setPresenciaEntes(presenciaEntes.filter(p => p.enteId !== enteId));
        } else {
            setPresenciaEntes([...presenciaEntes, { enteId, productosIds: [] }]);
        }
    };

    const toggleProductoEnte = (enteId: string, productoId: string) => {
        setPresenciaEntes(prev => prev.map(p => {
            if (p.enteId === enteId) {
                const yaEsta = p.productosIds.includes(productoId);
                return {
                    ...p,
                    productosIds: yaEsta 
                        ? p.productosIds.filter(id => id !== productoId)
                        : [...p.productosIds, productoId]
                };
            }
            return p;
        }));
    };

    // Las funciones addRubro, removeRubro y updateRubro han sido reemplazadas por toggleRubroPresencia y updateRubroValue

    const addEntrepreneur = () => setEntrepreneurs([...entrepreneurs, { nombre: '', actividad: '', telefono: '', datos_extras: {} }]);
    const removeEntrepreneur = (index: number) => setEntrepreneurs(entrepreneurs.filter((_, i) => i !== index));
    const updateEntrepreneur = (index: number, field: string, value: string) => {
        const newEnts = [...entrepreneurs];
        if (field === 'datos_extras_key') {
            // No se usa directamente
        } else if (field.startsWith('extra_')) {
            const key = field.replace('extra_', '');
            newEnts[index] = { ...newEnts[index], datos_extras: { ...newEnts[index].datos_extras, [key]: value } };
        } else {
            (newEnts[index] as any)[field] = value.toUpperCase();
        }
        setEntrepreneurs(newEnts);
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

    const handleGuiaSicaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setGuiaSicaFoto(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (estadoReporte: 'borrador' | 'enviado') => {
        if (estadoReporte === 'enviado') {
            if (!location) {
                alert('Es obligatorio tener coordenadas GPS para enviar.');
                return;
            }

            // Validación de campos obligatorios
            const isValidStr = (s: string | undefined | null) => s && s.trim().length > 0;
            const isValidNumber = (n: number | undefined | null) => n !== undefined && n !== null && n >= 0;
            
            const errors: Record<string, boolean> = {};

            if (!isValidStr(tipoActividad)) errors.tipoActividad = true;
            if (!isValidStr(empresa)) errors.empresa = true;
            if (!isValidStr(estadoGeo)) errors.estadoGeo = true;
            
            const isDPASpecial = estadoGeo.toUpperCase() === 'PETARE' || estadoGeo.toUpperCase() === 'DEPENDENCIAS FEDERALES';
            if (!isDPASpecial) {
                if (!isValidStr(municipio)) errors.municipio = true;
                if (!isValidStr(parroquia)) errors.parroquia = true;
            }

            if (!isValidStr(sector)) errors.sector = true;
            if (!isValidStr(nombreComuna)) errors.nombreComuna = true;
            
            if (!isValidNumber(comunas) || (comunas as any) === 0) errors.comunas = true;
            if (!isValidNumber(familias) || (familias as any) === 0 || !isValidNumber(personas) || (personas as any) === 0) errors.social_stats = true;

            if (!isValidStr(responsableActividad.nombre) || !isValidStr(responsableActividad.cedula)) errors.responsableActividad = true;
            if (!isValidStr(responsableComuna.nombre) || !isValidStr(responsableComuna.cedula)) errors.responsableComuna = true;

            const totalToneladasSum = (Number(totalProteina) || 0) + (Number(totalFrutas) || 0) + (Number(totalHortalizas) || 0) + (Number(totalVerduras) || 0) + (Number(totalSecos) || 0);
            if (totalToneladasSum <= 0) errors.toneladas = true;

            if (rubros.length === 0) errors.rubros = true;
            if (presenciaEntes.length === 0) errors.presenciaEntes = true;
            
            const hasCondition = Object.values(condiciones).some(v => v === true);
            if (!hasCondition) errors.condiciones = true;

            if (metodosPago.length === 0) errors.metodosPago = true;
            if (photos.length === 0) errors.photos = true;

            setValidationErrors(errors);
            const hasErrors = Object.keys(errors).length > 0;
                
            if (hasErrors) {
                alert('INFORMACIÓN INCOMPLETA: Se han resaltado en ROJO los campos obligatorios que faltan por completar (Excepto "Guía SICA"). Por favor, verifíquelos.');
                return;
            }

            if (!showConfirm) {
                setShowConfirm(true);
                return;
            }
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
                guia_sica_estado: guiaSicaEstado || null,
                guia_sica_foto: guiaSicaFoto || null,
                datos_formulario: {
                    responsables: { actividad: responsableActividad, comuna: responsableComuna },
                    condiciones,
                    presenciaEntes,
                    rating_rubros: ratingRubros,
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
                await supabase.from('report_minppal_presencia').delete().eq('report_id', reportIdToUse);
                await supabase.from('report_entrepreneurs').delete().eq('report_id', reportIdToUse);
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

            // Insertar Presencia MINPPAL Detallada
            if (presenciaEntes.length > 0) {
                // Filtrar solo los entes y productos que todavía existen en el catálogo actual para evitar errores de FK
                // (Esto puede pasar si el usuario tiene un borrador con IDs que fueron eliminados en la unificación)
                const activeEnteIds = new Set(catalogos.minppal.map(e => e.id));
                const activeProdIds = new Set(catalogos.productos_minppal.map(p => p.id));

                const presenciaData: any[] = [];
                presenciaEntes.forEach(ente => {
                    if (activeEnteIds.has(ente.enteId)) {
                        if (ente.productosIds.length > 0) {
                            ente.productosIds.forEach(prodId => {
                                if (activeProdIds.has(prodId)) {
                                    presenciaData.push({
                                        report_id: reportIdToUse,
                                        ente_id: ente.enteId,
                                        producto_id: prodId,
                                        presente: true
                                    });
                                }
                            });
                        } else {
                            // Si el ente está presente pero no se marcaron productos específicos
                            presenciaData.push({
                                report_id: reportIdToUse,
                                ente_id: ente.enteId,
                                producto_id: null,
                                presente: true
                            });
                        }
                    }
                });

                if (presenciaData.length > 0) {
                    const { error: presError } = await supabase.from('report_minppal_presencia').insert(presenciaData);
                    if (presError) throw presError;
                }
            }

            // Insertar Emprendedores
            if (entrepreneurs.length > 0) {
                const entsData = entrepreneurs.filter(e => e.nombre.trim() && e.actividad.trim()).map(e => ({
                    report_id: reportIdToUse,
                    nombre: e.nombre,
                    actividad: e.actividad,
                    telefono: e.telefono || null,
                    datos_extras: Object.keys(e.datos_extras || {}).length > 0 ? e.datos_extras : null
                }));
                if (entsData.length > 0) {
                    const { error: entsError } = await supabase.from('report_entrepreneurs').insert(entsData);
                    if (entsError) throw entsError;
                }
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
                    <h2 className="text-xl font-black text-black uppercase tracking-tighter">Sincronizando Catálogos</h2>
                    <p className="text-sm text-black font-medium">Preparando listas dinámicas de artículos y entes...</p>
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
                            <h3 className="text-xl font-black text-black uppercase tracking-tighter">¿Confirmar Envío?</h3>
                            <p className="text-sm text-black leading-relaxed font-medium">
                                Una vez enviado, el informe <span className="text-red-600 font-black">no podrá ser modificado</span>. ¿Está seguro de que todos los datos son correctos?
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-4 bg-white border border-slate-200 text-black font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
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
                    <button onClick={() => navigate('/app')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-black active:scale-95 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-black tracking-tight">Elaborar Reporte</h1>
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
                        <h2 className="text-lg font-black text-black uppercase tracking-tighter mb-6">Información General</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Tipo de Actividad</label>
                                <div className={`grid grid-cols-2 gap-3 p-1 rounded-[1.5rem] transition-all ${errorClass('tipoActividad')}`}>
                                    {catalogos.actividades.map(tipo => (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => {
                                                setTipoActividad(tipo);
                                                clearError('tipoActividad');
                                            }}
                                            className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest transition-all border-2 ${tipoActividad === tipo ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 border-transparent text-black'}`}
                                        >
                                            {tipo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Empresa / Ente Responsable</label>
                                <div className={`relative rounded-2xl transition-all ${errorClass('empresa')}`}>
                                    <select
                                        translate="no"
                                        value={empresa}
                                        onChange={(e) => {
                                            setEmpresa(e.target.value);
                                            clearError('empresa');
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all notranslate"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {catalogos.empresas.map(e => <option key={e} value={e} className="notranslate">{e}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={18} />
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
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Estado</label>
                                <div className={`relative rounded-2xl transition-all ${errorClass('estadoGeo')}`}>
                                    <select
                                        value={estadoGeo}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setEstadoGeo(val);
                                            clearError('estadoGeo');
                                            if (val.toUpperCase() === 'PETARE') {
                                                setMunicipio('');
                                                setParroquia('');
                                            } else {
                                                setMunicipio('');
                                                setParroquia('');
                                            }
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {(() => {
                                            const combined = Array.from(new Set([...dpaEstados, ...catalogos.estados])).sort();
                                            return combined.map(e => <option key={e} value={e}>{e}</option>);
                                        })()}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={18} />
                                </div>
                            </div>

                            {(estadoGeo.toUpperCase() !== 'PETARE' && estadoGeo.toUpperCase() !== 'DEPENDENCIAS FEDERALES') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Municipio</label>
                                        <div className={`relative rounded-2xl transition-all ${errorClass('municipio')}`}>
                                            <select
                                                value={municipio}
                                                onChange={(e) => {
                                                    setMunicipio(e.target.value);
                                                    setParroquia('');
                                                    clearError('municipio');
                                                }}
                                                disabled={!estadoGeo}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-black focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all disabled:opacity-50"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {dpaMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Parroquia</label>
                                        <div className={`relative rounded-2xl transition-all ${errorClass('parroquia')}`}>
                                            <select
                                                value={parroquia}
                                                onChange={(e) => {
                                                    setParroquia(e.target.value);
                                                    clearError('parroquia');
                                                }}
                                                disabled={!municipio}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-black focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all disabled:opacity-50"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {dpaParroquias.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Sector</label>
                                <input 
                                    type="text" 
                                    value={sector} 
                                    onChange={(e) => {
                                        setSector(e.target.value.toUpperCase());
                                        clearError('sector');
                                    }} 
                                    className={`w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all ${errorClass('sector')}`} 
                                    placeholder="Ej: Jose Félix Ribas" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Nombre de la Comuna Beneficiaria</label>
                                <input 
                                    type="text" 
                                    value={nombreComuna} 
                                    onChange={(e) => {
                                        setNombreComuna(e.target.value.toUpperCase());
                                        clearError('nombreComuna');
                                    }} 
                                    className={`w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all ${errorClass('nombreComuna')}`} 
                                    placeholder="Ej: Comuna Lanceros de la Patria" 
                                />
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
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit">Persona Responsable</p>
                                <div className={`space-y-4 p-4 rounded-[1.5rem] transition-all ${errorClass('responsableActividad')}`}>
                                    <input 
                                        type="text" 
                                        value={responsableActividad.nombre} 
                                        onChange={(e) => {
                                            setResponsableActividad({ ...responsableActividad, nombre: e.target.value.toUpperCase() });
                                            clearError('responsableActividad');
                                        }} 
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" 
                                        placeholder="Nombre Completo" 
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            type="text" 
                                            value={responsableActividad.cedula} 
                                            onChange={(e) => {
                                                setResponsableActividad({ ...responsableActividad, cedula: e.target.value });
                                                clearError('responsableActividad');
                                            }} 
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" 
                                            placeholder="Cédula" 
                                        />
                                        <input 
                                            type="text" 
                                            value={responsableActividad.telefono} 
                                            onChange={(e) => {
                                                setResponsableActividad({ ...responsableActividad, telefono: e.target.value });
                                                clearError('responsableActividad');
                                            }} 
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" 
                                            placeholder="Teléfono" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Responsable de Comuna */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">Poder Popular / Comuna</p>
                                <div className={`space-y-4 p-4 rounded-[1.5rem] transition-all ${errorClass('responsableComuna')}`}>
                                    <input 
                                        type="text" 
                                        value={responsableComuna.nombre} 
                                        onChange={(e) => {
                                            setResponsableComuna({ ...responsableComuna, nombre: e.target.value.toUpperCase() });
                                            clearError('responsableComuna');
                                        }} 
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" 
                                        placeholder="Nombre Completo" 
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input 
                                            type="text" 
                                            value={responsableComuna.cedula} 
                                            onChange={(e) => {
                                                setResponsableComuna({ ...responsableComuna, cedula: e.target.value });
                                                clearError('responsableComuna');
                                            }} 
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" 
                                            placeholder="Cédula" 
                                        />
                                        <input 
                                            type="text" 
                                            value={responsableComuna.telefono} 
                                            onChange={(e) => {
                                                setResponsableComuna({ ...responsableComuna, telefono: e.target.value });
                                                clearError('responsableComuna');
                                            }} 
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold" 
                                            placeholder="Teléfono" 
                                        />
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
                            <div className={`flex items-center gap-4 bg-slate-50 p-4 rounded-3xl group transition-all hover:bg-slate-100 ${errorClass('comunas')}`}>
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-black group-focus-within:text-blue-600 transition-colors">
                                    <Home size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Comunas / Consejos Comunales</label>
                                    <input 
                                        type="number" 
                                        value={comunas} 
                                        onChange={(e) => {
                                            setComunas(Number(e.target.value));
                                            clearError('comunas');
                                        }} 
                                        className="w-full bg-transparent border-none p-0 text-2xl font-black text-black focus:ring-0" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={`flex items-center gap-4 bg-slate-50 p-4 rounded-3xl transition-all ${errorClass('social_stats')}`}>
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-black">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest whitespace-nowrap">Familias</label>
                                        <input 
                                            type="number" 
                                            value={familias} 
                                            onChange={(e) => {
                                                setFamilias(Number(e.target.value));
                                                clearError('social_stats');
                                            }} 
                                            className="w-full bg-transparent border-none p-0 text-xl font-black text-black text-center focus:ring-0" 
                                        />
                                    </div>
                                    <div className="flex-1 text-right border-l border-slate-200">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest mr-4">Personas</label>
                                        <input 
                                            type="number" 
                                            value={personas} 
                                            onChange={(e) => {
                                                setPersonas(Number(e.target.value));
                                                clearError('social_stats');
                                            }} 
                                            className="w-full bg-transparent border-none p-0 text-xl font-black text-black text-right pr-4 focus:ring-0" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* NUEVA SECCIÓN: Participación de Emprendedores */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <UserPlus size={20} />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Emprendedores</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addEntrepreneur}
                                className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 transition-all font-black text-xs"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {entrepreneurs.map((ent, index) => (
                                <div key={index} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 relative group/ent">
                                    <button
                                        onClick={() => removeEntrepreneur(index)}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg flex items-center justify-center active:scale-90 opacity-0 group-hover/ent:opacity-100 transition-all border border-red-50"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">Nombre del Emprendedor</label>
                                        <input
                                            type="text"
                                            value={ent.nombre}
                                            onChange={(e) => updateEntrepreneur(index, 'nombre', e.target.value)}
                                            className="w-full bg-white border-none rounded-2xl p-4 text-xs font-bold text-black focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                                            placeholder="EJ: MARÍA PÉREZ"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">Tipo de Actividad</label>
                                            <div className="relative">
                                                <input
                                                    list={`ent-types-${index}`}
                                                    value={ent.actividad}
                                                    onChange={(e) => updateEntrepreneur(index, 'actividad', e.target.value)}
                                                    className="w-full bg-white border-none rounded-2xl p-4 text-xs font-bold text-black focus:ring-4 focus:ring-indigo-500/10 appearance-none transition-all uppercase"
                                                    placeholder="Seleccione o Escriba..."
                                                />
                                                <datalist id={`ent-types-${index}`}>
                                                    {catalogos.entrepreneurTypes.map(t => <option key={t} value={t} />)}
                                                </datalist>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">Teléfono Contacto</label>
                                            <input
                                                type="text"
                                                value={ent.telefono}
                                                onChange={(e) => updateEntrepreneur(index, 'telefono', e.target.value)}
                                                className="w-full bg-white border-none rounded-2xl p-4 text-xs font-bold text-black focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                placeholder="EJ: 0412-1234567"
                                            />
                                        </div>
                                    </div>

                                    {/* Campos Personalizados Dinámicos */}
                                    {customEntrepFields.length > 0 && (
                                        <div className="pt-2 border-t border-slate-100 space-y-4">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Datos Adicionales</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {customEntrepFields.map(field => (
                                                    <div key={field.id} className="space-y-2">
                                                        <label className="text-[9px] font-black text-black uppercase tracking-widest ml-1">
                                                            {field.etiqueta}
                                                            {field.requerido && <span className="text-red-400 ml-1">*</span>}
                                                        </label>
                                                        <input
                                                            type={field.tipo === 'email' ? 'email' : field.tipo === 'numero' ? 'number' : field.tipo === 'telefono' ? 'tel' : 'text'}
                                                            value={ent.datos_extras?.[field.nombre] || ''}
                                                            onChange={(e) => updateEntrepreneur(index, `extra_${field.nombre}`, e.target.value)}
                                                            required={field.requerido}
                                                            className="w-full bg-white border-none rounded-2xl p-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                                            placeholder={`EJ: ${field.tipo === 'email' ? 'correo@ejemplo.com' : field.tipo === 'telefono' ? '0412-0000000' : field.tipo === 'numero' ? '0' : field.etiqueta}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {entrepreneurs.length === 0 && (
                                <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <UserPlus size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest px-8 leading-relaxed">
                                        ¿Hay emprendedores locales participando? <br/> Pulsa el botón superior para registrarlos.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* NUEVA SECCIÓN: Distribución Consolidada (Grandes Totales) */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Package size={20} />
                            </div>
                            <h2 className="text-lg font-black text-black uppercase tracking-tighter">Distribución Consolidada (Toneladas)</h2>
                        </div>

                        <div className={`grid grid-cols-2 gap-4 p-4 rounded-[1.5rem] transition-all ${errorClass('toneladas')}`}>
                            {[
                                { label: 'Proteína', value: totalProteina, setter: setTotalProteina, color: 'blue' },
                                { label: 'Frutas', value: totalFrutas, setter: setTotalFrutas, color: 'amber' },
                                { label: 'Hortalizas', value: totalHortalizas, setter: setTotalHortalizas, color: 'emerald' },
                                { label: 'Verduras', value: totalVerduras, setter: setTotalVerduras, color: 'orange' },
                                { label: 'Secos', value: totalSecos, setter: setTotalSecos, color: 'slate' },
                            ].map((cat) => (
                                <div key={cat.label} className="bg-slate-50 p-4 rounded-3xl space-y-1">
                                    <label className="text-[9px] font-black text-black uppercase tracking-widest">{cat.label}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={cat.value}
                                            onChange={(e) => {
                                                cat.setter(Number(e.target.value));
                                                clearError('toneladas');
                                            }}
                                            className="w-full bg-transparent border-none p-0 text-lg font-black text-black focus:ring-0 font-mono"
                                            placeholder="0.00"
                                        />
                                        <span className="text-[10px] font-black text-black uppercase">TN</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* NUEVA SECCIÓN: Guía SICA (Opcional) */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-lg font-black text-black uppercase tracking-tighter">Guía SICA (Opcional)</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">¿Posee Guía SICA?</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Sí', 'No'].map(opcion => (
                                        <button
                                            key={opcion}
                                            type="button"
                                            onClick={() => {
                                                if (guiaSicaEstado === opcion) {
                                                    setGuiaSicaEstado('');
                                                    setGuiaSicaFoto('');
                                                } else {
                                                    setGuiaSicaEstado(opcion);
                                                }
                                            }}
                                            className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest transition-all border-2 ${guiaSicaEstado === opcion ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 border-transparent text-black'}`}
                                        >
                                            {opcion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {guiaSicaEstado === 'Sí' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Fotografía de la Guía SICA</label>
                                    {guiaSicaFoto ? (
                                        <div className="aspect-video rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm bg-slate-50">
                                            <img src={guiaSicaFoto} alt="Guía SICA" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setGuiaSicaFoto('')}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all font-bold backdrop-blur-sm hover:bg-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xs shadow-xl active:scale-95 transition-all cursor-pointer">
                                                <Camera size={24} />
                                                CÁMARA
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={handleGuiaSicaUpload}
                                                />
                                            </label>
                                            <label className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-100 text-black rounded-[2rem] font-bold text-xs active:scale-95 transition-all cursor-pointer border border-slate-200">
                                                <Package size={24} />
                                                GALERÍA
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleGuiaSicaUpload}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Sección 5: Rubros */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Package size={20} />
                                </div>
                                <h2 className="text-lg font-black text-black uppercase tracking-tighter">Rubros</h2>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-black uppercase tracking-widest mb-6 ml-13">Seleccione la presencia y precio de los productos</p>

                        <div className="space-y-6">
                            {/* Buscador de Rubros */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-black">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="BUSCAR PRODUCTO O RUBRO..."
                                    value={rubrosSearch}
                                    onChange={(e) => setRubrosSearch(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-blue-500 rounded-[1.5rem] py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest text-black placeholder:text-black/50 transition-all outline-none"
                                />
                                {rubrosSearch && (
                                    <button 
                                        onClick={() => setRubrosSearch('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-black"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Lista de Rubros (Filtrada) */}
                            <div className={`space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide p-2 rounded-[2rem] transition-all ${errorClass('rubros')}`}>
                                {filteredItems.map((item: any) => {
                                    const r = rubros.find(rub => rub.rubro === item.name);
                                    const isPresent = !!r;

                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`p-4 rounded-3xl border-2 transition-all duration-300 ${isPresent ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/50 border-transparent opacity-80'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        toggleRubroPresencia(item);
                                                        clearError('rubros');
                                                    }}
                                                    className={`h-12 w-20 flex items-center justify-center rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${isPresent ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-black border border-slate-200'}`}
                                                >
                                                    {isPresent ? 'SI' : 'NO'}
                                                </button>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-tight truncate ${isPresent ? 'text-blue-900' : 'text-black'}`}>
                                                        {item.name}
                                                    </p>
                                                    {item.presentacion && (
                                                        <p className="text-[8px] font-bold text-black uppercase tracking-widest truncate">
                                                            {item.presentacion}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {isPresent && (
                                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-blue-100 animate-in fade-in slide-in-from-top-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">Cantidad</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={r.cantidad}
                                                            onChange={(e) => updateRubroValue(item.name, 'cantidad', Number(e.target.value))}
                                                            className="w-full bg-white border-none rounded-xl p-3 text-sm font-black text-black focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">Precio (Bs.)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={r.precio}
                                                            onChange={(e) => updateRubroValue(item.name, 'precio', e.target.value)}
                                                            className="w-full bg-white border-none rounded-xl p-3 text-sm font-black text-black focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {filteredItems.length === 0 && (
                                    <div className="py-20 text-center text-black">
                                        <Package size={40} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No se encontraron rubros</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumen de Totales de la Sección */}
                        {rubros.length > 0 && (
                            <div className="mt-8 p-6 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 text-white flex justify-between items-center transition-all animate-in zoom-in-95">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Inversión Rubros</p>
                                    <p className="text-2xl font-black font-mono">
                                        Bs. {rubros.reduce((acc, item) => acc + (Number(item.cantidad) * (Number(item.precio) || 0)), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="text-right space-y-1 border-l border-white/20 pl-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Rubros Presentes</p>
                                    <p className="text-xl font-black font-mono">
                                        {rubros.length} <span className="text-[10px] uppercase">Tipo(s)</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Valoración por Estrellas (1-5) */}
                        <div className="space-y-4 pt-6 border-t border-slate-100 mt-6">
                            <div className="flex flex-col items-center gap-4 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
                                <label className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-2">Valoración de los Rubros</label>
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRatingRubros(star)}
                                            className={`p-3 rounded-2xl transition-all duration-300 transform active:scale-90 ${ratingRubros >= star ? 'text-amber-500 bg-amber-50 scale-110 shadow-lg shadow-amber-200/50' : 'text-black hover:text-black'}`}
                                        >
                                            <Star size={32} fill={ratingRubros >= star ? "currentColor" : "none"} strokeWidth={ratingRubros >= star ? 2.5 : 2} />
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 text-[10px] font-black uppercase tracking-widest transition-all duration-500 h-4">
                                    {ratingRubros === 1 && <span className="text-red-500">Deficiente (1/5)</span>}
                                    {ratingRubros === 2 && <span className="text-orange-500">Regular (2/5)</span>}
                                    {ratingRubros === 3 && <span className="text-amber-600">Aceptable (3/5)</span>}
                                    {ratingRubros === 4 && <span className="text-emerald-500">Muy Bueno (4/5)</span>}
                                    {ratingRubros === 5 && <span className="text-emerald-600 animate-bounce">Excelente (5/5)</span>}
                                    {ratingRubros === 0 && <span className="text-black">Seleccione una calificación</span>}
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* SECCIÓN: Presencia productos MINPPAL */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <h2 className="text-lg font-black text-black uppercase tracking-tighter">Presencia productos MINPPAL</h2>
                        </div>
                        <p className="text-[9px] font-black text-black uppercase tracking-widest mb-8 ml-13">Vincule los entes presentes y sus respectivos productos</p>
 
                        <div className={`space-y-4 p-4 rounded-[1.5rem] transition-all ${errorClass('presenciaEntes')}`}>
                            {catalogos.minppal.map((ente) => {
                                const enteSeleccionado = presenciaEntes.find(p => p.enteId === ente.id);
                                const productosDelEnte = catalogos.productos_minppal.filter(p => {
                                    if (p.parent_id === ente.id || p.empresa_id === ente.id) return true;
                                    if (ente.type === 'ENTE' && p.type === 'RUBRO' && (!p.parent_id || p.parent_id === null)) return true;
                                    return false;
                                });

                                return (
                                    <div key={ente.id} className={`rounded-[2rem] border-2 transition-all overflow-hidden ${enteSeleccionado ? 'border-blue-100 bg-white' : 'border-slate-50 bg-slate-50/50'}`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                toggleEnte(ente.id);
                                                clearError('presenciaEntes');
                                            }}
                                            className={`w-full flex items-center gap-4 p-5 transition-all ${enteSeleccionado ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${enteSeleccionado ? 'bg-blue-600 text-white' : 'bg-white text-black border border-slate-100'}`}>
                                                <CheckCircle2 size={16} strokeWidth={3} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className={`text-[11px] font-black uppercase tracking-tight ${enteSeleccionado ? 'text-blue-900' : 'text-black'}`}>
                                                    {ente.name}
                                                </span>
                                            </div>
                                            {enteSeleccionado && productosDelEnte.length > 0 && (
                                                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                                    {enteSeleccionado.productosIds.length} / {productosDelEnte.length} Prod.
                                                </div>
                                            )}
                                        </button>

                                        {enteSeleccionado && productosDelEnte.length > 0 && (
                                            <div className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="col-span-full h-px bg-blue-100/50 mb-2"></div>
                                                {productosDelEnte.map(prod => (
                                                    <button
                                                        key={prod.id}
                                                        type="button"
                                                        onClick={() => toggleProductoEnte(ente.id, prod.id)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${enteSeleccionado.productosIds.includes(prod.id) ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-black opacity-60'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center ${enteSeleccionado.productosIds.includes(prod.id) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-transparent'}`}>
                                                            <Plus size={10} strokeWidth={4} />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">{prod.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {enteSeleccionado && productosDelEnte.length === 0 && (
                                            <div className="px-14 pb-5">
                                                <p className="text-[9px] font-bold text-black italic uppercase">Sin productos vinculados en el catálogo</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {catalogos.minppal.length === 0 && (
                                <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest">No hay empresas MINPPAL registradas</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Sección 6: Condiciones del Punto */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <h2 className="text-lg font-black text-black uppercase tracking-tighter">Condiciones del Punto</h2>
                        </div>

                        <div className={`grid grid-cols-1 gap-3 p-4 rounded-[1.5rem] transition-all ${errorClass('condiciones')}`}>
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
                                    onClick={() => {
                                        setCondiciones({ ...condiciones, [cond.id]: !condiciones[cond.id as keyof typeof condiciones] });
                                        clearError('condiciones');
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${condiciones[cond.id as keyof typeof condiciones] ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-transparent text-black'}`}
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
                        <h2 className="text-lg font-black text-black uppercase tracking-tighter mb-6">Métodos de Pago</h2>
                        <div className={`grid grid-cols-2 gap-3 p-4 rounded-[1.5rem] transition-all ${errorClass('metodosPago')}`}>
                            {METODOS_PAGO.map(metodo => (
                                <button
                                    key={metodo}
                                    type="button"
                                    onClick={() => {
                                        toggleMetodoPago(metodo);
                                        clearError('metodosPago');
                                    }}
                                    className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest transition-all border-2 ${metodosPago.includes(metodo) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 border-transparent text-black'}`}
                                >
                                    {metodo}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Sección 8: Fotos */}
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-black">
                                <Camera size={20} />
                            </div>
                            <h2 className="text-lg font-black text-black uppercase tracking-tighter">Evidencias Fotográficas</h2>
                        </div>

                        <div className={`grid grid-cols-3 gap-3 mb-8 p-4 rounded-[1.5rem] transition-all ${errorClass('photos')}`}>
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
                                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-black">
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
                            <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-100 text-black rounded-[2rem] font-bold text-xs active:scale-95 transition-all cursor-pointer border border-slate-200">
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
                        <p className="text-[9px] font-bold text-black uppercase tracking-widest mt-6 opacity-60 text-center">
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
