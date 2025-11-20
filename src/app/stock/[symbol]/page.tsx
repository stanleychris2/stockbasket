'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Newspaper, Building2, DollarSign, Activity } from 'lucide-react';
import { MultiStockChart } from '@/components/MultiStockChart';
import { cn } from '@/lib/utils';

interface StockDetails {
    price: any;
    summaryProfile: any;
    summaryDetail: any;
    defaultKeyStatistics: any;
    financialData: any;
    news: any[];
}

export default function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = use(params);
    const decodedSymbol = decodeURIComponent(symbol).toUpperCase();

    const [data, setData] = useState<StockDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/stock-details?symbol=${decodedSymbol}`);
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                setData(json.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load stock details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [decodedSymbol]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="text-destructive text-lg">{error || 'Stock not found'}</div>
                <Link href="/" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    const { price, summaryProfile, summaryDetail, defaultKeyStatistics, financialData, news } = data;
    const isPositive = price?.regularMarketChangePercent >= 0;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 w-fit transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-bold tracking-tight">{decodedSymbol}</h1>
                                <span className="text-xl text-muted-foreground font-medium">{price?.shortName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {summaryProfile?.sector}</span>
                                <span>•</span>
                                <span>{summaryProfile?.industry}</span>
                                <span>•</span>
                                <span>{summaryProfile?.country}</span>
                            </div>
                            <div className="mt-3">
                                <Link
                                    href={`/options/${decodedSymbol}`}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                                >
                                    View Options
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="text-4xl font-bold font-mono">
                                ${price?.regularMarketPrice?.toFixed(2)}
                            </div>
                            <div className={cn("flex items-center gap-2 text-lg font-medium", isPositive ? "text-green-500" : "text-red-500")}>
                                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                {isPositive ? '+' : ''}{price?.regularMarketChange?.toFixed(2)} ({isPositive ? '+' : ''}{price?.regularMarketChangePercent?.toFixed(2)}%)
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                At Close: {new Date(price?.regularMarketTime).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Chart & Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Chart */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5" /> Performance
                            </h2>
                            <MultiStockChart symbols={[decodedSymbol]} className="h-[400px]" />
                        </section>

                        {/* Key Stats */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <DollarSign className="h-5 w-5" /> Key Statistics
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="Market Cap" value={formatLargeNumber(price?.marketCap)} />
                                <StatCard label="P/E Ratio" value={summaryDetail?.trailingPE?.toFixed(2)} />
                                <StatCard label="Forward P/E" value={summaryDetail?.forwardPE?.toFixed(2)} />
                                <StatCard label="EPS (TTM)" value={defaultKeyStatistics?.trailingEps?.toFixed(2)} />
                                <StatCard label="Beta" value={summaryDetail?.beta?.toFixed(2)} />
                                <StatCard label="Div Yield" value={summaryDetail?.dividendYield ? `${(summaryDetail.dividendYield * 100).toFixed(2)}%` : '-'} />
                                <StatCard label="52W High" value={summaryDetail?.fiftyTwoWeekHigh?.toFixed(2)} />
                                <StatCard label="52W Low" value={summaryDetail?.fiftyTwoWeekLow?.toFixed(2)} />
                            </div>
                        </section>

                        {/* Company Profile */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5" /> About {price?.shortName}
                            </h2>
                            <div className="bg-card border rounded-lg p-6 text-muted-foreground leading-relaxed">
                                {summaryProfile?.longBusinessSummary}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: News */}
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Newspaper className="h-5 w-5" /> Latest News
                            </h2>
                            <div className="space-y-4">
                                {news?.map((item: any) => (
                                    <a
                                        key={item.uuid}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                                    >
                                        {item.thumbnail?.resolutions?.[0]?.url && (
                                            <div className="h-32 w-full overflow-hidden">
                                                <img
                                                    src={item.thumbnail.resolutions[0].url}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                                                <span>{item.publisher}</span>
                                                <span>{new Date(item.providerPublishTime * 1000).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </a>
                                ))}
                                {(!news || news.length === 0) && (
                                    <div className="text-muted-foreground text-sm">No recent news found.</div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string, value: string | number | undefined }) {
    return (
        <div className="bg-card border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="font-semibold text-lg">{value || '-'}</div>
        </div>
    );
}

function formatLargeNumber(num: number) {
    if (!num) return '-';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}
