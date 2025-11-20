'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { OptionsChain } from '@/components/OptionsChain';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function OptionsPage() {
    const params = useParams();
    const symbol = params.symbol as string;
    const [stockData, setStockData] = useState<any>(null);

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                const res = await fetch(`/api/quote?symbols=${symbol}`);
                const data = await res.json();
                if (data.stocks && data.stocks.length > 0) {
                    setStockData(data.stocks[0]);
                }
            } catch (error) {
                console.error('Failed to fetch stock data:', error);
            }
        };

        fetchStockData();
    }, [symbol]);

    const changePositive = stockData?.regularMarketChange >= 0;

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={`/stock/${symbol}`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {symbol}
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight">
                                {symbol} Options
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {stockData?.longName || stockData?.shortName || 'Loading...'}
                            </p>
                        </div>

                        {stockData && (
                            <div className="text-right">
                                <div className="text-3xl font-bold font-mono">
                                    ${stockData.regularMarketPrice?.toFixed(2)}
                                </div>
                                <div className={cn(
                                    "text-lg font-semibold flex items-center justify-end gap-2",
                                    changePositive ? "text-green-500" : "text-red-500"
                                )}>
                                    {changePositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                    {changePositive ? '+' : ''}{stockData.regularMarketChange?.toFixed(2)}
                                    ({changePositive ? '+' : ''}{stockData.regularMarketChangePercent?.toFixed(2)}%)
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Underlying Stock Price
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Options Chain */}
                <div className="bg-card border-2 rounded-lg p-6">
                    <OptionsChain ticker={symbol} />
                </div>

                {/* Info Footer */}
                <div className="mt-8 p-4 border rounded-lg bg-secondary/10">
                    <p className="text-sm text-muted-foreground">
                        <strong>Options Trading:</strong> Options are complex instruments and carry a high level of risk.
                        Greeks (Delta, Gamma, Theta, Vega) help measure various risks. ITM = In The Money,
                        ATM = At The Money, OTM = Out of The Money. Data provided by Massive.com.
                    </p>
                </div>
            </div>
        </main>
    );
}
