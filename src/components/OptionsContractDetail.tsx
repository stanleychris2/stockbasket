'use client';

import { useState, useEffect } from 'react';
import type { OptionsContract } from '@/types/options';
import { GreeksDisplay } from './GreeksDisplay';
import { TrendingUp, TrendingDown, Volume2, Eye, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionsContractDetailProps {
    contractTicker: string;
}

export function OptionsContractDetail({ contractTicker }: OptionsContractDetailProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contract, setContract] = useState<OptionsContract | null>(null);
    const [underlyingPrice, setUnderlyingPrice] = useState<number | null>(null);

    useEffect(() => {
        const fetchContractData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch contract details
                const contractRes = await fetch(`/api/options/contract?ticker=${encodeURIComponent(contractTicker)}`);
                const contractResult = await contractRes.json();

                if (!contractResult.success) {
                    setError(contractResult.error || 'Failed to load contract details');
                    return;
                }

                setContract(contractResult.data);

                // Fetch underlying stock price
                if (contractResult.data.underlying_ticker) {
                    const quoteRes = await fetch(`/api/quote?symbols=${contractResult.data.underlying_ticker}`);
                    const quoteData = await quoteRes.json();
                    if (quoteData.stocks && quoteData.stocks.length > 0) {
                        setUnderlyingPrice(quoteData.stocks[0].regularMarketPrice);
                    }
                }
            } catch (err) {
                setError('Failed to fetch contract data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchContractData();
    }, [contractTicker]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading contract details...</p>
                </div>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="border-2 border-destructive/50 rounded-lg p-8 text-center">
                <p className="text-destructive font-semibold mb-2">Error loading contract</p>
                <p className="text-sm text-muted-foreground">{error || 'Contract not found'}</p>
            </div>
        );
    }

    const isCall = contract.contract_type === 'call';
    const expirationDate = new Date(contract.expiration_date);
    const daysToExpiration = Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpired = daysToExpiration < 0;

    // Calculate bid-ask spread
    const spread = contract.bid_price && contract.ask_price
        ? ((contract.ask_price - contract.bid_price) / contract.ask_price * 100)
        : null;

    // Determine if in the money
    const isITM = underlyingPrice
        ? (isCall ? contract.strike_price < underlyingPrice : contract.strike_price > underlyingPrice)
        : false;

    // Calculate break-even
    const breakEven = contract.break_even_price || (
        isCall && contract.last_price
            ? contract.strike_price + contract.last_price
            : !isCall && contract.last_price
                ? contract.strike_price - contract.last_price
                : null
    );

    return (
        <div className="space-y-6">
            {/* Contract Header */}
            <div className="border-2 rounded-lg p-6 bg-card">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            {contract.underlying_ticker} {expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${contract.strike_price.toFixed(2)} {isCall ? 'Call' : 'Put'}
                        </h2>
                        <p className="text-sm text-muted-foreground font-mono">{contractTicker}</p>
                        {isExpired && (
                            <div className="mt-2 inline-block px-3 py-1 bg-destructive/20 text-destructive text-sm font-semibold rounded">
                                EXPIRED
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        <div className="text-4xl font-bold font-mono">
                            ${contract.last_price?.toFixed(2) || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Last Price</div>
                    </div>
                </div>

                {/* Bid/Ask */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/30 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">Bid</div>
                        <div className="text-xl font-bold font-mono">${contract.bid_price?.toFixed(2) || '-'}</div>
                    </div>
                    <div className="bg-secondary/30 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">Ask</div>
                        <div className="text-xl font-bold font-mono">${contract.ask_price?.toFixed(2) || '-'}</div>
                    </div>
                </div>

                {/* Underlying Price */}
                {underlyingPrice && (
                    <div className="mt-4 p-3 bg-primary/10 rounded">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Underlying: {contract.underlying_ticker}</span>
                            <span className="text-lg font-bold font-mono">${underlyingPrice.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Days to Expiration"
                    value={isExpired ? 'Expired' : `${daysToExpiration} days`}
                    className={isExpired ? 'text-destructive' : daysToExpiration < 7 ? 'text-orange-500' : ''}
                />
                <StatCard
                    icon={<Volume2 className="h-4 w-4" />}
                    label="Volume"
                    value={contract.volume?.toLocaleString() || '-'}
                />
                <StatCard
                    icon={<Eye className="h-4 w-4" />}
                    label="Open Interest"
                    value={contract.open_interest?.toLocaleString() || '-'}
                />
                <StatCard
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Implied Volatility"
                    value={contract.implied_volatility ? `${(contract.implied_volatility * 100).toFixed(1)}%` : '-'}
                />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-card">
                    <div className="text-sm text-muted-foreground mb-2">Status</div>
                    <div className={cn(
                        "text-lg font-bold",
                        isITM ? (isCall ? "text-green-500" : "text-red-500") : "text-muted-foreground"
                    )}>
                        {isITM ? 'In The Money' : 'Out of The Money'}
                    </div>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                    <div className="text-sm text-muted-foreground mb-2">Break-Even Price</div>
                    <div className="text-lg font-bold font-mono">
                        {breakEven ? `$${breakEven.toFixed(2)}` : '-'}
                    </div>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                    <div className="text-sm text-muted-foreground mb-2">Bid/Ask Spread</div>
                    <div className={cn(
                        "text-lg font-bold",
                        spread !== null && spread < 2 ? "text-green-500" : spread !== null && spread > 5 ? "text-red-500" : ""
                    )}>
                        {spread !== null ? `${spread.toFixed(2)}%` : '-'}
                    </div>
                </div>
            </div>

            {/* Greeks */}
            {contract.greeks && (
                <div className="border-2 rounded-lg p-6 bg-card">
                    <h3 className="text-xl font-bold mb-4">Greeks</h3>
                    <GreeksDisplay greeks={contract.greeks} />
                </div>
            )}

            {/* Risk Analysis */}
            <div className="border rounded-lg p-6 bg-secondary/10">
                <h3 className="text-lg font-semibold mb-3">Quick Analysis</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5",
                            isITM ? "bg-green-500" : "bg-gray-500"
                        )}></div>
                        <div>
                            <strong>Moneyness:</strong> This {isCall ? 'call' : 'put'} is currently {isITM ? 'in-the-money' : 'out-of-the-money'}.
                            {underlyingPrice && ` The underlying is trading at $${underlyingPrice.toFixed(2)}, ${isCall ? 'above' : 'below'} the strike of $${contract.strike_price.toFixed(2)}.`}
                        </div>
                    </div>

                    {contract.greeks?.delta && (
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                            <div>
                                <strong>Delta:</strong> A delta of {contract.greeks.delta.toFixed(3)} means this option will move approximately ${Math.abs(contract.greeks.delta).toFixed(2)} for every $1 move in {contract.underlying_ticker}.
                            </div>
                        </div>
                    )}

                    {contract.greeks?.theta && (
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                            <div>
                                <strong>Time Decay:</strong> This option loses approximately ${Math.abs(contract.greeks.theta).toFixed(2)} in value per day due to time decay.
                            </div>
                        </div>
                    )}

                    {daysToExpiration > 0 && daysToExpiration < 30 && (
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                            <div>
                                <strong>Expiration Warning:</strong> This contract expires in {daysToExpiration} days. Time decay accelerates as expiration approaches.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Historical Note */}
            <div className="text-center text-sm text-muted-foreground p-4 border-t">
                Historical price charts coming soon. Track option premium changes over time.
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    className
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    className?: string;
}) {
    return (
        <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {icon}
                <span className="text-xs font-semibold">{label}</span>
            </div>
            <div className={cn("text-xl font-bold", className)}>{value}</div>
        </div>
    );
}
