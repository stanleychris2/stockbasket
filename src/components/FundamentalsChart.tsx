import { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Stock } from '@/types';
import { cn } from '@/lib/utils';

interface FundamentalsChartProps {
    stocks: Stock[];
    className?: string;
}

const METRICS = [
    { label: 'P/E Ratio', value: 'trailingPE', format: (v: number) => v.toFixed(2) },
    { label: 'PEG Ratio', value: 'pegRatio', format: (v: number) => v.toFixed(2) },
    { label: 'Price/Book', value: 'priceToBook', format: (v: number) => v.toFixed(2) },
    { label: 'Div Yield %', value: 'dividendYield', format: (v: number) => (v * 100).toFixed(2) + '%' },
    { label: 'Beta', value: 'beta', format: (v: number) => v.toFixed(2) },
];

export function FundamentalsChart({ stocks, className }: FundamentalsChartProps) {
    const [metric, setMetric] = useState(METRICS[0]);

    const data = stocks.map(s => ({
        symbol: s.symbol,
        value: (s as any)[metric.value] || 0,
        fullStock: s
    })).filter(d => d.value !== 0); // Filter out missing data

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Fundamentals Comparison</h3>
                <div className="flex space-x-1 bg-secondary rounded-md p-1 overflow-x-auto">
                    {METRICS.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => setMetric(m)}
                            className={cn(
                                "px-2 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
                                metric.value === m.value
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full rounded-lg border bg-card p-4">
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No data available for {metric.label}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="symbol"
                                type="category"
                                stroke="var(--color-foreground)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--color-accent)', opacity: 0.2 }}
                                contentStyle={{
                                    backgroundColor: 'var(--color-popover)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-popover-foreground)',
                                    borderRadius: 'var(--radius)'
                                }}
                                formatter={(value: number) => [metric.format(value), metric.label]}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="var(--color-primary)" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
