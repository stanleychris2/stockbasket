'use client';

import { useState, useEffect, use } from 'react';
import { useBaskets } from '@/hooks/use-baskets';
import { Stock } from '@/types';
import { MultiStockChart } from '@/components/MultiStockChart';
import { MetricsTable } from '@/components/MetricsTable';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BasketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { baskets, isLoaded } = useBaskets();
    const router = useRouter();

    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loadingStocks, setLoadingStocks] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    const basket = baskets.find((b) => b.id === id);

    useEffect(() => {
        if (isLoaded && !basket) {
            // Redirect if not found
            // router.push('/'); // Let's show a message instead to avoid flash
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
    }, [basket]); // Re-fetch if basket items change (e.g. added/removed)

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
                    <h1 className="text-3xl font-bold tracking-tight">{basket.name}</h1>
                    <p className="text-muted-foreground">{basket.description}</p>
                </div>

                {basket.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        This basket is empty. Add stocks from the dashboard.
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            {basket.items.length > 0 ? (
                                <MultiStockChart symbols={basket.items.map(i => i.symbol)} />
                            ) : (
                                <div className="h-[300px] flex items-center justify-center border rounded-lg bg-card text-muted-foreground">
                                    Add stocks to view chart
                                </div>
                            )}

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
                )}
            </div>
        </main>
    );
}
