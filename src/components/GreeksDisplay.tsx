'use client';

import { Greeks } from '@/types/options';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface GreeksDisplayProps {
    greeks: Greeks;
    compact?: boolean;
}

const greekInfo = {
    delta: {
        name: 'Delta',
        symbol: 'Δ',
        description: 'Measures the rate of change in option price relative to $1 move in the underlying stock',
        interpretation: 'Delta ranges from 0-1 for calls, 0 to -1 for puts. A delta of 0.50 means the option moves $0.50 for every $1 move in the stock.',
        color: 'text-blue-500',
    },
    gamma: {
        name: 'Gamma',
        symbol: 'Γ',
        description: 'Measures the rate of change in delta for a $1 move in the underlying',
        interpretation: 'Higher gamma means delta changes more rapidly. Peaks at-the-money and increases as expiration approaches.',
        color: 'text-purple-500',
    },
    theta: {
        name: 'Theta',
        symbol: 'Θ',
        description: 'Measures time decay - how much option value decreases per day',
        interpretation: 'Negative for long positions. Shows daily premium erosion. Accelerates near expiration.',
        color: 'text-red-500',
    },
    vega: {
        name: 'Vega',
        symbol: 'ν',
        description: 'Measures sensitivity to 1% change in implied volatility',
        interpretation: 'Higher vega means the option is more sensitive to volatility changes. Peaks at-the-money.',
        color: 'text-green-500',
    },
    rho: {
        name: 'Rho',
        symbol: 'ρ',
        description: 'Measures sensitivity to 1% change in interest rates',
        interpretation: 'Usually the least impactful Greek for short-term options. More relevant for LEAPS.',
        color: 'text-gray-500',
    },
};

export function GreeksDisplay({ greeks, compact = false }: GreeksDisplayProps) {
    const [hoveredGreek, setHoveredGreek] = useState<string | null>(null);

    if (compact) {
        return (
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Δ</span>
                    <span className="font-mono font-semibold">{greeks.delta.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Θ</span>
                    <span className="font-mono font-semibold">{greeks.theta.toFixed(3)}</span>
                </div>
                {greeks.gamma !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Γ</span>
                        <span className="font-mono font-semibold">{greeks.gamma.toFixed(3)}</span>
                    </div>
                )}
            </div>
        );
    }

    const greekEntries = [
        { key: 'delta', value: greeks.delta },
        { key: 'gamma', value: greeks.gamma },
        { key: 'theta', value: greeks.theta },
        { key: 'vega', value: greeks.vega },
        ...(greeks.rho !== undefined ? [{ key: 'rho', value: greeks.rho }] : []),
    ];

    // Normalize values for visualization (absolute values)
    const maxAbsValue = Math.max(...greekEntries.map(g => Math.abs(g.value)));

    return (
        <div className="space-y-3">
            {greekEntries.map(({ key, value }) => {
                const info = greekInfo[key as keyof typeof greekInfo];
                const normalizedWidth = maxAbsValue > 0 ? (Math.abs(value) / maxAbsValue) * 100 : 0;
                const isNegative = value < 0;

                return (
                    <div
                        key={key}
                        className="relative"
                        onMouseEnter={() => setHoveredGreek(key)}
                        onMouseLeave={() => setHoveredGreek(null)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${info.color}`}>{info.name}</span>
                                <span className="text-2xl text-muted-foreground">{info.symbol}</span>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </div>
                            <span className="font-mono font-bold text-lg">
                                {value.toFixed(4)}
                            </span>
                        </div>

                        {/* Visual indicator bar */}
                        <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isNegative ? 'bg-red-500/70' : info.color.replace('text-', 'bg-')
                                    }`}
                                style={{ width: `${normalizedWidth}%` }}
                            />
                        </div>

                        {/* Tooltip on hover */}
                        {hoveredGreek === key && (
                            <div className="absolute z-10 left-0 top-full mt-2 w-full max-w-md p-3 bg-popover border rounded-md shadow-lg text-sm">
                                <p className="font-semibold mb-1">{info.description}</p>
                                <p className="text-muted-foreground text-xs">{info.interpretation}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
