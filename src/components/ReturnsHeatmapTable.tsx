import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnsHeatmapTableProps {
    symbols: string[];
    className?: string;
}

const TIMEFRAMES = [
    { label: '1D', days: 1 },
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '9M', days: 270 },
    { label: '1Y', days: 365 },
    { label: '1.5Y', days: 547 },
    { label: '2Y', days: 730 },
    { label: '3Y', days: 1095 },
    { label: '4Y', days: 1460 },
    { label: '5Y', days: 1825 },
];

export function ReturnsHeatmapTable({ symbols, className }: ReturnsHeatmapTableProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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
                // Fetch 5y data to cover all ranges
                const res = await fetch(`/api/chart?symbols=${symbolsStr}&range=5y`);
                const json = await res.json();
                if (json.error) throw new Error(json.error);

                setData(json.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load historical data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbols.join(',')]);

    const tableData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Data is sorted by date ascending (oldest to newest)

        const result = symbols.map(sym => {
            const row: any = { symbol: sym };

            // Get current price (last available data point for this symbol)
            let currentPrice = 0;
            let currentDate = new Date();

            // Iterate backwards to find the latest valid price for this symbol
            for (let i = data.length - 1; i >= 0; i--) {
                if (data[i][sym] !== undefined && data[i][sym] !== null) {
                    currentPrice = data[i][sym];
                    currentDate = new Date(data[i].date);
                    break;
                }
            }

            row.currentPrice = currentPrice;

            if (!currentPrice) return row; // No data

            TIMEFRAMES.forEach(tf => {
                const targetDate = new Date(currentDate);
                targetDate.setDate(targetDate.getDate() - tf.days);

                let pastPoint = null;

                for (let i = data.length - 1; i >= 0; i--) {
                    const pointDate = new Date(data[i].date);
                    if (pointDate <= targetDate) {
                        if (data[i][sym] !== undefined && data[i][sym] !== null) {
                            pastPoint = data[i];
                            break;
                        }
                    }
                }

                const MAX_GAP_DAYS = 10;
                const MAX_GAP_MS = MAX_GAP_DAYS * 24 * 60 * 60 * 1000;

                if (pastPoint) {
                    const pastDate = new Date(pastPoint.date);
                    const diff = Math.abs(targetDate.getTime() - pastDate.getTime());

                    if (diff <= MAX_GAP_MS) {
                        const pastPrice = pastPoint[sym];
                        const ret = ((currentPrice - pastPrice) / pastPrice) * 100;
                        row[tf.label] = ret;
                    } else {
                        row[tf.label] = null;
                    }
                } else {
                    row[tf.label] = null;
                }
            });

            return row;
        });

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = sortConfig.key === 'symbol' ? a.symbol : sortConfig.key === 'currentPrice' ? a.currentPrice : a[sortConfig.key];
                const bValue = sortConfig.key === 'symbol' ? b.symbol : sortConfig.key === 'currentPrice' ? b.currentPrice : b[sortConfig.key];

                if (aValue === null && bValue === null) return 0;
                if (aValue === null) return 1; // Nulls last
                if (bValue === null) return -1;

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, symbols, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' }; // Default to desc for returns (highest first)
        });
    };

    const getCellColor = (value: number | null) => {
        if (value === null || value === undefined) return 'bg-secondary/30 text-muted-foreground';

        if (value > 0) {
            if (value > 50) return 'bg-green-600 text-white font-bold shadow-sm';
            if (value > 20) return 'bg-green-500 text-white font-medium';
            if (value > 10) return 'bg-green-500/70 text-white';
            if (value > 5) return 'bg-green-500/40 text-green-900 dark:text-green-100 font-medium';
            return 'bg-green-500/20 text-green-800 dark:text-green-200';
        } else if (value < 0) {
            if (value < -50) return 'bg-red-600 text-white font-bold shadow-sm';
            if (value < -20) return 'bg-red-500 text-white font-medium';
            if (value < -10) return 'bg-red-500/70 text-white';
            if (value < -5) return 'bg-red-500/40 text-red-900 dark:text-red-100 font-medium';
            return 'bg-red-500/20 text-red-800 dark:text-red-200';
        }

        return 'bg-secondary/50 text-muted-foreground';
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
    };

    return (
        <div className={cn("w-full space-y-4", className)}>
            <h3 className="font-semibold text-lg">Returns Heatmap</h3>

            {loading ? (
                <div className="flex h-[300px] items-center justify-center border rounded-lg bg-card">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="flex h-[300px] items-center justify-center border rounded-lg bg-card text-destructive">
                    {error}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-secondary/50">
                                <th
                                    className="p-3 text-left font-medium cursor-pointer hover:bg-secondary transition-colors group"
                                    onClick={() => handleSort('symbol')}
                                >
                                    <div className="flex items-center gap-1">Symbol <SortIcon columnKey="symbol" /></div>
                                </th>
                                <th
                                    className="p-3 text-right font-medium cursor-pointer hover:bg-secondary transition-colors group"
                                    onClick={() => handleSort('currentPrice')}
                                >
                                    <div className="flex items-center justify-end gap-1">Price <SortIcon columnKey="currentPrice" /></div>
                                </th>
                                {TIMEFRAMES.map(tf => (
                                    <th
                                        key={tf.label}
                                        className="p-3 text-center font-medium min-w-[60px] cursor-pointer hover:bg-secondary transition-colors group"
                                        onClick={() => handleSort(tf.label)}
                                    >
                                        <div className="flex items-center justify-center gap-1">{tf.label} <SortIcon columnKey={tf.label} /></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row) => (
                                <tr key={row.symbol} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                                    <td className="p-3 font-semibold">
                                        <Link href={`/stock/${row.symbol}`} className="hover:text-primary hover:underline">
                                            {row.symbol}
                                        </Link>
                                    </td>
                                    <td className="p-3 text-right">${row.currentPrice?.toFixed(2)}</td>
                                    {TIMEFRAMES.map(tf => {
                                        const value = row[tf.label];
                                        const investedAmount = 1000;
                                        const currentValue = value !== null ? investedAmount * (1 + value / 100) : 0;
                                        const profit = currentValue - investedAmount;

                                        return (
                                            <td key={tf.label} className="p-1">
                                                <div className="group relative flex h-8 w-full items-center justify-center">
                                                    <div className={cn(
                                                        "flex h-full w-full items-center justify-center rounded text-xs cursor-help",
                                                        getCellColor(value)
                                                    )}>
                                                        {value !== null ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : '-'}
                                                    </div>

                                                    {/* Tooltip */}
                                                    {value !== null && (
                                                        <div className="absolute bottom-full mb-2 hidden w-48 flex-col gap-1 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-md group-hover:flex z-50">
                                                            <div className="font-semibold border-b pb-1 mb-1">
                                                                {tf.label} Return
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">If you invested:</span> <span className="font-medium">$1,000</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Current Value:</span> <span className="font-bold">${currentValue.toFixed(2)}</span>
                                                            </div>
                                                            <div className={cn("font-medium", profit >= 0 ? "text-green-500" : "text-red-500")}>
                                                                {profit >= 0 ? '+' : ''}${profit.toFixed(2)} ({value.toFixed(1)}%)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
