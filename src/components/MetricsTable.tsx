import { Stock } from '@/types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsTableProps {
    stocks: Stock[];
    onSelectStock: (symbol: string) => void;
    selectedSymbol?: string;
}

export function MetricsTable({ stocks, onSelectStock, selectedSymbol }: MetricsTableProps) {
    const formatNumber = (num: number) => {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        return num.toLocaleString();
    };

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Change</th>
                            <th className="px-4 py-3 text-right">% Change</th>
                            <th className="px-4 py-3 text-right">P/E</th>
                            <th className="px-4 py-3 text-right">Mkt Cap</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {stocks.map((stock) => {
                            const isUp = stock.regularMarketChange >= 0;
                            const isSelected = stock.symbol === selectedSymbol;

                            return (
                                <tr
                                    key={stock.symbol}
                                    onClick={() => onSelectStock(stock.symbol)}
                                    className={cn(
                                        "cursor-pointer transition-colors hover:bg-muted/50",
                                        isSelected && "bg-muted"
                                    )}
                                >
                                    <td className="px-4 py-3 font-medium">
                                        <div>{stock.symbol}</div>
                                        <div className="text-xs text-muted-foreground">{stock.shortName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        ${stock.regularMarketPrice.toFixed(2)}
                                    </td>
                                    <td className={cn("px-4 py-3 text-right font-mono", isUp ? "text-stock-up" : "text-stock-down")}>
                                        <div className="flex items-center justify-end gap-1">
                                            {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                            {Math.abs(stock.regularMarketChange).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className={cn("px-4 py-3 text-right font-mono", isUp ? "text-stock-up" : "text-stock-down")}>
                                        {stock.regularMarketChangePercent.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                        {stock.trailingPE ? stock.trailingPE.toFixed(2) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                        {stock.marketCap ? formatNumber(stock.marketCap) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
