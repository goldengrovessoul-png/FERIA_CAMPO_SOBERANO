/* eslint-disable @typescript-eslint/no-explicit-any */
import { Award, Leaf, Star } from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Tooltip, Cell,
    BarChart, CartesianGrid, XAxis, YAxis, Bar, LabelList
} from 'recharts';

interface CriticalProduceProps {
    proteinPresenceStats: any;
    hortalizasPresenceStats: any;
    frutasPresenceStats: any;
}

const CriticalProduceSection = ({
    proteinPresenceStats,
    hortalizasPresenceStats,
    frutasPresenceStats
}: CriticalProduceProps) => {
    const categories = [
        {
            title: 'Sostenibilidad de Proteína Animal',
            stats: proteinPresenceStats,
            color: '#F59E0B',
            lightColor: '#FEF3C7',
            icon: <Award size={22} />
        },
        {
            title: 'Sostenibilidad de Hortalizas y Verduras',
            stats: hortalizasPresenceStats,
            color: '#84CC16',
            lightColor: '#F7FEE7',
            icon: <Leaf size={22} />
        },
        {
            title: 'Sostenibilidad de Frutas',
            stats: frutasPresenceStats,
            color: '#EC4899',
            lightColor: '#FDF2F8',
            icon: <Star size={22} />
        }
    ];

    return (
        <div className="lg:col-span-12 space-y-8">
            {categories.map((category, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: category.lightColor, color: category.color }}>
                            {category.icon}
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">{category.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Presente en {category.stats.presenceCount} de {category.stats.total} jornadas (corresponde al {category.stats.pct}% del total)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 flex flex-col items-center justify-center">
                            <div className="h-[240px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={category.stats.globalChartData}
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={6}
                                        >
                                            {category.stats.globalChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [value, 'Jornadas']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter" style={{ color: category.color }}>
                                        {category.stats.presenceCount}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Jornadas SI</span>
                                </div>
                            </div>
                            <div className="flex gap-6 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SI ({category.stats.presenceCount})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">NO ({category.stats.absenceCount})</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Presencia Efectiva por Entidad Federal (Monto Numérico)</p>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={category.stats.stateChartData} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={140}
                                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                            interval={0}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none' }}
                                            formatter={(value: any) => [value, 'Jornadas con Presencia']}
                                        />
                                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={12}>
                                            {category.stats.stateChartData.map((entry: any, index: number) => {
                                                const maxVal = Math.max(...category.stats.stateChartData.map((d: any) => d.value)) || 1;
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={category.color}
                                                        fillOpacity={0.1 + (0.9 * (entry.value / maxVal))}
                                                    />
                                                );
                                            })}
                                            <LabelList
                                                dataKey="value"
                                                position="right"
                                                style={{ fontSize: 10, fontWeight: 900, fill: category.color }}
                                                formatter={(v: any) => v > 0 ? v : ''}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CriticalProduceSection;
