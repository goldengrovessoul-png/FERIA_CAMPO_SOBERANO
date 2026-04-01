import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Target, RefreshCw, ArrowDownRight } from 'lucide-react';

interface PlanningData {
    product_id: string;
    cantidad_planificada: number;
    cantidad_asignada: number;
    cantidad_recibida: number;
    periodo: string;
}

interface ReportItemMini {
    report_id: string;
    rubro: string;
    cantidad: number;
    precio_unitario?: number;
    _alreadyCounted?: boolean;
}

interface CatalogItemMini {
    id: string;
    name: string;
    type?: string;
}

interface JefePlanningTableProps {
    filterEstado: string; 
    reportItems: ReportItemMini[]; 
    filteredReportIds: Set<string>; 
    catalog: CatalogItemMini[];
}

export default function JefePlanningTable({ filterEstado, reportItems, filteredReportIds, catalog }: JefePlanningTableProps) {
    const [semanas, setSemanas] = useState<string[]>([]);
    const [selectedSemana, setSelectedSemana] = useState<string>('');
    const [planningRows, setPlanningRows] = useState<PlanningData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (filterEstado === 'Todos') {
            queueMicrotask(() => {
                setSemanas([]);
                setSelectedSemana('');
                setPlanningRows([]);
            });
            return;
        }

        const fetchSemanas = async () => {
            const { data, error } = await supabase
                .from('state_product_planning')
                .select('periodo')
                .eq('estado', filterEstado);
            if (data && !error) {
                const uniqueSemanas = Array.from(new Set(data.map(d => d.periodo))).sort((a,b) => b.localeCompare(a));
                setSemanas(uniqueSemanas);
                if (uniqueSemanas.length > 0) {
                    setSelectedSemana(uniqueSemanas[0]); // Por defecto la más reciente
                } else {
                    setSelectedSemana('');
                }
            }
        };
        fetchSemanas();
    }, [filterEstado]);

    useEffect(() => {
        if (!selectedSemana || filterEstado === 'Todos') return;

        const fetchPlanning = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('state_product_planning')
                .select('*')
                .eq('estado', filterEstado)
                .eq('periodo', selectedSemana);
            
            if (data && !error) {
                setPlanningRows(data);
            }
            setLoading(false);
        };
        fetchPlanning();
    }, [filterEstado, selectedSemana]);

    // Calcular las cantidades vendidas en base al Dashboard:
    // "Vendida" es la sumatoria de las cantidades en reportItems que estén en filteredReportIds
    const soldQuantities = useMemo(() => {
        const counts: Record<string, number> = {};
        reportItems.forEach(item => {
            if (filteredReportIds.has(item.report_id)) {
                // reportItems.rubro es el NOMBRE del rubro en el catálogo
                const name = (item.rubro || '').trim().toUpperCase();
                // Encontrar el producto en catalog para mapear por product_id y sumar
                const match = catalog.find(c => c.name.trim().toUpperCase() === name);
                if (match) {
                    counts[match.id] = (counts[match.id] || 0) + (Number(item.cantidad) || 0);
                } else {
                    // Fallback usando el nombre directamente si no hay match
                    counts[name] = (counts[name] || 0) + (Number(item.cantidad) || 0);
                }
            }
        });
        return counts;
    }, [reportItems, filteredReportIds, catalog]);

    if (filterEstado === 'Todos') {
        return (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mt-12 mb-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#007AFF]">
                    <Target size={32} />
                </div>
                <h3 className="font-black text-slate-900 text-xl tracking-tighter uppercase relative">Auditoría del Embudo de Distribución</h3>
                <p className="text-slate-400 font-medium max-w-md">Para visualizar el comparativo (Planificado vs Asignado vs Recibido vs Vendido), por favor seleccione un Estado específico en los filtros generales del Dashboard arriba.</p>
            </div>
        );
    }

    if (semanas.length === 0) {
        return (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mt-12 mb-12 flex flex-col items-center justify-center gap-4 text-center">
                <AlertCircle size={32} className="text-amber-500" />
                <h3 className="font-black text-slate-900 text-xl tracking-tighter uppercase">Sin Planificación Registrada</h3>
                <p className="text-slate-400 font-medium max-w-md">Administración aún no ha cargado datos de planificación para <strong>{filterEstado}</strong>.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-50 mt-12 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-32 -mt-32 transition-transform duration-700 ease-out group-hover:scale-110 -z-0"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 shadow-inner border border-slate-200/50">
                            <Target size={20} />
                        </div>
                        <h3 className="font-black text-slate-900 text-2xl tracking-tighter uppercase">Análisis Logístico por Estado</h3>
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-1">
                        Comparativa de Tiempos: Planificación vs Realidad
                    </p>
                </div>
                
                <div className="w-full md:w-64 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Filtrar por Semana</label>
                    <select 
                        value={selectedSemana}
                        onChange={(e) => setSelectedSemana(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-[13px] font-bold outline-none focus:border-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                        {semanas.map(s => <option key={s} value={s}>Semana: {s}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
            ) : (
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm relative z-10 bg-white">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest rounded-tl-[2rem]">Rubro</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right text-slate-300">1. Planificado</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right text-slate-300">2. Asignado</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right text-emerald-400">3. Recibido</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right text-[#007AFF]">4. Vendido</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right rounded-tr-[2rem]">Alerta (Diferencia)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {planningRows.map(row => {
                                const prod = catalog.find(c => c.id === row.product_id);
                                const name = prod ? prod.name : 'Unknown';
                                
                                // Resolviendo "Vendida" sumando lo que vino del inspector
                                // Notar que los inspectores reportan en Tons o Unidades.
                                // quantity es en Kg para algunos rubros, convertimos a Tons
                                const rawSold = soldQuantities[row.product_id] || soldQuantities[name] || 0;
                                
                                // Factor de conversión? En el dashboard los dashboard totals asumen 1000kg = 1 ton.
                                // Pero reportItems guarda cantidades. Mostraremos la suma bruta pero lo indicamos.
                                // Para Proteinas/Hortalizas el formato es kilogramos en `cantidad` del reporte. 
                                // Para Combos es unidades.
                                // Vamos a dividir entre 1000 solo si el item NO es COMBO para equiparar, 
                                // pero el admin carga planificada en Tons o Unidades, asumimos que coinciden en magnitud.
                                // Dado que el Admin carga "Tons/Unids", asumimos que coinciden.
                                // Si Admin cargó 10 y el Inspector 10,000, hay que convertir.
                                let vendida = rawSold;
                                if (name.toUpperCase().indexOf('COMBO') === -1) {
                                    // Si no es COMBO, reportItems guarda Kgs y Admin guarda Tons, convertimos.
                                    vendida = vendida / 1000;
                                }

                                // Determinar base lógica para restar: el usuario solicitó que sea ESTRICTAMENTE Recibido - Vendido
                                const baseCalculo = row.cantidad_recibida || 0;

                                const diferencia = baseCalculo - vendida;
                                // Diferencia normal es verde/gris, si se vendió mucho menos de lo recibido es ALERTA ROJA (Mermas)
                                // O si se vendió de más es ALERTA ÁMBAR (Inconsistencia)
                                let alertColor = 'text-slate-900';
                                let alertBg = 'bg-slate-50';
                                let icon = null;

                                if (diferencia > 0) {
                                    // Quedó mercancía fría o se perdió
                                    alertColor = 'text-red-600';
                                    alertBg = 'bg-red-50 border-red-100';
                                    icon = <ArrowDownRight size={14} className="inline mr-1" />;
                                } else if (diferencia < 0) {
                                    // Inconsistencia, se vendió mágicamente más
                                    alertColor = 'text-amber-600';
                                    alertBg = 'bg-amber-50 border-amber-100';
                                    icon = <AlertCircle size={14} className="inline mr-1" />;
                                } else {
                                    // Todo cuadra perfecto
                                    alertColor = 'text-emerald-600';
                                    alertBg = 'bg-emerald-50 border-emerald-100';
                                }

                                return (
                                    <tr key={row.product_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5 font-bold text-slate-900 text-sm">{name}</td>
                                        <td className="px-6 py-5 font-bold text-slate-500 text-right">{row.cantidad_planificada.toLocaleString()}</td>
                                        <td className="px-6 py-5 font-bold text-slate-500 text-right">{row.cantidad_asignada.toLocaleString()}</td>
                                        <td className="px-6 py-5 font-black text-emerald-600 text-right">{row.cantidad_recibida.toLocaleString()}</td>
                                        <td className="px-6 py-5 font-black text-[#007AFF] text-right text-lg">{vendida.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`inline-flex items-center px-4 py-2 font-black text-xs rounded-xl border tracking-widest ${alertColor} ${alertBg}`}>
                                                {icon}
                                                {Math.abs(diferencia).toLocaleString()} {/* Mostrar valor absoluto y el signo con el ícono y color */}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}


