import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';

interface CatalogItem {
    id: string;
    name: string;
    type: string;
}

interface PlanningData {
    id?: string;
    estado: string;
    product_id: string;
    cantidad_planificada: number;
    cantidad_asignada: number;
    cantidad_recibida: number;
    periodo: string;
}

export default function AdminPlanningView() {
    const [estados, setEstados] = useState<string[]>([]);
    const [products, setProducts] = useState<CatalogItem[]>([]);
    const [selectedEstado, setSelectedEstado] = useState<string>('');
    const [selectedPeriodo, setSelectedPeriodo] = useState<string>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [planningRows, setPlanningRows] = useState<Record<string, PlanningData>>({});

    useEffect(() => {
        const loadCatalogs = async () => {
            const { data } = await supabase.from('catalog_items').select('id, name, type').eq('is_active', true);
            if (data) {
                const est = Array.from(new Set(data.filter(i => i.type === 'ESTADO').map(i => i.name.trim().toUpperCase()))).sort();
                setEstados(est);
                const rubros = data.filter(i => i.type === 'RUBRO' || i.type === 'ARTICULO').sort((a,b) => a.name.localeCompare(b.name));
                setProducts(rubros);
            }
        };
        loadCatalogs();
    }, []);

    useEffect(() => {
        if (!selectedEstado || !selectedPeriodo) return;
        
        const fetchPlanning = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('state_product_planning')
                .select('*')
                .eq('estado', selectedEstado)
                .eq('periodo', selectedPeriodo);
                
            if (data && !error) {
                const rows: Record<string, PlanningData> = {};
                data.forEach(d => {
                    rows[d.product_id] = d;
                });
                setPlanningRows(rows);
            } else {
                setPlanningRows({});
            }
            setLoading(false);
        };
        fetchPlanning();
    }, [selectedEstado, selectedPeriodo]);

    const handleInputChange = (productId: string, field: keyof PlanningData, value: string) => {
        setPlanningRows(prev => {
            const numValue = value === '' ? 0 : parseFloat(value);
            const current = prev[productId] || { 
                estado: selectedEstado, 
                product_id: productId, 
                cantidad_planificada: 0, 
                cantidad_asignada: 0, 
                cantidad_recibida: 0, 
                periodo: selectedPeriodo 
            };
            return {
                ...prev,
                [productId]: { ...current, [field]: numValue }
            };
        });
    };

    const handleSave = async () => {
        if (!selectedEstado || !selectedPeriodo) {
            alert("Debe seleccionar Estado y Período.");
            return;
        }

        setSaving(true);
        // Filtrar solo los registros que tengan alguna cantidad > 0 o que ya tengan ID (para poder actualizar a 0 si hace falta)
        const rowsToSave = Object.values(planningRows)
            .filter(row => row.id || row.cantidad_planificada > 0 || row.cantidad_asignada > 0 || row.cantidad_recibida > 0)
            .map(row => {
                // Remover timestamps por si acaso y preservar el ID solo si existe
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, created_at: _c, updated_at: _u, ...rest } = row as PlanningData & { created_at?: string, updated_at?: string };
                return {
                    ...(id ? { id } : {}),
                    ...rest,
                    estado: selectedEstado,
                    periodo: selectedPeriodo
                };
            });

        if (rowsToSave.length > 0) {
            // Upsert por defecto usa la clave primaria (id) si no se especifica onConflict
            const { error } = await supabase.from('state_product_planning').upsert(rowsToSave);
            if (error) {
                console.error("Detalle del error Supabase:", error);
                alert("Error al guardar planificación: " + error.message);
            } else {
                alert("Planificación guardada exitosamente.");
            }
        } else {
            alert("No hay cantidades para guardar.");
        }
        setSaving(false);
    };

    const strategicNames = ['POLLO', 'HUEVO', 'MORTADELA', 'SARDINA FRESCA', 'CERDO', 'COMBO'];
    const filteredProducts = products.filter(p => strategicNames.some(s => p.name.toUpperCase().includes(s)));
    const otherProducts = products.filter(p => !strategicNames.some(s => p.name.toUpperCase().includes(s)));

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in space-y-8">
            <div className="flex justify-between items-end gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h3 className="font-black text-2xl text-slate-900 tracking-tighter uppercase">Planificación Semanal (Tons / Unids)</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestión del Embudo de Distribución por Estado</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="px-6 py-4 bg-[#007AFF] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Guardar Planificación
                </button>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semana Operativa</label>
                    <input 
                        type="week" 
                        value={selectedPeriodo}
                        onChange={(e) => setSelectedPeriodo(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-[14px] font-bold outline-none focus:border-blue-100 transition-all"
                    />
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                    <select 
                        value={selectedEstado}
                        onChange={(e) => setSelectedEstado(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-[14px] font-bold outline-none focus:border-blue-100 transition-all"
                    >
                        <option value="">-- Seleccionar Estado --</option>
                        {estados.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
            </div>

            {!selectedEstado && (
                <div className="p-8 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3">
                    <AlertCircle size={32} />
                    <p className="text-sm font-bold uppercase tracking-widest text-center">Seleccione un estado para cargar la planificación.</p>
                </div>
            )}

            {loading && !!selectedEstado && (
                <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-blue-500" /></div>
            )}

            {!loading && selectedEstado && (
                <div className="overflow-x-auto mt-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-tl-xl">Rubro Estratégico</th>
                                <th className="px-6 py-4 text-[10px] font-black text-blue-500 uppercase tracking-widest text-right">Planificada</th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest text-right">Asignada</th>
                                <th className="px-6 py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right rounded-tr-xl">Recibida (Territorial)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProducts.map(p => {
                                const row = planningRows[p.id];
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm whitespace-nowrap">🌟 {p.name}</td>
                                        <td className="px-6 py-4 w-40">
                                            <input type="number" value={row?.cantidad_planificada ?? ''} onChange={e => handleInputChange(p.id, 'cantidad_planificada', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-right text-sm font-bold focus:border-blue-500 outline-none" min="0" step="0.01" placeholder="0" />
                                        </td>
                                        <td className="px-6 py-4 w-40">
                                            <input type="number" value={row?.cantidad_asignada ?? ''} onChange={e => handleInputChange(p.id, 'cantidad_asignada', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-right text-sm font-bold focus:border-indigo-500 outline-none" min="0" step="0.01" placeholder="0" />
                                        </td>
                                        <td className="px-6 py-4 w-40">
                                            <input type="number" value={row?.cantidad_recibida ?? ''} onChange={e => handleInputChange(p.id, 'cantidad_recibida', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-right text-sm font-bold focus:border-emerald-500 outline-none" min="0" step="0.01" placeholder="0" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    <div className="mt-8 mb-4 px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Otros Rubros Secundarios</h4>
                    </div>
                    <table className="w-full text-left border-collapse opacity-75">
                         <tbody className="divide-y divide-slate-50">
                            {otherProducts.map(p => {
                                const row = planningRows[p.id];
                                return (
                                    <tr key={p.id} className="hover:opacity-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-2 font-semibold text-slate-500 text-[11px] whitespace-nowrap">{p.name}</td>
                                        <td className="px-6 py-2 w-32">
                                            <input type="number" value={row?.cantidad_planificada ?? ''} onChange={e => handleInputChange(p.id, 'cantidad_planificada', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs focus:border-blue-500 outline-none" min="0" step="0.01" placeholder="0" />
                                        </td>
                                        <td className="px-6 py-2 w-32">
                                            <input type="number" value={row?.cantidad_asignada ?? ''} onChange={e => handleInputChange(p.id, 'cantidad_asignada', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs focus:border-indigo-500 outline-none" min="0" step="0.01" placeholder="0" />
                                        </td>
                                        <td className="px-6 py-2 w-32">
                                            <input type="number" value={row?.cantidad_recibida ?? ''} onChange={e => handleInputChange(p.id, 'cantidad_recibida', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs focus:border-emerald-500 outline-none" min="0" step="0.01" placeholder="0" />
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
