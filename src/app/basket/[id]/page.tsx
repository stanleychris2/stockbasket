'use client';

import { useState, useEffect, use } from 'react';
import { useBaskets } from '@/hooks/use-baskets';
import { Stock } from '@/types';
import { MultiStockChart } from '@/components/MultiStockChart';
import { MetricsTable } from '@/components/MetricsTable';
import { FundamentalsChart } from '@/components/FundamentalsChart';
import { CorrelationMatrix } from '@/components/CorrelationMatrix';
import { ArrowLeft, Loader2, Activity, BarChart3, LineChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function BasketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { baskets, isLoaded } = useBaskets();
    const router = useRouter();

    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loadingStocks, setLoadingStocks] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'fundamentals' | 'risk'>('overview');

    const basket = baskets.find((b) => b.id === id);

    useEffect(() => {
        if (isLoaded && !basket) {
            // router.push('/'); 
        }
    }, [isLoaded, basket, router]);

    useEffect(() => {
        if (!basket || basket.items.length === 0) {
            setStocks([]);
            return;
        }

        const fetchQuotes = async () => {
            setLoadingStocks(true);
            try {
                const symbols = basket.items.map(i => i.symbol).join(',');
                const res = await fetch(`/api/quote?symbols=${symbols}`);
                const data = await res.json();
                if (data.stocks) {
                    setStocks(data.stocks);
                    if (!selectedSymbol && data.stocks.length > 0) {
                        setSelectedSymbol(data.stocks[0].symbol);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch quotes', error);
            } finally {
                setLoadingStocks(false);
            }
        };

        fetchQuotes();
    }, [basket]);

    if (!isLoaded) return null;

    if (!basket) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Basket not found</h1>
                <button onClick={() => router.push('/')} className="text-primary hover:underline">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const symbols = basket.items.map(i => i.symbol);

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <button
                        onClick={() => router.push('/')}
                        className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{basket.name}</h1>
                            <p className="text-muted-foreground">{basket.description}</p>
                        </div>
                        <div className="flex space-x-2 bg-secondary rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    activeTab === 'overview' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LineChart className="h-4 w-4" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('fundamentals')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    activeTab === 'fundamentals' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Fundamentals
                            </button>
                            <button
                                onClick={() => setActiveTab('risk')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    activeTab === 'risk' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Activity className="h-4 w-4" />
                                Risk & Correlation
                            </button>
                        </div>
                    </div>
                </div>

                {basket.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        This basket is empty. Add stocks from the dashboard.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Always render chart to keep data loaded for correlation, but hide if not overview? 
                 Actually better to conditionally render but we need data for correlation.
                 Let's render chart in overview, and if risk tab is active, we might need to fetch data again or lift state.
                 MultiStockChart fetches its own data. CorrelationMatrix needs that data.
                 Let's keep MultiStockChart mounted but hidden if not overview? Or just let it fetch.
                 Actually, for simplicity, let's render MultiStockChart in Overview, and if Risk is selected, 
                 we can render a hidden chart or refetch. 
                 Better: Lift state? No, too complex for now.
                 Let's just render MultiStockChart always but hidden? No, that's hacky.
                 Let's just use MultiStockChart in Overview. 
                 For Risk, we'll use a dedicated data fetcher or just reuse MultiStockChart (maybe visible or hidden).
                 Actually, let's just render it in Overview. If user goes to Risk, we show Correlation.
                 Correlation needs data. Let's pass `onDataLoaded` from MultiStockChart.
                 If we unmount MultiStockChart, we lose data.
                 So we should keep it mounted or lift the fetch.
                 Let's keep it mounted and use `display: none` if not active tab to preserve state/data.
             */}

                        <div className={cn("grid gap-8 lg:grid-cols-3", activeTab !== 'overview' && "hidden")}>
                            <div className="lg:col-span-2 space-y-6">
                                <MultiStockChart
                                    symbols={symbols}
                                    onDataLoaded={setChartData}
                                />
                                <div className="space-y-2">
                                    <h2 className="text-lg font-semibold">Holdings</h2>
                                    {loadingStocks ? (
                                        <div className="flex justify-center p-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <MetricsTable
                                            stocks={stocks}
                                            onSelectStock={setSelectedSymbol}
                                            selectedSymbol={selectedSymbol || undefined}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="rounded-lg border bg-card p-6 shadow-sm">
                                    <h3 className="font-semibold mb-4">Basket Summary</h3>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Items</span>
                                            <span className="font-medium">{basket.items.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Created</span>
                                            <span className="font-medium">{new Date(basket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'fundamentals' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <FundamentalsChart stocks={stocks} />
                                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {stocks.map(stock => (
                                        <div key={stock.symbol} className="rounded-lg border bg-card p-4">
                                            <div className="text-sm font-medium text-muted-foreground">{stock.symbol}</div>
                                            <div className="mt-2 text-2xl font-bold">{stock.regularMarketPrice.toFixed(2)}</div>
                                            <div className={cn("text-xs font-medium", stock.regularMarketChange >= 0 ? "text-stock-up" : "text-stock-down")}>
                                                {stock.regularMarketChange >= 0 ? '+' : ''}{stock.regularMarketChangePercent.toFixed(2)}%
                                            </div>
                                            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                                                <div className="flex justify-between"><span>Mkt Cap</span> <span>{stock.marketCap ? (stock.marketCap / 1e9).toFixed(2) + 'B' : '-'}</span></div>
                                                <div className="flex justify-between"><span>P/E</span> <span>{stock.trailingPE?.toFixed(2) || '-'}</span></div>
                                                <div className="flex justify-between"><span>PEG</span> <span>{stock.pegRatio?.toFixed(2) || '-'}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'risk' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                <div className="grid gap-8 lg:grid-cols-2">
                                    <CorrelationMatrix
                                        data={chartData}
                                        symbols={symbols}
                                    />
                                    <div className="rounded-lg border bg-card p-6">
                                        <h3 className="font-semibold mb-4">Risk Analysis</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Correlation measures how stocks move in relation to each other.
                                        </p>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-start gap-2">
                                                <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                                                <span><strong>High Correlation (&gt; 0.7):</strong> Stocks move together. Low diversification benefit.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                                                <span><strong>Low Correlation (&lt; 0.3):</strong> Stocks move independently. Good for diversification.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                                <span><strong>Negative Correlation (&lt; 0):</strong> Stocks move in opposite directions. Excellent hedge.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
