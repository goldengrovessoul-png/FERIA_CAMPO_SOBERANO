/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { BodegaService, type BodegaMovil } from '../services/BodegaService';

export interface Report {
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
    nombre_comuna?: string;
    total_proteina: number;
    total_frutas: number;
    total_hortalizas: number;
    total_verduras: number;
    total_viveres: number;
    latitud: number;
    longitud: number;
    datos_formulario?: Record<string, any>;
    rating_value?: number;
    audit_summary?: Record<string, any>;
    estado_reporte: string;
    inspector_id?: string;
    guia_sica_estado?: string | null;
    profiles?: {
        nombre: string;
        apellido: string;
    } | null;
}

export interface VulnerabilityData {
    id: string;
    estado: string;
    municipio: string;
    parroquia: string;
    nivel_prioridad: number;
    descripcion_problema: string;
    latitud: number;
    longitud: number;
}

export interface ReportItem {
    report_id: string;
    rubro: string;
    cantidad: number;
    precio_unitario?: number;
    _alreadyCounted?: boolean;
}

export interface PaymentMethod {
    report_id: string;
    metodo: string;
}

export interface ReportMinppalPresencia {
    report_id: string;
    ente_id: string;
    producto_id: string | null;
    presente: boolean;
    ente_name?: string;
    producto_name?: string;
}

export interface Entrepreneur {
    report_id: string;
    nombre: string;
    actividad: string;
    telefono: string;
}



