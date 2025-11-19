import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CorrelationMatrixProps {
    data: any[]; // The formatted data from MultiStockChart (array of points with symbol keys)
    symbols: string[];
    className?: string;
}

// Helper to calculate Pearson correlation
function calculateCorrelation(x: number[], y: number[]) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

export function CorrelationMatrix({ data, symbols, className }: CorrelationMatrixProps) {
    const matrix = useMemo(() => {
        if (!data || data.length === 0 || symbols.length < 2) return [];

        // Extract price arrays for each symbol, ensuring we align by index
        // Data is already sorted by date from the API/Chart component
        const priceArrays: Record<string, number[]> = {};

        symbols.forEach(sym => {
            priceArrays[sym] = [];
        });

        // Only use data points where BOTH symbols exist to be fair? 
        // Or just use all available. Let's use intersection for pairwise.

        const result = [];

        for (let i = 0; i < symbols.length; i++) {
            const row = [];
            for (let j = 0; j < symbols.length; j++) {
                const sym1 = symbols[i];
                const sym2 = symbols[j];

                if (i === j) {
                    row.push(1);
                    continue;
                }

                // Get common data points
                const values1: number[] = [];
                const values2: number[] = [];

                data.forEach(point => {
                    // Check original values (not percentage)
                    const v1 = point.original?.[sym1];
                    const v2 = point.original?.[sym2];

                    if (typeof v1 === 'number' && typeof v2 === 'number') {
                        values1.push(v1);
                        values2.push(v2);
                    }
                });

                row.push(calculateCorrelation(values1, values2));
            }
            result.push({ symbol: symbols[i], values: row });
        }
        return result;
    }, [data, symbols]);

    if (symbols.length < 2) {
        return (
            <div className={cn("w-full rounded-lg border bg-card p-8 text-center text-muted-foreground", className)}>
                Add at least 2 stocks to view correlation.
            </div>
        );
    }

    return (
        <div className={cn("w-full space-y-4", className)}>
            <h3 className="font-semibold text-lg">Correlation Matrix</h3>
            <div className="overflow-x-auto rounded-lg border bg-card p-4">
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {symbols.map(s => (
                                <th key={s} className="p-2 font-medium text-muted-foreground">{s}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={row.symbol}>
                                <td className="p-2 font-medium text-muted-foreground text-right">{row.symbol}</td>
                                {row.values.map((val, j) => {
                                    // Color scale: -1 (blue) to 0 (white/gray) to 1 (red)
                                    // Actually usually: 1 (high corr) = Red/Dark, 0 = Light, -1 = Blue/Inverse
                                    // Let's use: High (>0.7) = Red, Low (<0.3) = Green (Good diversification), Mid = Yellow

                                    let bg = 'bg-secondary';
                                    let text = 'text-foreground';

                                    if (i === j) {
                                        bg = 'bg-secondary/50';
                                        text = 'text-muted-foreground';
                                    } else if (val > 0.8) {
                                        bg = 'bg-red-500/20 text-red-700 dark:text-red-300';
                                    } else if (val > 0.5) {
                                        bg = 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
                                    } else if (val < 0.3 && val > -0.3) {
                                        bg = 'bg-green-500/20 text-green-700 dark:text-green-300'; // Uncorrelated is good
                                    } else if (val < -0.5) {
                                        bg = 'bg-blue-500/20 text-blue-700 dark:text-blue-300'; // Inverse correlation
                                    }

                                    return (
                                        <td key={`${row.symbol}-${j}`} className="p-1">
                                            <div className={cn("flex h-8 w-full items-center justify-center rounded font-mono", bg, text)}>
                                                {val.toFixed(2)}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="mt-2 text-xs text-muted-foreground">
                    * 1.00 = Perfect Correlation (Move together). 0.00 = Uncorrelated. Negative = Inverse.
                    <br />
                    Lower correlation implies better diversification.
                </p>
            </div>
        </div>
    );
}
