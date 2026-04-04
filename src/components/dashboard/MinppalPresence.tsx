/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Building2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LabelList
} from 'recharts';

interface MinppalPresenceProps {
    minppalDetailData: Record<string, any>[];
    setSelectedEnte: (ente: string) => void;
    setIsDrillDownOpen: (open: boolean) => void;
    setIsStateDrillDownOpen: (open: boolean) => void;
}

const MinppalPresence: React.FC<MinppalPresenceProps> = ({
    minppalDetailData,
    setSelectedEnte,
    setIsDrillDownOpen,
    setIsStateDrillDownOpen
}) => {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 pt-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Presencia de Entes MINPPAL con Productos</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
                {/* Izquierda: tarjetas por empresa */}
                <div className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    {minppalDetailData.map((emp) => (
                        <div
                            key={emp.name}
                            onClick={() => {
                                setSelectedEnte(emp.name);
                                setIsStateDrillDownOpen(false);
                                setIsDrillDownOpen(true);
                            }}
                            className={`p-5 rounded-3xl border-2 flex flex-col gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-95 ${emp.count > 0
                                ? 'bg-amber-50 border-amber-100 hover:border-amber-300'
                                : 'bg-slate-50 border-slate-100'
                                }`}
                        >
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{emp.name}</p>
                            <p className={`text-2xl font-black tracking-tighter leading-none ${emp.count > 0 ? 'text-amber-600' : 'text-slate-300'
                                }`}>{emp.count}</p>
                            <p className="text-[9px] font-bold text-slate-400">Jornadas ({emp.pct}% de cobertura)</p>
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
                                <Bar
                                    dataKey="count"
                                    fill="url(#colorAmber)"
                                    radius={[0, 8, 8, 0]}
                                    barSize={14}
                                    style={{ cursor: 'pointer' }}
                                    onClick={(data) => {
                                        if (data && data.name) {
                                            setSelectedEnte(data.name);
                                            setIsStateDrillDownOpen(false);
                                            setIsDrillDownOpen(true);
                                        }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="colorAmber" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <LabelList
                                        dataKey="count"
                                        position="right"
                                        formatter={(v: any) => `${v} j`}
                                        fontSize={10}
                                        fontWeight={900}
                                        fill="#64748b"
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinppalPresence;
