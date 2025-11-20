import { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Brush
} from 'recharts';
import { Loader2, DollarSign, Percent, Calendar, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
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
    { label: 'Custom', value: 'custom' },
];

const COLORS = [
    '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777', '#4f46e5',
    '#ca8a04', '#65a30d', '#059669', '#0d9488', '#0284c7', '#7c3aed', '#c026d3', '#e11d48'
];

export function MultiStockChart({ symbols, className, onDataLoaded }: MultiStockChartProps) {
    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('1mo');
    const [mode, setMode] = useState<'percent' | 'price'>('percent');
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // UX State
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [visibleSymbols, setVisibleSymbols] = useState<Set<string>>(new Set());

    // Initialize visible symbols when symbols prop changes
    useEffect(() => {
        setVisibleSymbols(new Set(symbols));
    }, [symbols.join(',')]);

    useEffect(() => {
        if (symbols.length === 0) {
            setRawData([]);
            setLoading(false);
            return;
        }

        if (range === 'custom' && (!startDate || !endDate)) return;

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const symbolsStr = symbols.join(',');
                let url = `/api/chart?symbols=${symbolsStr}&range=${range}`;
                if (range === 'custom') {
                    url = `/api/chart?symbols=${symbolsStr}&from=${startDate}&to=${endDate}`;
                }

                const res = await fetch(url);
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
    }, [symbols.join(','), range, startDate, endDate]);

    const data = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        if (mode === 'price') {
            return rawData.map((d: any) => ({
                ...d,
                dateStr: new Date(d.date).toLocaleDateString(),
            }));
        }

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

    const toggleSymbol = (sym: string) => {
        const newSet = new Set(visibleSymbols);
        if (newSet.has(sym)) {
            newSet.delete(sym);
        } else {
            newSet.add(sym);
        }
        setVisibleSymbols(newSet);
    };

    const toggleAll = () => {
        if (visibleSymbols.size === symbols.length) {
            setVisibleSymbols(new Set());
        } else {
            setVisibleSymbols(new Set(symbols));
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Sort payload by value descending
            const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

            return (
                <div className="rounded-lg border bg-popover p-3 shadow-md text-popover-foreground text-sm max-h-[300px] overflow-y-auto">
                    <p className="font-medium mb-2 sticky top-0 bg-popover pb-1 border-b">{label}</p>
                    <div className="space-y-1">
                        {sortedPayload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="font-medium">{entry.name}:</span>
                                </div>
                                <span className="font-mono">
                                    {mode === 'price' ? '$' : ''}
                                    {entry.value?.toFixed(2)}
                                    {mode === 'percent' ? '%' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const ChartContent = () => (
        <div className="flex flex-col h-full">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 p-4 pb-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                            {mode === 'percent' ? 'Performance (%)' : 'Share Price ($)'}
                        </h3>
                        <div className="flex bg-secondary rounded-md p-0.5">
                            <button onClick={() => setMode('percent')} className={cn("p-1.5 rounded-sm transition-all", mode === 'percent' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} title="Percentage Change"><Percent className="h-4 w-4" /></button>
                            <button onClick={() => setMode('price')} className={cn("p-1.5 rounded-sm transition-all", mode === 'price' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} title="Share Price"><DollarSign className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-secondary rounded-md transition-colors" title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex space-x-1 bg-secondary rounded-md p-1 overflow-x-auto">
                        {RANGES.map((r) => (
                            <button key={r.value} onClick={() => setRange(r.value)} className={cn("px-2 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap", range === r.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{r.label}</button>
                        ))}
                    </div>
                    {range === 'custom' && (
                        <div className="flex items-center gap-2 bg-card border rounded-lg p-1 px-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs border-none focus:ring-0 p-0" />
                            <span className="text-muted-foreground">-</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs border-none focus:ring-0 p-0" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 min-h-0 gap-4 p-4 pt-0">
                {/* Chart Area */}
                <div className="flex-1 min-w-0 rounded-lg border bg-card p-1 relative">
                    {loading ? (
                        <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center text-destructive">{error}</div>
                    ) : symbols.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">Add stocks to view performance</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis dataKey="dateStr" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => mode === 'percent' ? `${value > 0 ? '+' : ''}${value.toFixed(0)}%` : `$${value.toFixed(0)}`} domain={['auto', 'auto']} />
                                <Tooltip content={<CustomTooltip />} />
                                <Brush dataKey="dateStr" height={30} stroke="var(--color-primary)" fill="var(--color-card)" tickFormatter={() => ''} />
                                {symbols.map((sym, index) => (
                                    visibleSymbols.has(sym) && (
                                        <Line
                                            key={sym}
                                            type="linear"
                                            dataKey={sym}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4, strokeWidth: 0 }}
                                            connectNulls
                                            isAnimationActive={false}
                                        />
                                    )
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Side Legend */}
                <div className="w-48 flex flex-col border rounded-lg bg-card overflow-hidden shrink-0">
                    <div className="p-2 border-b bg-secondary/30 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Stocks ({visibleSymbols.size}/{symbols.length})</span>
                        <button onClick={toggleAll} className="text-xs text-primary hover:underline" title={visibleSymbols.size === symbols.length ? "Hide All" : "Show All"}>
                            {visibleSymbols.size === symbols.length ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {symbols.map((sym, index) => (
                            <button
                                key={sym}
                                onClick={() => toggleSymbol(sym)}
                                className={cn(
                                    "flex items-center gap-2 w-full p-1.5 rounded-md text-xs transition-colors hover:bg-secondary/50",
                                    !visibleSymbols.has(sym) && "opacity-50 grayscale"
                                )}
                            >
                                <div
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium truncate">{sym}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background animate-in fade-in duration-200">
                <ChartContent />
            </div>
        );
    }

    return (
        <div className={cn("w-full h-[500px] border rounded-lg bg-card overflow-hidden", className)}>
            <ChartContent />
        </div>
    );
}
