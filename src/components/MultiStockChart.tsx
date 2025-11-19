import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiStockChartProps {
    symbols: string[];
    className?: string;
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

export function MultiStockChart({ symbols, className }: MultiStockChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('1mo');
    const [error, setError] = useState('');

    useEffect(() => {
        if (symbols.length === 0) {
            setData([]);
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

                const rawData = json.data;

                // Normalize to percentage change
                // Find first valid price for each symbol to use as base
                const baseValues: Record<string, number> = {};

                // Iterate through data to find first non-null value for each symbol
                for (const point of rawData) {
                    for (const sym of symbols) {
                        if (baseValues[sym] === undefined && point[sym] !== undefined && point[sym] !== null) {
                            baseValues[sym] = point[sym];
                        }
                    }
                }

                const formattedData = rawData.map((d: any) => {
                    const point: any = {
                        dateStr: new Date(d.date).toLocaleDateString(),
                        original: { ...d } // Keep original values for tooltip if needed
                    };

                    symbols.forEach(sym => {
                        if (d[sym] !== undefined && d[sym] !== null && baseValues[sym]) {
                            // Calculate percentage change: ((current - base) / base) * 100
                            point[sym] = ((d[sym] - baseValues[sym]) / baseValues[sym]) * 100;
                        } else {
                            point[sym] = null;
                        }
                    });

                    return point;
                });

                setData(formattedData);
            } catch (err) {
                console.error(err);
                setError('Failed to load chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbols, range]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-popover p-3 shadow-md text-popover-foreground text-sm">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-medium">{entry.name}:</span>
                            <span>{entry.value?.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Performance Comparison (%)</h3>
                <div className="flex space-x-1 bg-secondary rounded-md p-1">
                    {RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={cn(
                                "px-2 py-1 text-xs font-medium rounded-sm transition-colors",
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
                                tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {symbols.map((sym, index) => (
                                <Line
                                    key={sym}
                                    type="linear" // Linear interpolation for professional look
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
