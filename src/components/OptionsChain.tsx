'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Volume2, Eye } from 'lucide-react';
import type { OptionsChainSnapshot, OptionsContract, StrikeGroup, ExpirationGroup } from '@/types/options';
import { cn } from '@/lib/utils';

interface OptionsChainProps {
    ticker: string;
}

export function OptionsChain({ ticker }: OptionsChainProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chainData, setChainData] = useState<OptionsChainSnapshot | null>(null);

    // Filters
    const [selectedExpiration, setSelectedExpiration] = useState<string | null>(null);
    const [showITM, setShowITM] = useState(true);
    const [showOTM, setShowOTM] = useState(true);
    const [showATM, setShowATM] = useState(true);
    const [minVolume, setMinVolume] = useState(0);

    // Fetch options chain data
    useEffect(() => {
        const fetchChain = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/options/chain?ticker=${ticker}`);
                const result = await response.json();

                if (!result.success) {
                    setError(result.error || 'Failed to load options chain');
                    return;
                }

                setChainData(result.data);

                // Auto-select nearest expiration
                if (result.data?.contracts.length > 0) {
                    const expirations = Array.from(
                        new Set(result.data.contracts.map((c: OptionsContract) => c.expiration_date))
                    ).sort();
                    setSelectedExpiration(expirations[0] as string);
                }
            } catch (err) {
                setError('Failed to fetch options data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchChain();
    }, [ticker]);

    // Organize contracts by expiration
    const expirationGroups = useMemo(() => {
        if (!chainData) return [];

        const groups = new Map<string, ExpirationGroup>();

        chainData.contracts.forEach(contract => {
            const exp = contract.expiration_date;
            if (!groups.has(exp)) {
                const daysToExp = Math.floor(
                    (new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                groups.set(exp, {
                    expiration_date: exp,
                    days_to_expiration: daysToExp,
                    calls: [],
                    puts: [],
                });
            }

            const group = groups.get(exp)!;
            if (contract.contract_type === 'call') {
                group.calls.push(contract);
            } else {
                group.puts.push(contract);
            }
        });

        return Array.from(groups.values()).sort(
            (a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
        );
    }, [chainData]);

    // Organize by strike for selected expiration
    const strikeGroups = useMemo(() => {
        if (!selectedExpiration || !chainData) return [];

        const selectedGroup = expirationGroups.find(g => g.expiration_date === selectedExpiration);
        if (!selectedGroup) return [];

        const strikes = new Map<number, StrikeGroup>();

        selectedGroup.calls.forEach(call => {
            if (!strikes.has(call.strike_price)) {
                strikes.set(call.strike_price, { strike: call.strike_price });
            }
            strikes.get(call.strike_price)!.call = call;
        });

        selectedGroup.puts.forEach(put => {
            if (!strikes.has(put.strike_price)) {
                strikes.set(put.strike_price, { strike: put.strike_price });
            }
            strikes.get(put.strike_price)!.put = put;
        });

        return Array.from(strikes.values()).sort((a, b) => a.strike - b.strike);
    }, [selectedExpiration, chainData, expirationGroups]);

    // Filter strikes based on moneyness and volume
    const filteredStrikes = useMemo(() => {
        if (!chainData) return [];

        const underlyingPrice = chainData.underlying.price;

        return strikeGroups.filter(group => {
            // Check moneyness
            const isATM = Math.abs(group.strike - underlyingPrice) / underlyingPrice < 0.05; // Within 5%
            const isCallITM = group.strike < underlyingPrice;
            const isPutITM = group.strike > underlyingPrice;
            const isITM = isCallITM || isPutITM;
            const isOTM = !isITM && !isATM;

            if (isATM && !showATM) return false;
            if (isITM && !showITM) return false;
            if (isOTM && !showOTM) return false;

            // Check volume
            const callVolume = group.call?.volume || 0;
            const putVolume = group.put?.volume || 0;
            const maxVolume = Math.max(callVolume, putVolume);

            if (maxVolume < minVolume) return false;

            return true;
        });
    }, [strikeGroups, chainData, showATM, showITM, showOTM, minVolume]);

    const handleContractClick = (contract: OptionsContract) => {
        router.push(`/options/${ticker}/contract/${encodeURIComponent(contract.ticker)}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading options chain...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border-2 border-destructive/50 rounded-lg p-8 text-center">
                <p className="text-destructive font-semibold mb-2">Error loading options chain</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    if (!chainData || expirationGroups.length === 0) {
        return (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                No options data available for {ticker}
            </div>
        );
    }

    const underlyingPrice = chainData.underlying.price;

    return (
        <div className="space-y-4">
            {/* Filters and Controls */}
            <div className="border rounded-lg p-4 bg-secondary/10 space-y-4">
                {/* Expiration Selector */}
                <div>
                    <label className="text-sm font-semibold mb-2 block">Expiration Date</label>
                    <div className="flex gap-2 flex-wrap">
                        {expirationGroups.map(group => (
                            <button
                                key={group.expiration_date}
                                onClick={() => setSelectedExpiration(group.expiration_date)}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                    selectedExpiration === group.expiration_date
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                )}
                            >
                                {new Date(group.expiration_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                                <span className="ml-2 text-xs opacity-70">({group.days_to_expiration}d)</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Show:</span>
                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showITM}
                                onChange={(e) => setShowITM(e.target.checked)}
                                className="rounded"
                            />
                            ITM
                        </label>
                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showATM}
                                onChange={(e) => setShowATM(e.target.checked)}
                                className="rounded"
                            />
                            ATM
                        </label>
                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showOTM}
                                onChange={(e) => setShowOTM(e.target.checked)}
                                className="rounded"
                            />
                            OTM
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold">Min Volume:</label>
                        <input
                            type="number"
                            value={minVolume}
                            onChange={(e) => setMinVolume(Number(e.target.value))}
                            className="w-24 px-2 py-1 text-sm border rounded"
                            min="0"
                            step="10"
                        />
                    </div>
                </div>
            </div>

            {/* Options Chain Table */}
            <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-secondary border-b">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide">
                        {/* Calls Header */}
                        <div className="grid grid-cols-8 gap-2 text-right">
                            <div>Bid</div>
                            <div>Ask</div>
                            <div>Last</div>
                            <div>Vol</div>
                            <div>OI</div>
                            <div>IV</div>
                            <div>Δ</div>
                            <div>Θ</div>
                        </div>

                        {/* Strike Header */}
                        <div className="px-4 text-center">Strike</div>

                        {/* Puts Header */}
                        <div className="grid grid-cols-8 gap-2">
                            <div>Θ</div>
                            <div>Δ</div>
                            <div>IV</div>
                            <div>OI</div>
                            <div>Vol</div>
                            <div>Last</div>
                            <div>Ask</div>
                            <div>Bid</div>
                        </div>
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y max-h-[600px] overflow-y-auto">
                    {filteredStrikes.map(group => {
                        const isATM = Math.abs(group.strike - underlyingPrice) / underlyingPrice < 0.05;
                        const call = group.call;
                        const put = group.put;

                        return (
                            <div
                                key={group.strike}
                                className={cn(
                                    "grid grid-cols-[1fr_auto_1fr] gap-2 px-4 py-2 hover:bg-secondary/20 transition-colors",
                                    isATM && "bg-yellow-500/10 border-l-4 border-yellow-500"
                                )}
                            >
                                {/* Call Side */}
                                <div
                                    onClick={() => call && handleContractClick(call)}
                                    className={cn(
                                        "grid grid-cols-8 gap-2 text-right text-sm font-mono cursor-pointer",
                                        call && group.strike < underlyingPrice && "bg-green-500/5"
                                    )}
                                >
                                    <div>{call?.bid_price?.toFixed(2) || '-'}</div>
                                    <div>{call?.ask_price?.toFixed(2) || '-'}</div>
                                    <div className="font-semibold">{call?.last_price?.toFixed(2) || '-'}</div>
                                    <div className="flex items-center gap-1 justify-end">
                                        {call?.volume || '-'}
                                        {call && call.volume && call.volume > 1000 && (
                                            <Volume2 className="h-3 w-3 text-green-500" />
                                        )}
                                    </div>
                                    <div>{call?.open_interest || '-'}</div>
                                    <div>{call?.implied_volatility ? (call.implied_volatility * 100).toFixed(1) + '%' : '-'}</div>
                                    <div className={call?.greeks?.delta && call.greeks.delta > 0 ? 'text-green-500' : ''}>{call?.greeks?.delta?.toFixed(2) || '-'}</div>
                                    <div className="text-red-500">{call?.greeks?.theta?.toFixed(2) || '-'}</div>
                                </div>

                                {/* Strike Price */}
                                <div className={cn(
                                    "px-4 text-center font-bold text-base",
                                    isATM && "text-yellow-600 dark:text-yellow-400"
                                )}>
                                    ${group.strike.toFixed(2)}
                                </div>

                                {/* Put Side */}
                                <div
                                    onClick={() => put && handleContractClick(put)}
                                    className={cn(
                                        "grid grid-cols-8 gap-2 text-sm font-mono cursor-pointer",
                                        put && group.strike > underlyingPrice && "bg-red-500/5"
                                    )}
                                >
                                    <div className="text-red-500">{put?.greeks?.theta?.toFixed(2) || '-'}</div>
                                    <div className={put?.greeks?.delta && put.greeks.delta < 0 ? 'text-red-500' : ''}>{put?.greeks?.delta?.toFixed(2) || '-'}</div>
                                    <div>{put?.implied_volatility ? (put.implied_volatility * 100).toFixed(1) + '%' : '-'}</div>
                                    <div>{put?.open_interest || '-'}</div>
                                    <div className="flex items-center gap-1">
                                        {put?.volume || '-'}
                                        {put && put.volume && put.volume > 1000 && (
                                            <Volume2 className="h-3 w-3 text-red-500" />
                                        )}
                                    </div>
                                    <div className="font-semibold">{put?.last_price?.toFixed(2) || '-'}</div>
                                    <div>{put?.ask_price?.toFixed(2) || '-'}</div>
                                    <div>{put?.bid_price?.toFixed(2) || '-'}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {filteredStrikes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No contracts match the current filters
                </div>
            )}
        </div>
    );
}
