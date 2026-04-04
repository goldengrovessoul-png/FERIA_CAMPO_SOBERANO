/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { MapPin, Home } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LabelList
} from 'recharts';

interface AnalyticsChartsProps {
    comunasByStateData: Record<string, any>[];
    familiasByStateData: Record<string, any>[];
    setSelectedEstado: (estado: string) => void;
    setIsDrillDownOpen: (open: boolean) => void;
    setIsStateDrillDownOpen: (open: boolean) => void;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
    comunasByStateData,
    familiasByStateData,
    setSelectedEstado,
    setIsDrillDownOpen,
    setIsStateDrillDownOpen
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Comunas por Estado */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Comunas por Estado</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distribución territorial de organizaciones</p>
                        </div>
                    </div>
                    <div className="bg-emerald-600 px-6 py-2 rounded-full shadow-lg shadow-emerald-200">
                        <p className="text-white text-[11px] font-black uppercase tracking-widest leading-none">
                            Total: {comunasByStateData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comunasByStateData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEmeraldH" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
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
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                formatter={(value: any) => [value, 'Comunas']}
                            />
                            <Bar 
                                dataKey="value" 
                                fill="url(#colorEmeraldH)" 
                                radius={[0, 12, 12, 0]} 
                                barSize={16}
                                style={{ cursor: 'pointer' }}
                                onClick={(data) => {
                                    if (data && data.name) {
                                        setSelectedEstado(data.name);
                                        setIsDrillDownOpen(false);
                                        setIsStateDrillDownOpen(true);
                                    }
                                }}
                            >
                                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 900, fill: '#059669' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico de Familias por Estado */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Home size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Familias por Estado</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Impacto habitacional y social</p>
                        </div>
                    </div>
                    <div className="bg-indigo-600 px-6 py-2 rounded-full shadow-lg shadow-indigo-200">
                        <p className="text-white text-[11px] font-black uppercase tracking-widest leading-none">
                            Total: {familiasByStateData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={familiasByStateData} layout="vertical" margin={{ left: 10, right: 80, top: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIndigoH" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.6} />
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
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                formatter={(value: any) => [value.toLocaleString(), 'Familias']}
                            />
                            <Bar 
                                dataKey="value" 
                                fill="url(#colorIndigoH)" 
                                radius={[0, 12, 12, 0]} 
                                barSize={16}
                                style={{ cursor: 'pointer' }}
                                onClick={(data) => {
                                    if (data && data.name) {
                                        setSelectedEstado(data.name);
                                        setIsDrillDownOpen(false);
                                        setIsStateDrillDownOpen(true);
                                    }
                                }}
                            >
                                <LabelList dataKey="value" position="right" formatter={(v: any) => v.toLocaleString()} style={{ fontSize: 11, fontWeight: 900, fill: '#4F46E5' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