export function useDashboardData(session: any, authLoading: boolean) {
    const removeAccents = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const [reports, setReports] = useState<Report[]>([]);
    const [reportItems, setReportItems] = useState<ReportItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [inspectors, setInspectors] = useState<Record<string, { nombre: string; apellido: string }>>({});
    const [vulnerabilityData, setVulnerabilityData] = useState<VulnerabilityData[]>([]);
    const [minppalPresencia, setMinppalPresencia] = useState<ReportMinppalPresencia[]>([]);
    const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);

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
        minppal: [] as string[],
        fullCatalog: [] as { id: string, name: string, type: string, parent_id?: string, empresa_id?: string, precio_referencia?: number, precio_privado?: number, presentacion?: string }[],
        bodegas: [] as BodegaMovil[]
    });

    const [debug, setDebug] = useState<string>('Iniciando...');

    const fetchData = async () => {
        try {
            setLoading(true);
            setDebug('Iniciando carga inteligente...');

            const allReports: Report[] = [];
            let page = 0;
            const pageSize = 20;
            let keepFetching = true;

            setDebug('Conectando con base de datos...');

            while (keepFetching) {
                const { data: pageData, error: pageError } = await supabase
                    .from('reports')
                    .select('id, fecha, tipo_actividad, empresa, estado_geografico, municipio, parroquia, personas, familias, comunas, nombre_comuna, total_proteina, total_frutas, total_hortalizas, total_verduras, total_viveres, latitud, longitud, estado_reporte, inspector_id, guia_sica_estado, rating_value, audit_summary')
                    .eq('estado_reporte', 'enviado')
                    .order('fecha', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (pageError) throw pageError;

                if (pageData && pageData.length > 0) {
                    allReports.push(...(pageData as any[]));
                    setReports([...allReports]);
                    setDebug(`Lote ${page + 1}: ${allReports.length} jornadas...`);

                    await new Promise(r => setTimeout(r, 100));

                    if (pageData.length < pageSize) keepFetching = false;
                    page++;
                } else {
                    keepFetching = false;
                }
            }

            if (allReports.length === 0) {
                setLoading(false);
                setDebug('No se encontraron reportes.');
                return;
            }

            setDebug('Sincronizando catálogos...');
            const { data: catalogData } = await supabase
                .from('catalog_items')
                .select('id, type, name, parent_id, empresa_id, precio_referencia, precio_privado, presentacion')
                .eq('is_active', true);

            if (catalogData) {
                const normalize = (items: any[], type: string) => {
                    if (type === 'ARTICULO') {
                        return Array.from(new Set(items.filter(i => i.type === 'ARTICULO' || i.type === 'RUBRO').map(i => removeAccents(i.name.trim().toUpperCase())))).sort() as string[];
                    }
                    return Array.from(new Set(items.filter(i => i.type === type).map(i => removeAccents(i.name.trim().toUpperCase())))).sort() as string[];
                }

                const minppalEntes = normalize(catalogData, 'MINPPAL');
                const defaultMinppal = ['ALCASA', 'ALIMCA', 'ALIMEX', 'CASA', 'DIANA', 'INDUSTRIAS CANAIMA', 'LÁCTEOS LOS ANDES', 'PROAL', 'SABILVEN', 'VENALCASA', 'ZULIA MIA'];
                
                setCatalogos({
                    estados: normalize(catalogData, 'ESTADO'),
                    entes: normalize(catalogData, 'ENTE'),
                    articulos: normalize(catalogData, 'ARTICULO'),
                    actividades: normalize(catalogData, 'ACTIVIDAD'),
                    minppal: minppalEntes.length > 0 ? minppalEntes : defaultMinppal,
                    fullCatalog: catalogData.map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        type: i.type,
                        parent_id: i.parent_id,
                        empresa_id: i.empresa_id,
                        precio_referencia: i.precio_referencia,
                        precio_privado: i.precio_privado,
                        presentacion: i.presentacion
                    })),
                    bodegas: [] as BodegaMovil[]
                });
            }

            // Cargar Bodegas Móviles dinámicas
            const bodegasData = await BodegaService.getAll();
            setCatalogos(prev => ({
                ...prev,
                bodegas: bodegasData
            }));

            const reportIds = allReports.map(r => r.id);
            const chunkSize = 100;
            const allItems: any[] = [];
            const allPayments: any[] = [];
            const allPresencia: any[] = [];
            const allEntrepreneurs: any[] = [];

            for (let i = 0; i < reportIds.length; i += chunkSize) {
                const chunk = reportIds.slice(i, i + chunkSize);
                setDebug(`Detalles: ${Math.round((i / reportIds.length) * 100)}%...`);

                const [itemsRes, paymentRes, presRes, entRes] = await Promise.all([
                    supabase.from('report_items').select('report_id,rubro,cantidad,precio_unitario').in('report_id', chunk),
                    supabase.from('report_payment_methods').select('report_id,metodo').in('report_id', chunk),
                    supabase.from('report_minppal_presencia').select('*').in('report_id', chunk),
                    supabase.from('report_entrepreneurs').select('*').in('report_id', chunk)
                ]);

                if (itemsRes.data) allItems.push(...itemsRes.data);
                if (paymentRes.data) allPayments.push(...paymentRes.data);
                if (presRes.data) allPresencia.push(...presRes.data);
                if (entRes.data) allEntrepreneurs.push(...entRes.data);
            }

            setReportItems(allItems);
            setPaymentMethods(allPayments);
            setMinppalPresencia(allPresencia);
            setEntrepreneurs(allEntrepreneurs);

            const inspectorIds = Array.from(new Set(allReports.map(r => r.inspector_id).filter(id => id)));
            if (inspectorIds.length > 0) {
                const { data: profData } = await supabase.from('profiles').select('id,nombre,apellido').in('id', inspectorIds);
                if (profData) {
                    const map: Record<string, { nombre: string; apellido: string }> = {};
                    profData.forEach((p: any) => map[p.id] = { nombre: p.nombre, apellido: p.apellido });
                    setInspectors(map);
                }
            }

            const { data: vData } = await supabase.from('vulnerability_data').select('*');
            if (vData) setVulnerabilityData(vData);

            setDebug(`Carga completa: ${allReports.length} reportes.`);

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setDebug(`Error: ${error.message || 'Error de conexión'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && session?.access_token) {
            fetchData();
        }
    }, [authLoading, session?.access_token]);

    // Estados para el Drill-down
    const [selectedEnte, setSelectedEnte] = useState<string | null>(null);
    const [selectedEstado, setSelectedEstado] = useState<string | null>(null);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterEstado('Todos');
        setFilterTipo('Todos');
        setFilterEnte('Todos');
        setFilterRubro('Todos');
        setStartDate('');
        setEndDate('');
        setSelectedEnte(null);
        setSelectedEstado(null);
    };

    const filteredReports = useMemo(() => {
        return reports.filter((r: Report) => {
            const cleanSearch = searchTerm.trim().toLowerCase();
            const matchesSearch = !cleanSearch ||
                (r.parroquia || '').toLowerCase().includes(cleanSearch) ||
                (r.municipio || '').toLowerCase().includes(cleanSearch);

            const matchesEstado = filterEstado === 'Todos' ||
                removeAccents((r.estado_geografico || '').trim().toUpperCase()) === removeAccents(filterEstado.trim().toUpperCase());

            const matchesTipo = filterTipo === 'Todos' ||
                removeAccents((r.tipo_actividad || '').trim().toUpperCase()) === removeAccents(filterTipo.trim().toUpperCase());

            const matchesEnte = filterEnte === 'Todos' ||
                removeAccents((r.empresa || '').trim().toUpperCase()) === removeAccents(filterEnte.trim().toUpperCase());

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

    const proteinEfficiency = useMemo(() => {
        let totalProteina = 0;
        let totalGeneral = 0;
        filteredReports.forEach(r => {
            const p = Number(r.total_proteina) || 0;
            const t = (Number(r.total_proteina) || 0) + (Number(r.total_frutas) || 0) +
                (Number(r.total_hortalizas) || 0) + (Number(r.total_verduras) || 0) +
                (Number(r.total_viveres) || 0);
            totalProteina += p;
            totalGeneral += t;
        });
        const pct = totalGeneral > 0 ? Math.round((totalProteina / totalGeneral) * 100) : 0;
        return { totalProteina, pct };
    }, [filteredReports]);

    const entrepreneurDiversity = useMemo(() => {
        const activityMap: Record<string, { count: number, reports: Set<string> }> = {};
        const filteredEnt = entrepreneurs.filter(e => filteredReportIds.has(e.report_id));
        filteredEnt.forEach(e => {
            const r = reports.find(rep => rep.id === e.report_id);
            if (r) {
                const act = r.tipo_actividad || 'OTRO';
                if (!activityMap[act]) activityMap[act] = { count: 0, reports: new Set() };
                activityMap[act].count += 1;
                activityMap[act].reports.add(e.report_id);
            }
        });
        return Object.entries(activityMap).map(([name, data]) => ({
            name,
            value: data.reports.size > 0 ? Number((data.count / data.reports.size).toFixed(1)) : 0
        })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [entrepreneurs, filteredReportIds, reports]);

    const abastecimientoHogar = useMemo(() => {
        let totalTons = 0;
        let totalFamilias = 0;
        filteredReports.forEach(r => {
            const t = (Number(r.total_proteina) || 0) + (Number(r.total_frutas) || 0) +
                (Number(r.total_hortalizas) || 0) + (Number(r.total_verduras) || 0) +
                (Number(r.total_viveres) || 0);
            totalTons += t;
            totalFamilias += (Number(r.familias) || 0);
        });
        const kgPorFamilia = totalFamilias > 0 ? (totalTons * 1000) / totalFamilias : 0;
        return {
            kg: Number(kgPorFamilia.toFixed(1)),
            familias: totalFamilias
        };
    }, [filteredReports]);

    const monthlyComparison = useMemo(() => {
        const now = new Date();
        const curM = now.getMonth();
        const curY = now.getFullYear();
        const lastDate = new Date(); lastDate.setMonth(now.getMonth() - 1);
        const lastM = lastDate.getMonth();
        const lastY = lastDate.getFullYear();

        let curF = 0, lastF = 0;
        reports.forEach(r => {
            const d = new Date(r.fecha);
            if (d.getMonth() === curM && d.getFullYear() === curY) curF += Number(r.familias) || 0;
            else if (d.getMonth() === lastM && d.getFullYear() === lastY) lastF += Number(r.familias) || 0;
        });
        const diff = curF - lastF;
        const pct = lastF > 0 ? Math.abs(Math.round((diff / lastF) * 100)) : 100;
        return { cur: curF, last: lastF, pct, trend: diff >= 0 ? 'up' : 'down' };
    }, [reports]);

    const priceTrackingData = useMemo(() => {
        const stats: Record<string, {
            name: string,
            presentation: string,
            nationalRef: number,
            totalPrice: number,
            count: number
        }> = {};

        const articles = catalogos.fullCatalog.filter(c => (c.type === 'ARTICULO' || c.type === 'RUBRO') && (c.precio_referencia || 0) > 0);

        articles.forEach(art => {
            stats[art.name] = {
                name: art.name,
                presentation: art.presentacion || 'N/A',
                nationalRef: art.precio_referencia || 0,
                totalPrice: 0,
                count: 0
            };
        });

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id) && stats[item.rubro]) {
                const price = Number(item.precio_unitario) || 0;
                if (price > 0) {
                    stats[item.rubro].totalPrice += price;
                    stats[item.rubro].count += 1;
                }
            }
        });

        if (filterRubro !== 'Todos' && !stats[filterRubro]) {
            stats[filterRubro] = {
                name: filterRubro,
                presentation: 'N/A',
                nationalRef: 0,
                totalPrice: 0,
                count: 0
            };
        }

        return Object.values(stats)
            .map(s => {
                const avgFair = s.count > 0 ? s.totalPrice / s.count : 0;
                const savings = s.nationalRef > 0 ? ((s.nationalRef - avgFair) / s.nationalRef) * 100 : 0;
                return {
                    ...s,
                    avgFair,
                    savings: avgFair > 0 ? savings : 0
                };
            })
            .sort((a, b) => b.savings - a.savings);
    }, [reportItems, filteredReportIds, catalogos.fullCatalog, filterRubro]);

    const foodDistribution = useMemo(() => {
        const categories = {
            'Proteínas': 0,
            'Frutas': 0,
            'Hortalizas': 0,
            'Verduras': 0,
            'Víveres': 0
        };

        const itemToCategory: Record<string, string> = {};
        catalogos.fullCatalog.forEach(item => {
            if (item.type === 'ARTICULO' && item.parent_id) {
                const parent = catalogos.fullCatalog.find(p => p.id === item.parent_id);
                if (parent && parent.type === 'RUBRO') {
                    itemToCategory[item.name.trim().toUpperCase()] = parent.name.trim().toUpperCase();
                }
            }
        });

        const reportsWithTotals = new Set<string>();
        const isRubroFiltered = filterRubro !== 'Todos';

        filteredReports.forEach(r => {
            const sumRow = (Number(r.total_proteina) || 0) +
                (Number(r.total_frutas) || 0) +
                (Number(r.total_hortalizas) || 0) +
                (Number(r.total_verduras) || 0) +
                (Number(r.total_viveres) || 0);

            if (sumRow > 0 && !isRubroFiltered) {
                categories['Proteínas'] += Number(r.total_proteina) || 0;
                categories['Frutas'] += Number(r.total_frutas) || 0;
                categories['Hortalizas'] += Number(r.total_hortalizas) || 0;
                categories['Verduras'] += Number(r.total_verduras) || 0;
                categories['Víveres'] += Number(r.total_viveres) || 0;
                reportsWithTotals.add(r.id);
            }
        });

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id)) {
                const isFilteredItem = isRubroFiltered && item.rubro?.trim().toUpperCase() === filterRubro.trim().toUpperCase();

                if ((isRubroFiltered && isFilteredItem) || (!isRubroFiltered && !reportsWithTotals.has(item.report_id))) {
                    const cat = itemToCategory[item.rubro?.trim().toUpperCase()];
                    const qty = Number(item.cantidad) || 0;
                    const tons = qty / 1000;

                    if (cat) {
                        if (cat.includes('PROTE')) categories['Proteínas'] += tons;
                        else if (cat.includes('FRUTA')) categories['Frutas'] += tons;
                        else if (cat.includes('HORTA')) categories['Hortalizas'] += tons;
                        else if (cat.includes('VERDU')) categories['Verduras'] += tons;
                        else if (cat.includes('SECO') || cat.includes('VIVERES')) categories['Víveres'] += tons;
                    } else {
                        const rubroName = item.rubro?.trim().toUpperCase();
                        if (rubroName.includes('PROTE')) categories['Proteínas'] += tons;
                        else if (rubroName.includes('FRUTA')) categories['Frutas'] += tons;
                        else if (rubroName.includes('HORTA')) categories['Hortalizas'] += tons;
                        else if (rubroName.includes('VERDU')) categories['Verduras'] += tons;
                        else if (rubroName.includes('SECO') || rubroName.includes('VIVERES')) categories['Víveres'] += tons;
                    }
                }
            }
        });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .filter(i => i.value > 0);
    }, [filteredReports, filterRubro, reportItems, filteredReportIds, catalogos.fullCatalog]);

    const paymentData = useMemo(() => {
        const counts: Record<string, number> = {};
        const tracks = new Set<string>();

        paymentMethods.forEach(p => {
            if (filteredReportIds.has(p.report_id)) {
                const label = (p.metodo || '').replace(/\[.*\]/, '').trim().toUpperCase();
                const key = `${p.report_id}_${label}`;
                if (label && !tracks.has(key)) {
                    counts[label] = (counts[label] || 0) + 1;
                    tracks.add(key);
                }
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [paymentMethods, filteredReportIds]);

    const timelineData = useMemo(() => {
        const counts: Record<string, { count: number, timestamp: number }> = {};
        filteredReports.forEach(r => {
            const d = new Date(r.fecha);
            const label = d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
            if (!counts[label]) {
                const sortDate = new Date(d);
                sortDate.setHours(0, 0, 0, 0);
                counts[label] = { count: 0, timestamp: sortDate.getTime() };
            }
            counts[label].count += 1;
        });

        return Object.entries(counts)
            .map(([date, data]) => ({ date, count: data.count, timestamp: data.timestamp }))
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(({ date, count }) => ({ date, count }));
    }, [filteredReports]);

    const stateData = useMemo(() => {
        const entries: Record<string, { value: number, personas: number, comunas: number, total_distribuido: number }> = {};

        catalogos.estados.forEach(estado => {
            const label = estado.trim().toUpperCase();
            entries[label] = { value: 0, personas: 0, comunas: 0, total_distribuido: 0 };
        });

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
                (Number(r.total_viveres) || 0);
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

    const priceComparisonByState = useMemo(() => {
        if (filterRubro === 'Todos') {
            return {
                data: [],
                referencePrice: 0,
                productName: ''
            };
        }

        const targetRubro = filterRubro;
        const catalogItem = catalogos.fullCatalog.find(c =>
            (c.name.trim().toUpperCase() === targetRubro.trim().toUpperCase()) &&
            (c.type === 'ARTICULO' || c.type === 'RUBRO')
        );

        const referencePrice = catalogItem?.precio_referencia || 0;
        const stateAvgs: Record<string, { total: number, count: number }> = {};

        catalogos.estados.forEach(e => {
            stateAvgs[e.trim().toUpperCase()] = { total: 0, count: 0 };
        });

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id) &&
                item.rubro?.trim().toUpperCase() === targetRubro.trim().toUpperCase() &&
                (item.precio_unitario || 0) > 0) {

                const rep = reports.find(r => r.id === item.report_id);
                if (rep) {
                    const state = (rep.estado_geografico || 'DESCONOCIDO').trim().toUpperCase();
                    if (!stateAvgs[state]) stateAvgs[state] = { total: 0, count: 0 };
                    stateAvgs[state].total += Number(item.precio_unitario);
                    stateAvgs[state].count += 1;
                }
            }
        });

        const chartData = Object.entries(stateAvgs)
            .map(([name, stats]) => ({
                name,
                avgPrice: stats.count > 0 ? stats.total / stats.count : 0
            }))
            .filter(d => d.avgPrice > 0)
            .sort((a, b) => b.avgPrice - a.avgPrice);

        return {
            data: chartData,
            referencePrice,
            productName: targetRubro
        };
    }, [reportItems, reports, filteredReportIds, catalogos.fullCatalog, catalogos.estados, filterRubro]);

    const activityTypeData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const label = (r.tipo_actividad || 'OTRO').trim().toUpperCase();
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredReports]);

    const sicaData = useMemo(() => {
        let totalSi = 0;
        let totalNo = 0;
        const byState: Record<string, { si: number, no: number }> = {};

        catalogos.estados.forEach(estado => {
            const label = estado.trim();
            const formalLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
            byState[formalLabel] = { si: 0, no: 0 };
        });

        filteredReports.forEach(r => {
            const estadoSica = r.guia_sica_estado;
            const label = (r.estado_geografico || 'Desconocido').trim();
            const formalLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

            if (!byState[formalLabel]) {
                byState[formalLabel] = { si: 0, no: 0 };
            }

            if (estadoSica === 'Sí' || estadoSica === 'Si') {
                totalSi++;
                byState[formalLabel].si++;
            } else if (estadoSica === 'No') {
                totalNo++;
                byState[formalLabel].no++;
            }
        });

        const stateRows = Object.entries(byState)
            .filter(([entidad, stats]) => catalogos.estados.some(e => e.trim().toLowerCase() === entidad.toLowerCase()) || stats.si > 0 || stats.no > 0)
            .map(([entidad, stats]) => ({
                entidad,
                si: stats.si,
                no: stats.no,
            })).sort((a, b) => a.entidad.localeCompare(b.entidad));

        return {
            totalSi,
            totalNo,
            total: totalSi + totalNo,
            stateRows
        };
    }, [filteredReports, catalogos.estados]);

    const rubroPresenceData = useMemo(() => {
        const RUBROS_LIST = catalogos.fullCatalog
            .filter(i => i.type === 'ARTICULO' && (!i.parent_id || catalogos.fullCatalog.find(p => p.id === i.parent_id)?.type === 'RUBRO'))
            .map(i => i.name);

        const counts: Record<string, number> = {};
        RUBROS_LIST.forEach(r => counts[r.toLowerCase()] = 0);

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id)) {
                const rubroKey = item.rubro?.toLowerCase();
                if (rubroKey && Object.prototype.hasOwnProperty.call(counts, rubroKey)) {
                    counts[rubroKey]++;
                }
            }
        });

        return RUBROS_LIST.map(name => ({
            name,
            value: counts[name.toLowerCase()] || 0,
            total: filteredReports.length
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    }, [reportItems, filteredReportIds, catalogos.fullCatalog, filteredReports.length]);

    const rubroVolumeData = useMemo(() => {
        const RUBROS_LIST = catalogos.fullCatalog
            .filter(i => i.type === 'ARTICULO' && (!i.parent_id || catalogos.fullCatalog.find(p => p.id === i.parent_id)?.type === 'RUBRO'))
            .map(i => i.name);

        const sums: Record<string, number> = {};
        RUBROS_LIST.forEach(r => sums[r.toLowerCase()] = 0);

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id)) {
                const rubroKey = item.rubro?.toLowerCase();
                if (rubroKey && Object.prototype.hasOwnProperty.call(sums, rubroKey)) {
                    sums[rubroKey] += Number(item.cantidad) || 0;
                }
            }
        });

        return RUBROS_LIST.map(name => ({
            name,
            value: sums[name.toLowerCase()] || 0
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    }, [reportItems, filteredReportIds, catalogos.fullCatalog]);

    const minppalProductsPresenceData = useMemo(() => {
        const productMap: Record<string, { name: string, ente: string }> = {};
        catalogos.fullCatalog.forEach(c => {
            if (c.type === 'ARTICULO') {
                const producerId = c.empresa_id || c.parent_id;
                if (producerId) {
                    const parent = catalogos.fullCatalog.find(e => e.id === producerId);
                    if (parent) {
                        productMap[c.id] = { name: c.name, ente: parent.name };
                    }
                }
            }
        });

        const counts: Record<string, number> = {};

        minppalPresencia.forEach(pres => {
            if (filteredReportIds.has(pres.report_id) && pres.presente && pres.producto_id) {
                const info = productMap[pres.producto_id];
                if (info) {
                    const label = `${info.name} (${info.ente})`;
                    counts[label] = (counts[label] || 0) + 1;
                }
            }
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [minppalPresencia, filteredReportIds, catalogos.fullCatalog]);

    const savingsImpactData = useMemo(() => {
        const stats: Record<string, {
            name: string;
            tipo: string;
            inversionMinppal: number;
            inversionPrivado: number;
            cantidadTotal: number;
            ahorroTotal: number;
            presentacion: string;
        }> = {};

        const articles = catalogos.fullCatalog.filter(c => (c.type === 'ARTICULO' || c.type === 'RUBRO') && (c.precio_referencia || 0) > 0);

        articles.forEach(art => {
            stats[art.name] = {
                name: art.name,
                tipo: art.type,
                inversionMinppal: 0,
                inversionPrivado: 0,
                cantidadTotal: 0,
                ahorroTotal: 0,
                presentacion: art.presentacion || 'N/A'
            };
        });

        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id) && stats[item.rubro]) {
                const s = stats[item.rubro];
                const itemRef = catalogos.fullCatalog.find(c => c.name === item.rubro);
                const cant = Number(item.cantidad) || 0;

                if (itemRef && cant > 0) {
                    const pMinppal = itemRef.precio_referencia || 0;
                    const pPrivado = itemRef.precio_privado || 0;

                    s.inversionMinppal += cant * pMinppal;
                    s.inversionPrivado += cant * (pPrivado > 0 ? pPrivado : pMinppal * 1.3);
                    s.cantidadTotal += cant;
                }
            }
        });

        const list = Object.values(stats)
            .filter(s => s.inversionMinppal > 0)
            .map(s => ({
                ...s,
                ahorroTotal: s.inversionPrivado - s.inversionMinppal,
                porcentajeAhorro: s.inversionPrivado > 0 ? ((s.inversionPrivado - s.inversionMinppal) / s.inversionPrivado) * 100 : 0
            }));

        const totalMinppal = list.reduce((acc, curr) => acc + curr.inversionMinppal, 0);
        const totalPrivado = list.reduce((acc, curr) => acc + curr.inversionPrivado, 0);
        const totalAhorroVal = totalPrivado - totalMinppal;
        const totalAhorroPct = totalPrivado > 0 ? (totalAhorroVal / totalPrivado) * 100 : 0;

        return {
            ranking: list.sort((a, b) => b.ahorroTotal - a.ahorroTotal).slice(0, 10),
            comparativoGlobal: [
                { name: 'INVERSIÓN MINPPAL', valor: totalMinppal, color: '#007AFF' },
                { name: 'PROYECTADO PRIVADO', valor: totalPrivado, color: '#94a3b8' }
            ],
            totalAhorroVal,
            totalAhorroPct
        };
    }, [reportItems, filteredReportIds, catalogos.fullCatalog]);

    const entrepreneurStats = useMemo(() => {
        const byState: Record<string, number> = {};
        let total = 0;
        entrepreneurs.forEach(e => {
            if (filteredReportIds.has(e.report_id)) {
                const rep = reports.find(r => r.id === e.report_id);
                const estado = (rep?.estado_geografico || 'SIN ESTADO').trim().toUpperCase();
                byState[estado] = (byState[estado] || 0) + 1;
                total++;
            }
        });
        const chartData = Object.entries(byState)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        return { chartData, total };
    }, [entrepreneurs, filteredReportIds, reports]);

    const ratingData = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        filteredReports.forEach((r: Report) => {
            const rating = Number(r.rating_value);
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                counts[rating as keyof typeof counts]++;
            }
        });
        return Object.entries(counts).map(([star, value]) => ({
            star: `${star} \u2605`,
            value,
            rating: Number(star)
        }));
    }, [filteredReports]);

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

    const proteinPresenceStats = useMemo(() => {
        let presenceCount = 0;
        let absenceCount = 0;
        const byState: Record<string, number> = {};

        catalogos.estados.forEach(e => {
            byState[e.trim().toUpperCase()] = 0;
        });

        filteredReports.forEach(r => {
            const hasPresence = r.audit_summary?.presenciaProteina === true || (Number(r.total_proteina) || 0) > 0;
            const state = (r.estado_geografico || 'DESCONOCIDO').trim().toUpperCase();

            if (hasPresence) {
                presenceCount++;
                byState[state] = (byState[state] || 0) + 1;
            } else {
                absenceCount++;
            }
        });

        const stateChartData = Object.entries(byState)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const globalChartData = [
            { name: 'PRESENTE', value: presenceCount, color: '#F59E0B' },
            { name: 'AUSENTE', value: absenceCount, color: '#f3f4f6' }
        ];

        const total = presenceCount + absenceCount;
        const pct = total > 0 ? Math.round((presenceCount / total) * 100) : 0;

        return { globalChartData, stateChartData, total, presenceCount, absenceCount, pct };
    }, [filteredReports, catalogos.estados]);

    const hortalizasPresenceStats = useMemo(() => {
        let presenceCount = 0;
        let absenceCount = 0;
        const byState: Record<string, number> = {};

        catalogos.estados.forEach(e => {
            byState[e.trim().toUpperCase()] = 0;
        });

        filteredReports.forEach(r => {
            const hasPresence = r.audit_summary?.presenciaHortalizas === true || (Number(r.total_hortalizas) || 0) > 0 || (Number(r.total_verduras) || 0) > 0;
            const state = (r.estado_geografico || 'DESCONOCIDO').trim().toUpperCase();

            if (hasPresence) {
                presenceCount++;
                byState[state] = (byState[state] || 0) + 1;
            } else {
                absenceCount++;
            }
        });

        const stateChartData = Object.entries(byState)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const globalChartData = [
            { name: 'PRESENTE', value: presenceCount, color: '#84CC16' },
            { name: 'AUSENTE', value: absenceCount, color: '#f3f4f6' }
        ];

        const total = presenceCount + absenceCount;
        const pct = total > 0 ? Math.round((presenceCount / total) * 100) : 0;

        return { globalChartData, stateChartData, total, presenceCount, absenceCount, pct };
    }, [filteredReports, catalogos.estados]);

    const frutasPresenceStats = useMemo(() => {
        let presenceCount = 0;
        let absenceCount = 0;
        const byState: Record<string, number> = {};

        catalogos.estados.forEach(e => {
            byState[e.trim().toUpperCase()] = 0;
        });

        filteredReports.forEach(r => {
            const hasPresence = r.audit_summary?.presenciaFrutas === true || (Number(r.total_frutas) || 0) > 0;
            const state = (r.estado_geografico || 'DESCONOCIDO').trim().toUpperCase();

            if (hasPresence) {
                presenceCount++;
                byState[state] = (byState[state] || 0) + 1;
            } else {
                absenceCount++;
            }
        });

        const stateChartData = Object.entries(byState)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const globalChartData = [
            { name: 'PRESENTE', value: presenceCount, color: '#EC4899' },
            { name: 'AUSENTE', value: absenceCount, color: '#f3f4f6' }
        ];

        const total = presenceCount + absenceCount;
        const pct = total > 0 ? Math.round((presenceCount / total) * 100) : 0;

        return { globalChartData, stateChartData, total, presenceCount, absenceCount, pct };
    }, [filteredReports, catalogos.estados]);
    const comunasByStateData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const estado = (r.estado_geografico || "SIN ESTADO").trim().toUpperCase();
            counts[estado] = (counts[estado] || 0) + (Number(r.comunas) || 0);
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredReports]);
    const familiasByStateData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredReports.forEach(r => {
            const estado = (r.estado_geografico || 'SIN ESTADO').trim().toUpperCase();
            counts[estado] = (counts[estado] || 0) + (Number(r.familias) || 0);
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredReports]);

    const minppalDetailData = useMemo(() => {
        const entes = catalogos.minppal;
        const total = filteredReports.length || 1;
        
        return entes.map(ente => {
            const count = filteredReports.filter(r => 
                (r.empresa || '').trim().toUpperCase() === ente.trim().toUpperCase() ||
                minppalPresencia.some(p => 
                    p.report_id === r.id && 
                    p.presente && 
                    p.ente_name?.trim().toUpperCase() === ente.trim().toUpperCase()
                )
            ).length;
            
            return {
                name: ente,
                count,
                pct: Math.round((count / total) * 100)
            };
        }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    }, [filteredReports, minppalPresencia, catalogos.minppal]);

    // Lógica para obtener las jornadas específicas de un Ente seleccionado (Drill-down)
    const enteJornadasDetails = useMemo(() => {
        if (!selectedEnte) return [];

        const reportsForEnte = filteredReports.filter(report => {
            // Caso 1: Es el ente líder de la jornada
            if (report.empresa?.trim().toUpperCase() === selectedEnte.trim().toUpperCase()) return true;

            // Caso 2: Está presente como invitado
            return minppalPresencia.some(pres =>
                pres.report_id === report.id &&
                pres.presente &&
                pres.ente_name?.trim().toUpperCase() === selectedEnte.trim().toUpperCase()
            );
        });

        return reportsForEnte.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [selectedEnte, filteredReports, minppalPresencia]);

    const estadoJornadasDetails = useMemo(() => {
        if (!selectedEstado) return [];
        const estadoNombre = selectedEstado.trim().toUpperCase();
        
        return filteredReports.filter(report => 
            (report.estado_geografico || '').trim().toUpperCase() === estadoNombre
        ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [selectedEstado, filteredReports]);

    const totalEstados = useMemo(() => {
        const estados = new Set(filteredReports.map(r => (r.estado_geografico || '').trim().toUpperCase()).filter(e => e !== ''));
        return estados.size;
    }, [filteredReports]);

    const totalMunicipios = useMemo(() => {
        const municipios = new Set(filteredReports.map(r => (r.municipio || '').trim().toUpperCase()).filter(m => m !== ''));
        return municipios.size;
    }, [filteredReports]);

    const totalParroquias = useMemo(() => {
        const parroquias = new Set(filteredReports.map(r => (r.parroquia || '').trim().toUpperCase()).filter(p => p !== ''));
        return parroquias.size;
    }, [filteredReports]);

    return {
        loading,
        debug,
        reports,
        reportItems,
        paymentMethods,
        inspectors,
        vulnerabilityData,
        minppalPresencia,
        entrepreneurs,
        catalogos,
        
        // Filtros y estados
        searchTerm, setSearchTerm,
        filterEstado, setFilterEstado,
        filterTipo, setFilterTipo,
        filterEnte, setFilterEnte,
        filterRubro, setFilterRubro,
        startDate, setStartDate,
        endDate, setEndDate,
        clearFilters,
        fetchData,

        // Computados
        filteredReports,
        filteredReportIds,
        proteinEfficiency,
        entrepreneurDiversity,
        abastecimientoHogar,
        monthlyComparison,
        priceTrackingData,
        foodDistribution,
        paymentData,
        timelineData,
        stateData,
        priceComparisonByState,
        activityTypeData,
        sicaData,
        rubroPresenceData,
        rubroVolumeData,
        minppalProductsPresenceData,
        savingsImpactData,
        entrepreneurStats,
        ratingData,
        inspectorReportData,
        enteReportData,
        proteinPresenceStats,
        hortalizasPresenceStats,
        frutasPresenceStats,
        minppalDetailData,
        totalEstados,
        totalMunicipios,
        totalParroquias,
        comunasByStateData,
        familiasByStateData,
        selectedEnte, setSelectedEnte,
        selectedEstado, setSelectedEstado,
        enteJornadasDetails,
        estadoJornadasDetails
    };
}
