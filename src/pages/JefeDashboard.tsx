import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, Users, LogOut, Search,
    TrendingUp, Package,
    Activity, RefreshCw, Home,
    ChevronDown, Award, Building2, Eraser, MessageSquare, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import * as XLSX from 'xlsx';
import { FileDown } from 'lucide-react';

// Fix for Leaflet default icon issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

const ACTIVITY_COLORS: Record<string, string> = {
    'FCS': '#EF4444',             // Rojo
    'FCS - Emblemática': '#10B981', // Verde
    'Bodega móvil': '#007AFF',     // Azul
    'Cielo Abierto': '#6366F1'     // Indigo
};

const getMarkerIcon = (type: string) => {
    const color = ACTIVITY_COLORS[type] || '#64748b'; // Slate por defecto
    return createCustomIcon(color);
};

interface Report {
    id: string;
    fecha: string;
    tipo_actividad: string;
    empresa: string;
    estado_geografico: string;
    municipio: string;
    parroquia: string;
    personas: number;
    familias: number;
    comunas: number;
    total_proteina: number;
    total_frutas: number;
    total_hortalizas: number;
    total_verduras: number;
    total_secos: number;
    latitud: number;
    longitud: number;
    datos_formulario: any;
    estado_reporte: string;
    inspector_id?: string;
    profiles?: {
        nombre: string;
        apellido: string;
    } | null;
}

interface ReportItem {
    report_id: string;
    rubro: string;
    cantidad: number;
    _alreadyCounted?: boolean;
}

