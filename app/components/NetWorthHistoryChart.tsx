"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoryRecord } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

interface NetWorthHistoryChartProps {
    data: HistoryRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-xl">
                <p className="text-slate-400 mb-2 text-xs uppercase tracking-wider">{label}</p>
                <div className="space-y-1">
                    <p className="text-emerald-400 font-mono text-sm">
                        Net Worth: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(payload[0].value / 100)}
                    </p>
                    <p className="text-slate-500 font-mono text-xs">
                        Assets: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(payload[0].payload.totalAssets / 100)}
                    </p>
                    <p className="text-slate-500 font-mono text-xs">
                        Debt: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(payload[0].payload.totalLiabilities / 100)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function NetWorthHistoryChart({ data }: NetWorthHistoryChartProps) {
    // Format data for Recharts
    const chartData = data.map(record => ({
        ...record,
        date: new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }));

    if (data.length < 2) {
        return (
            <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex items-center justify-center text-slate-500 h-64">
                Not enough data history to display chart. Add more changes to see trends.
            </div>
        );
    }

    return (
        <section className="mt-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-medium text-slate-300 mb-8 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500" />
                Net Worth History
            </h2>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            minTickGap={30}
                        />
                        <YAxis
                            hide
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorNetWorth)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
