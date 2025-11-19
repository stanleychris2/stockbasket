import { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Loader2, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiStockChartProps {
    symbols: string[];
    className?: string;
    onDataLoaded?: (data: any[]) => void;
}

const RANGES = [
    { label: '1W', value: '1w' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' },
];

const COLORS = [
    '#2563eb', // Blue 600
    '#dc2626', // Red 600
    '#16a34a', // Green 600
    '#d97706', // Amber 600
    '#9333ea', // Purple 600
    '#0891b2', // Cyan 600
    '#db2777', // Pink 600
    '#4f46e5', // Indigo 600
];

export function MultiStockChart({ symbols, className, onDataLoaded }: MultiStockChartProps) {
    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('1mo');
    const [mode, setMode] = useState<'percent' | 'price'>('percent');
    const [error, setError] = useState('');

    useEffect(() => {
        if (symbols.length === 0) {
            setRawData([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const symbolsStr = symbols.join(',');
                const res = await fetch(`/api/chart?symbols=${symbolsStr}&range=${range}`);
                const json = await res.json();
                if (json.error) throw new Error(json.error);

                setRawData(json.data);
                onDataLoaded?.(json.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbols.join(','), range]);

    const data = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        if (mode === 'price') {
            return rawData.map((d: any) => ({
                ...d,
                dateStr: new Date(d.date).toLocaleDateString(),
            }));
        }

        // Percent mode
        const baseValues: Record<string, number> = {};
        for (const point of rawData) {
            for (const sym of symbols) {
                if (baseValues[sym] === undefined && point[sym] !== undefined && point[sym] !== null) {
                    baseValues[sym] = point[sym];
                }
            }
        }

        return rawData.map((d: any) => {
            const point: any = {
                dateStr: new Date(d.date).toLocaleDateString(),
                original: { ...d }
            };
            symbols.forEach(sym => {
                if (d[sym] !== undefined && d[sym] !== null && baseValues[sym]) {
                    point[sym] = ((d[sym] - baseValues[sym]) / baseValues[sym]) * 100;
                } else {
                    point[sym] = null;
                }
            });
            return point;
        });
    }, [rawData, mode, symbols]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-popover p-3 shadow-md text-popover-foreground text-sm">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-medium">{entry.name}:</span>
                            <span>
                                {mode === 'price' ? '$' : ''}
                                {entry.value?.toFixed(2)}
                                {mode === 'percent' ? '%' : ''}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                        {mode === 'percent' ? 'Performance (%)' : 'Share Price ($)'}
                    </h3>
                    <div className="flex bg-secondary rounded-md p-0.5">
                        <button
                            onClick={() => setMode('percent')}
                            className={cn(
                                "p-1.5 rounded-sm transition-all",
                                mode === 'percent' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Percentage Change"
                        >
                            <Percent className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setMode('price')}
                            className={cn(
                                "p-1.5 rounded-sm transition-all",
                                mode === 'price' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Share Price"
                        >
                            <DollarSign className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex space-x-1 bg-secondary rounded-md p-1 overflow-x-auto">
                    {RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={cn(
                                "px-2 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap",
                                range === r.value
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full rounded-lg border bg-card p-4">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center text-destructive">
                        {error}
                    </div>
                ) : symbols.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Add stocks to view performance
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis
                                dataKey="dateStr"
                                stroke="var(--color-muted-foreground)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="var(--color-muted-foreground)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) =>
                                    mode === 'percent'
                                        ? `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
                                        : `$${value.toFixed(0)}`
                                }
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {symbols.map((sym, index) => (
                                <Line
                                    key={sym}
                                    type="linear"
                                    dataKey={sym}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
