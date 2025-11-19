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

interface StockChartProps {
    symbol: string;
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

export function StockChart({ symbol, className }: StockChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('1mo');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/chart?symbol=${symbol}&range=${range}`);
                const json = await res.json();
                if (json.error) throw new Error(json.error);

                // Format date for display
                const formattedData = json.data.map((d: any) => ({
                    ...d,
                    dateStr: new Date(d.date).toLocaleDateString(),
                }));

                setData(formattedData);
            } catch (err) {
                console.error(err);
                setError('Failed to load chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol, range]);

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{symbol} Performance</h3>
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

            <div className="h-[300px] w-full rounded-lg border bg-card p-4">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center text-destructive">
                        {error}
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
                                tickFormatter={(value) => `$${value.toFixed(0)}`}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-popover)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-popover-foreground)',
                                    borderRadius: 'var(--radius)'
                                }}
                                itemStyle={{ color: 'var(--color-primary)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="var(--color-primary)"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