interface PaymentMethod {
    report_id: string;
    metodo: string;
}

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
    const [reports, setReports] = useState<Report[]>([]);
    const [reportItems, setReportItems] = useState<ReportItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [inspectors, setInspectors] = useState<Record<string, { nombre: string; apellido: string }>>({});

    // Filtros
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterTipo, setFilterTipo] = useState('Todos');
    const [filterEnte, setFilterEnte] = useState('Todos');
    const [filterRubro, setFilterRubro] = useState('Todos');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Listas para selectores
    const [catalogos, setCatalogos] = useState({
        estados: [] as string[],
        entes: [] as string[],
        articulos: [] as string[],
        actividades: [] as string[],
        minppal: [] as string[]
    });
    const [debug, setDebug] = useState<string>('Iniciando...');

    // Solo ejecutar fetchData cuando el auth ya esté resuelto y tengamos sesión
    useEffect(() => {
        if (!authLoading && session?.access_token) {
            fetchData(session.access_token);
        }
    }, [authLoading, session?.access_token]);

    const fetchData = async (accessToken?: string) => {
        try {
            setLoading(true);
            setDebug('Iniciando carga...');
            console.log("fetchData started");

            // Usar el token del AuthContext (ya resuelto) o pedir uno nuevo como fallback
            let token = accessToken;
            if (!token) {
                const { data: sessionData } = await supabase.auth.getSession();
                token = sessionData?.session?.access_token;
            }
            console.log("Token:", token ? 'OK' : 'Sin token');

            if (!token) {
                setDebug('Error: No hay sesión activa. Inicie sesión de nuevo.');
                setLoading(false);
                return;
            }

            // Usar fetch nativo para evitar el queueing interno del SDK


            // 1. Cargar Reportes (Principal) pero limitando severamente la descarga de Megabytes
            setDebug('Descargando Reportes...');

            // Reconstruimos el JSON de datos_formulario solo con lo útil (sin fotos, base64, que causan timeout)
            const { data: rawReports, error: reportsError } = await supabase
                .from('reports')
                .select(`
                    id, fecha, tipo_actividad, empresa, estado_geografico, municipio, 
                    parroquia, personas, familias, comunas, total_proteina, total_frutas, 
                    total_hortalizas, total_verduras, total_secos, latitud, longitud, 
                    estado_reporte, inspector_id, 
                    condiciones:datos_formulario->condiciones, 
                    presenciaMinppal:datos_formulario->presenciaMinppal,
                    obs_main:datos_formulario->>observaciones_rubros,
                    obs_alt1:datos_formulario->>comentarios,
                    obs_alt2:datos_formulario->>observaciones
                `)
                .eq('estado_reporte', 'enviado')
                .order('fecha', { ascending: false })
                .limit(500);

            if (reportsError) {
                console.error("DEBUG: Error cargando reportes:", reportsError);
                setDebug(`Error SDK (Reportes): ${reportsError.message}`);
                throw reportsError;
            }

            // Re-estructuramos el objeto para encajar con la interfaz \`Report\` del Dashboard sin romper código
            const reportsData = (rawReports || []).map((r: any) => ({
                ...r,
                datos_formulario: {
                    condiciones: r.condiciones,
                    presenciaMinppal: r.presenciaMinppal,
                    observaciones_rubros: (r.obs_main || r.obs_alt1 || r.obs_alt2 || '').trim()
                }
            }));

            console.log("DEBUG: Reportes recibidos:", reportsData?.length);
            setReports(reportsData);

            // 2. Cargar Catálogos usando el SDK
            setDebug('Cargando catálogos...');
            const { data: catalogData, error: catalogError } = await supabase
                .from('catalog_items')
                .select('type,name')
                .eq('is_active', true);

            if (catalogError) {
                console.error("DEBUG: Error cargando catálogos:", catalogError);
            }

            console.log("DEBUG: Catálogos recibidos:", catalogData?.length);

            if (catalogData && !catalogError) {
                const normalize = (items: any[], type: string) =>
                    Array.from(new Set(items.filter(i => i.type === type).map(i => i.name.trim().toUpperCase()))).sort() as string[];

                setCatalogos({
                    estados: normalize(catalogData, 'ESTADO'),
                    entes: normalize(catalogData, 'ENTE'),
                    articulos: normalize(catalogData, 'ARTICULO'),
                    actividades: normalize(catalogData, 'ACTIVIDAD'),
                    minppal: normalize(catalogData, 'MINPPAL')
                });
            } else if (catalogError) {
                console.warn('Error cargando catálogos:', catalogError.message);
            }

            setDebug(`OK: ${reportsData?.length || 0} reportes, ${catalogData?.length || 0} catálogos`);

            // 3. Cargar datos secundarios
            if (reportsData && reportsData.length > 0) {
                const reportIds = reportsData.map((r: any) => r.id);


                // 3. Cargar datos secundarios usando el SDK (Aumentado para cubrir todos los reportes cargados)
                console.log('Fetching secondary data...');
                const [itemsRes, paymentRes] = await Promise.all([
                    supabase.from('report_items').select('report_id,rubro,cantidad').in('report_id', reportIds),
                    supabase.from('report_payment_methods').select('report_id,metodo').in('report_id', reportIds)
                ]);

                if (itemsRes.data) setReportItems(itemsRes.data);
                if (paymentRes.data) setPaymentMethods(paymentRes.data);

                // Perfiles
                const inspectorIds = Array.from(new Set(reportsData.map((r: any) => r.inspector_id).filter((id: any) => id)));
                if (inspectorIds.length > 0) {
                    const { data: profData } = await supabase
                        .from('profiles')
                        .select('id,nombre,apellido')
                        .in('id', inspectorIds);

                    if (profData) {
                        const map: Record<string, { nombre: string; apellido: string }> = {};
                        profData.forEach((p: any) => map[p.id] = { nombre: p.nombre, apellido: p.apellido });
                        setInspectors(map);
                    }
                }
                console.log('All secondary data fetched');
            }
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setDebug(`Error general: ${error.message || 'Desconocido'} `);
        } finally {
            setLoading(false);
            console.log('fetchData completed.');
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterEstado('Todos');
        setFilterTipo('Todos');
        setFilterEnte('Todos');
        setFilterRubro('Todos');
        setStartDate('');
        setEndDate('');
    };

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const cleanSearch = searchTerm.trim().toLowerCase();
            const matchesSearch = !cleanSearch ||
                (r.parroquia || '').toLowerCase().includes(cleanSearch) ||
                (r.municipio || '').toLowerCase().includes(cleanSearch);

            const matchesEstado = filterEstado === 'Todos' ||
                (r.estado_geografico || '').trim().toUpperCase() === filterEstado.trim().toUpperCase();

            const matchesTipo = filterTipo === 'Todos' ||
                (r.tipo_actividad || '').trim().toUpperCase() === filterTipo.trim().toUpperCase();

            const matchesEnte = filterEnte === 'Todos' ||
                (r.empresa || '').trim().toUpperCase() === filterEnte.trim().toUpperCase();

            let matchesRubro = true;
            if (filterRubro !== 'Todos') {
                const targetRubro = filterRubro.trim().toUpperCase();
                matchesRubro = reportItems.some(item =>
                    item.report_id === r.id && (item.rubro || '').trim().toUpperCase() === targetRubro
                );
            }

            const reportDate = new Date(r.fecha);
            reportDate.setHours(0, 0, 0, 0);
            let matchesDate = true;
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (reportDate < start) matchesDate = false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(0, 0, 0, 0);
                if (reportDate > end) matchesDate = false;
            }
            return matchesSearch && matchesEstado && matchesTipo && matchesEnte && matchesRubro && matchesDate;
        });
    }, [reports, searchTerm, filterEstado, filterTipo, filterEnte, filterRubro, startDate, endDate, reportItems]);

    const filteredReportIds = useMemo(() => new Set(filteredReports.map(r => r.id)), [filteredReports]);

    const foodDistribution = useMemo(() => {
        const categories = {
            'Proteínas': 0,
            'Frutas': 0,
            'Hortalizas': 0,
            'Verduras': 0,
            'Secos': 0
        };

        filteredReports.forEach(r => {
            categories['Proteínas'] += Number(r.total_proteina) || 0;
            categories['Frutas'] += Number(r.total_frutas) || 0;
            categories['Hortalizas'] += Number(r.total_hortalizas) || 0;
            categories['Verduras'] += Number(r.total_verduras) || 0;
            categories['Secos'] += Number(r.total_secos) || 0;
        });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .filter(i => i.value > 0);
    }, [filteredReports]);

    const paymentData = useMemo(() => {
        const counts: Record<string, number> = {};
        paymentMethods.forEach(p => {
            if (filteredReportIds.has(p.report_id)) {
                const label = (p.metodo || '').replace(/\[.*\]/, '').trim().toUpperCase();
                if (label) {
                    counts[label] = (counts[label] || 0) + 1;
                }
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [paymentMethods, filteredReportIds]);

    const timelineData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const d = new Date(r.fecha);
            const label = d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
            counts[label] = (counts[label] || 0) + 1;
        });

        // Ordenar por fecha real
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => {
                return a.date.localeCompare(b.date); // Fallback simple
            });
    }, [filteredReports]);

    const stateData = useMemo(() => {
        const entries: Record<string, { value: number, personas: number, comunas: number, total_distribuido: number }> = {};

        // Inicializar todos los estados conocidos con cero
        catalogos.estados.forEach(estado => {
            const label = estado.trim().toUpperCase();
            entries[label] = { value: 0, personas: 0, comunas: 0, total_distribuido: 0 };
        });

        // Contar y sumar las actividades filtradas
        filteredReports.forEach(r => {
            const label = (r.estado_geografico || 'DESCONOCIDO').trim().toUpperCase();
            if (!entries[label]) {
                entries[label] = { value: 0, personas: 0, comunas: 0, total_distribuido: 0 };
            }
            entries[label].value += 1;
            entries[label].personas += Number(r.personas) || 0;
            entries[label].comunas += Number(r.comunas) || 0;

            const totalDist = (Number(r.total_proteina) || 0) +
                (Number(r.total_frutas) || 0) +
                (Number(r.total_hortalizas) || 0) +
                (Number(r.total_verduras) || 0) +
                (Number(r.total_secos) || 0);
            entries[label].total_distribuido += totalDist;
        });

        return Object.entries(entries)
            .map(([name, stats]) => ({
                name,
                value: stats.value,
                personas: stats.personas,
                comunas: stats.comunas,
                total_distribuido: stats.total_distribuido
            }))
            .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
    }, [filteredReports, catalogos.estados]);

    const activityTypeData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const label = (r.tipo_actividad || 'OTRO').trim().toUpperCase();
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredReports]);


    const rubroPresenceData = useMemo(() => {
        const RUBROS_LIST = catalogos.articulos.length > 0 ? catalogos.articulos : [
            "Aceite uso doméstico", "Arroz blanco", "Arvejas", "Atún enlatado", "Avena en hojuelas",
            "Azúcar", "Café", "Caraotas blancas", "Caraotas rojas", "Carne de cerdo", "Carne de res",
            "Cartón de huevos", "Frijol", "Harina de maíz amarillo", "Harina de maíz blanco",
            "Harina de trigo", "Jabón en polvo", "Leche en polvo", "Leche líquida UHT", "Lentejas",
            "Margarina", "Mayonesa", "Mortadela", "Pasta corta", "Pasta larga", "Pescados variados",
            "Pollo", "Queso", "Sal", "Salsa de tomate", "Sardina enlatada", "Sardina fresca"
        ];

        const counts: Record<string, number> = {};
        RUBROS_LIST.forEach(r => counts[r.toLowerCase()] = 0);

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id)) {
                const rubroKey = item.rubro?.toLowerCase();
                if (counts.hasOwnProperty(rubroKey)) {
                    counts[rubroKey]++;
                }
            }
        });

        return RUBROS_LIST.map(name => ({
            name,
            value: counts[name.toLowerCase()] || 0,
            total: filteredReports.length
        }));
    }, [reportItems, filteredReportIds, catalogos.articulos, filteredReports.length]);

    const rubroVolumeData = useMemo(() => {
        const RUBROS_LIST = catalogos.articulos.length > 0 ? catalogos.articulos : [
            "Aceite uso doméstico", "Arroz blanco", "Arvejas", "Atún enlatado", "Avena en hojuelas",
            "Azúcar", "Café", "Caraotas blancas", "Caraotas rojas", "Carne de cerdo", "Carne de res",
            "Cartón de huevos", "Frijol", "Harina de maíz amarillo", "Harina de maíz blanco",
            "Harina de trigo", "Jabón en polvo", "Leche en polvo", "Leche líquida UHT", "Lentejas",
            "Margarina", "Mayonesa", "Mortadela", "Pasta corta", "Pasta larga", "Pescados variados",
            "Pollo", "Queso", "Sal", "Salsa de tomate", "Sardina enlatada", "Sardina fresca"
        ];

        const sums: Record<string, number> = {};
        RUBROS_LIST.forEach(r => sums[r.toLowerCase()] = 0);

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id)) {
                const rubroKey = item.rubro?.toLowerCase();
                if (sums.hasOwnProperty(rubroKey)) {
                    sums[rubroKey] += Number(item.cantidad) || 0;
                }
            }
        });

        return RUBROS_LIST.map(name => ({
            name,
            value: sums[name.toLowerCase()] || 0
        }));
    }, [reportItems, filteredReportIds, catalogos.articulos]);


    const inspectorReportData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            let name = 'DESCONOCIDO';
            if (r.inspector_id && inspectors[r.inspector_id]) {
                const p = inspectors[r.inspector_id];
                name = `${p.nombre} ${p.apellido} `;
            } else if (r.profiles) {
                name = `${r.profiles.nombre} ${r.profiles.apellido} `;
            }
            const normalizedName = name.trim().toUpperCase();
            counts[normalizedName] = (counts[normalizedName] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredReports, inspectors]);

    const enteReportData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const ente = (r.empresa || 'DESCONOCIDO').trim().toUpperCase();
            counts[ente] = (counts[ente] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredReports]);

    const qualitySummary = useMemo(() => {
        const standards = [
            'bodegaLimpia', 'entornoLimpio', 'personalSuficiente',
            'comunidadNotificada', 'presenciaProteina',
            'presenciaHortalizas', 'presenciaFrutas'
        ];
        const totalReports = filteredReports.length || 1;
        let totalPercentageSum = 0;
        standards.forEach(key => {
            const count = filteredReports.filter(r => r.datos_formulario?.condiciones?.[key]).length;
            totalPercentageSum += (count / totalReports) * 100;
        });
        return Math.round(totalPercentageSum / standards.length);
    }, [filteredReports]);

    const minppalPresenceSummary = useMemo(() => {
        const totalReports = filteredReports.length || 1;
        const count = filteredReports.filter(r => {
            const minppal = r.datos_formulario?.presenciaMinppal;
            if (!minppal) return false;
            if (Array.isArray(minppal)) return minppal.length > 0;
            return Object.values(minppal).some(v => v === true);
        }).length;
        return Math.round((count / totalReports) * 100);
    }, [filteredReports]);

    const MINPPAL_EMPRESAS_FALLBACK = [
        { id: 'lacteosLosAndes', label: 'LÁCTEOS LOS ANDES' },
        { id: 'indugram', label: 'INDUGRAM' },
        { id: 'diana', label: 'DIANA' },
        { id: 'salbiven', label: 'SALBIVEN' },
        { id: 'argeliaLaya', label: 'ARGELIA LAYA' },
        { id: 'redNutrivida', label: 'RED NUTRIVIDA' },
        { id: 'nutricacao', label: 'NUTRICACAO' },
        { id: 'nutrimanoco', label: 'NUTRIMAÑOCO' }
    ];

    const minppalDetailData = useMemo(() => {
        const totalReports = filteredReports.length || 1;

        const empresasArray = catalogos.minppal.length > 0
            ? catalogos.minppal
            : MINPPAL_EMPRESAS_FALLBACK.map(e => e.label);

        return empresasArray.map(empresaName => {
            const count = filteredReports.filter(r => {
                const minppal = r.datos_formulario?.presenciaMinppal;
                if (!minppal) return false;

                if (Array.isArray(minppal)) {
                    return minppal.includes(empresaName);
                }

                // Formato viejo (objeto de booleanos)
                const fallbackObj = MINPPAL_EMPRESAS_FALLBACK.find(e => e.label.toUpperCase() === empresaName.toUpperCase());
                if (fallbackObj && minppal[fallbackObj.id] === true) return true;

                return false;
            }).length;

            return {
                name: empresaName,
                count,
                pct: Math.round((count / totalReports) * 100)
            };
        }).sort((a, b) => b.count - a.count);
    }, [filteredReports, catalogos.minppal]);

    const exportToExcel = () => {
        // Preparar los datos para Excel
        const dataToExport = filteredReports.map(report => {
            return {
                'ID': report.id,
                'FECHA': new Date(report.fecha).toLocaleDateString('es-VE'),
                'TIPO ACTIVIDAD': report.tipo_actividad,
                'ENTE RESPONSABLE': report.empresa,
                'ESTADO': report.estado_geografico,
                'MUNICIPIO': report.municipio,
                'PARROQUIA': report.parroquia,
                'PERSONAS': report.personas,
                'FAMILIAS': report.familias,
                'COMUNAS': report.comunas,
                'PROTEÍNA (TON)': report.total_proteina,
                'FRUTAS (TON)': report.total_frutas,
                'HORTALIZAS (TON)': report.total_hortalizas,
                'VERDURAS (TON)': report.total_verduras,
                'SECOS (TON)': report.total_secos,
                'ESTADO REPORTE': report.estado_reporte
            };
        });

        // Crear el libro y la hoja
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes Filtrados");

        // Generar nombre de archivo dinámico
        const fileName = `Reporte_FCS_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Descargar el archivo
        XLSX.writeFile(workbook, fileName);
    };

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
                    <button
                        onClick={exportToExcel}
                        disabled={filteredReports.length === 0}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
                        title="Exportar a Excel"
                    >
                        <FileDown size={18} /> Excel
                    </button>
                    <button onClick={() => fetchData(session?.access_token)} className="flex-1 md:flex-none p-3 bg-slate-100 text-slate-600 hover:text-[#007AFF] hover:bg-blue-50 rounded-2xl transition-all border border-slate-200 flex justify-center">
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

                {/* KPIs Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {[
                        { label: 'Jornadas Ejecutadas', value: filteredReports.length, icon: <Activity size={20} />, color: 'text-[#007AFF]', bg: 'bg-blue-50' },
                        { label: 'Presencia MINPPAL', value: `${minppalPresenceSummary}% `, icon: <Award size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Familias Beneficiadas', value: filteredReports.reduce((acc, r) => acc + (r.familias || 0), 0).toLocaleString(), icon: <Home size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Habitantes Atendidos', value: filteredReports.reduce((acc, r) => acc + (r.personas || 0), 0).toLocaleString(), icon: <Users size={20} />, color: 'text-sky-600', bg: 'bg-sky-50' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-[#007AFF]/20 transition-all">
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">{kpi.label}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value.toString()}</p>
                            </div>
                            <div className={`w - 14 h - 14 ${kpi.bg} ${kpi.color} rounded - 2xl flex items - center justify - center shadow - inner`}>{kpi.icon}</div>
                        </div>
                    ))}
                </div>

                {/* ── PANEL MINPPAL ─────────────────────────────────── */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {/* Cabecera */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 pt-8 pb-6 border-b border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Presencia de Empresas MINPPAL</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Por jornadas con registro positivo</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl">
                            <span className="text-2xl font-black text-amber-600">{minppalPresenceSummary}%</span>
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-tight">Cobertura<br />Global</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
                        {/* Izquierda: tarjetas por empresa */}
                        <div className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                            {minppalDetailData.map((emp) => (
                                <div
                                    key={emp.name}
                                    className={`p-5 rounded-3xl border-2 flex flex-col gap-2 transition-all ${emp.count > 0
                                        ? 'bg-amber-50 border-amber-100'
                                        : 'bg-slate-50 border-slate-100'
                                        }`}
                                >
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{emp.name}</p>
                                    <p className={`text-2xl font-black tracking-tighter leading-none ${emp.count > 0 ? 'text-amber-600' : 'text-slate-300'
                                        }`}>{emp.pct}%</p>
                                    <p className="text-[9px] font-bold text-slate-400">{emp.count} jornada{emp.count !== 1 ? 's' : ''}</p>
                                    {/* Mini barra */}
                                    <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${emp.count > 0 ? 'bg-amber-400' : 'bg-slate-200'
                                                }`}
                                            style={{ width: `${emp.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Derecha: gráfica de barras horizontal */}
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Comparativo de Presencia (Jornadas)</p>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={minppalDetailData} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.08} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={140}
                                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                                            formatter={(value: any, _name: any, props: any) => [
                                                `${value} jornadas(${props.payload.pct} %)`,
                                                'Presencia'
                                            ]}
                                        />
                                        <Bar dataKey="count" fill="url(#colorAmber)" radius={[0, 8, 8, 0]} barSize={14}>
                                            <defs>
                                                <linearGradient id="colorAmber" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
                                                </linearGradient>
                                            </defs>
                                            <LabelList
                                                dataKey="pct"
                                                position="right"
                                                formatter={(v: any) => `${v}% `}
                                                style={{ fontSize: 9, fontWeight: 900, fill: '#92400e' }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ── FIN PANEL MINPPAL ─────────────────────────────── */}

                {/* ── MAPA OPERATIVO — Ancho Completo ──────────────────────────── */}
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 relative h-[500px] md:h-[620px] overflow-hidden">
                    <div className="absolute top-6 left-6 z-[1001] bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-xl">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#007AFF]">Mapa Operativo</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ubicación de Jornadas Activas</p>
                        <p className="text-[10px] font-black text-slate-600 mt-2">
                            <span className="text-[#007AFF]">{filteredReports.filter(r => r.latitud && r.longitud).length}</span> puntos georeferenciados
                        </p>
                    </div>

                    {/* Leyenda del Mapa */}
                    <div className="absolute bottom-6 left-6 z-[1001] bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-xl flex flex-col gap-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-50 pb-2">Leyenda de Actividades</p>
                        {Object.entries(ACTIVITY_COLORS).map(([type, color]) => (
                            <div key={type} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }}></div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{type}</span>
                            </div>
                        ))}
                    </div>

                    <div className="h-full w-full rounded-[3rem] overflow-hidden">
                        <MapContainer center={[7.0, -66.0] as L.LatLngExpression} zoom={6} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                            />
                            {/* Capa de etiquetas y fronteras de estados */}
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            />
                            {filteredReports.filter(r => r.latitud && r.longitud).map(report => (
                                <Marker
                                    key={report.id}
                                    position={[report.latitud, report.longitud]}
                                    icon={getMarkerIcon(report.tipo_actividad)}
                                >
                                    <Popup>
                                        <div className="p-3 font-sans min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                                                    style={{ backgroundColor: ACTIVITY_COLORS[report.tipo_actividad] || '#64748b' }}
                                                ></div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{report.tipo_actividad}</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 uppercase leading-tight">{report.parroquia}</p>

                                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                                    <span>Estado:</span>
                                                    <span className="text-blue-600 font-black">{report.estado_geografico}</span>
                                                </p>
                                                {report.comunas && (
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                                        <span>Comuna:</span>
                                                        <span className="text-slate-900 font-black">{report.comunas}</span>
                                                    </p>
                                                )}
                                                <p className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                                    <span>Municipio:</span>
                                                    <span className="text-slate-900">{report.municipio}</span>
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                                    <span>Familias:</span>
                                                    <span className="text-slate-900">{report.familias}</span>
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                                    <span>Personas:</span>
                                                    <span className="text-slate-900 font-black">{report.personas}</span>
                                                </p>

                                                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Total Distribuido:</span>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                                                        {(
                                                            (Number(report.total_proteina) || 0) +
                                                            (Number(report.total_frutas) || 0) +
                                                            (Number(report.total_hortalizas) || 0) +
                                                            (Number(report.total_verduras) || 0) +
                                                            (Number(report.total_secos) || 0)
                                                        ).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TN
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
                {/* ── FIN MAPA ─────────────────────────────────────────────────── */}


                {/* Grid Analítico Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                    {/* Columna Izquierda (8) - Reportes Dinámicos */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Fila 1: Histórico de Jornadas (Full Width) */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
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

                        {/* Fila 2: Tipos de Actividad y Cobranza (50% cada uno) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
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

                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-8">Cobranza Consolidada</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={paymentData} layout="vertical" margin={{ left: -10, right: 30 }}>
                                            <defs>
                                                <linearGradient id="colorIndigo" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.6} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                            <Bar dataKey="value" fill="url(#colorIndigo)" radius={[0, 10, 10, 0]} barSize={18}>
                                                <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 900, fill: '#4F46E5' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Actividades por Estado - Gran Formato con Tooltip Enriquecido */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center shadow-inner"><Package size={22} /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Actividades por Estado (Detalle Nacional)</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analítica de despliegue territorial</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[800px]">
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


                        {/* Productividad de Inspectores (Full width in Col-8 bottom) */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20"><Users size={20} /></div>
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Productividad de Inspectores</h3>
                            </div>
                            <div className="h-[600px]">
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

                    {/* Columna Derecha (4) - KPIs de Soporte */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Despliegue Ente MINPPAL */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-inner"><Building2 size={20} /></div>
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Despliegue Ente MINPPAL</h3>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={enteReportData} layout="vertical" margin={{ left: -10, right: 40, top: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAmber2" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#D97706" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#fff' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                                        <Bar dataKey="value" fill="url(#colorAmber2)" radius={[0, 10, 10, 0]} barSize={16}>
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 10, fontWeight: 900, fill: '#D97706' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribución de Alimentos */}
                        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
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
                                            {foodDistribution.map((_, index) => <Cell key={`cell - ${index} `} fill={MONO_BLUE[index % MONO_BLUE.length]} />)}
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

                        {/* Auditoría de Calidad */}
                        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-[11px] font-black uppercase text-[#007AFF] tracking-[0.25em] mb-1">Auditoría</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Estándares</p>
                                </div>
                                <div className="bg-blue-50 px-4 py-2 rounded-2xl">
                                    <span className="text-2xl font-black text-[#007AFF] tracking-tighter">{qualitySummary}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Higiene', key: 'bodegaLimpia', icon: <Package size={16} />, color: '#3B82F6' },
                                    { label: 'Entorno', key: 'entornoLimpio', icon: <Activity size={16} />, color: '#10B981' },
                                    { label: 'Comunidad', key: 'comunidadNotificada', icon: <Users size={16} />, color: '#6366F1' },
                                    { label: 'Proteína', key: 'presenciaProteina', icon: <Award size={16} />, color: '#F59E0B' }
                                ].map(item => {
                                    const total = filteredReports.length || 1;
                                    const count = filteredReports.filter(r => r.datos_formulario?.condiciones?.[item.key]).length;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={item.key} className="p-4 rounded-3xl border border-slate-50 bg-slate-50/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{item.label}</p>
                                            <div className="text-base font-black text-slate-900 mb-2">{pct}%</div>
                                            <div className="h-1.5 bg-white rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}% `, backgroundColor: item.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secciones de Rubros (Full Width Inferior) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mt-8">
                    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner"><Package size={24} /></div>
                            <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Presencia por Rubro</h3>
                        </div>
                        <div className="h-[700px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rubroPresenceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#fcfcfc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                    <Bar dataKey="value" fill="url(#colorAmber3)" radius={[0, 10, 10, 0]} barSize={12}>
                                        <defs>
                                            <linearGradient id="colorAmber3" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#D97706" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <LabelList dataKey="value" position="right" style={{ fontSize: 9, fontWeight: 900, fill: '#D97706' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner"><TrendingUp size={24} /></div>
                            <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Volumen Total por Rubro (TN/Und)</h3>
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
                                        <LabelList dataKey="value" position="right" formatter={(v: any) => v > 0 ? v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''} style={{ fontSize: 9, fontWeight: 900, fill: '#059669' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* NOVEDADES DEL TERRENO: El toque humano de la gestión */}
                <div className="mt-8 bg-white rounded-[3rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><MessageSquare size={24} /></div>
                            <div>
                                <h3 className="text-base font-black uppercase text-slate-900 tracking-tighter">Novedades del Terreno</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Observaciones directas de los inspectores en campo</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReports
                            .filter(r => {
                                const obs = r.datos_formulario?.observaciones_rubros;
                                return typeof obs === 'string' && obs.length > 0 && obs.toLowerCase() !== 'null';
                            })
                            .slice(0, 12)
                            .map((r, idx) => {
                                const inspector = r.inspector_id ? inspectors[r.inspector_id] : null;
                                const fecha = new Date(r.fecha).toLocaleDateString('es-VE', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div key={r.id || idx} className="group relative bg-slate-50/50 hover:bg-white rounded-3xl p-6 border border-slate-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <MessageSquare size={40} />
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-100 shadow-sm">
                                                {inspector ? `${inspector.nombre[0]}${inspector.apellido[0]} ` : <Users size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 leading-tight">
                                                    {inspector ? `${inspector.nombre} ${inspector.apellido} ` : 'Inspector Desconocido'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">{r.estado_geografico}</span>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                                        <Clock size={10} />
                                                        {fecha}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm font-semibold text-slate-600 italic leading-relaxed line-clamp-4 relative z-10">
                                            "{r.datos_formulario.observaciones_rubros}"
                                        </p>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{r.tipo_actividad}</span>
                                            <button
                                                onClick={() => navigate(`/ver-reporte/${r.id}`)}
                                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter"
                                            >
                                                Ver Detalle →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        {filteredReports.filter(r => {
                            const obs = r.datos_formulario?.observaciones_rubros;
                            return typeof obs === 'string' && obs.length > 0 && obs.toLowerCase() !== 'null';
                        }).length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <Activity size={48} className="opacity-20 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No hay novedades registradas con los filtros actuales</p>
                                </div>
                            )}
                    </div>
                </div>
            </main>
        </div>
    );
}
